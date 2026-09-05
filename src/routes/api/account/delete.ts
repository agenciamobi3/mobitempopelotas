import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  isSameOriginRequest,
  pushJsonResponse,
  readLimitedJson,
} from "@/lib/push/push-http.server";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const deleteAccountSchema = z.object({
  confirmation: z.literal("EXCLUIR MINHA CONTA"),
});

const CONTRIBUTION_BUCKET = "historical-contributions";
const STORAGE_PAGE_SIZE = 100;

async function listContributionFiles(
  bucket: ReturnType<typeof createSupabaseAdminClient>["storage"] extends infer _Storage
    ? ReturnType<ReturnType<typeof createSupabaseAdminClient>["storage"]["from"]>
    : never,
  prefix: string,
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await bucket.list(prefix, {
      limit: STORAGE_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;

    const entries = data ?? [];
    if (entries.length === 0) return paths;

    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id) {
        paths.push(path);
      } else {
        paths.push(...(await listContributionFiles(bucket, path)));
      }
    }

    if (entries.length < STORAGE_PAGE_SIZE) return paths;
    offset += entries.length;
  }
}

async function removeHistoricalContributionFiles(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
) {
  const bucket = admin.storage.from(CONTRIBUTION_BUCKET);
  const paths = await listContributionFiles(bucket, userId);

  for (let index = 0; index < paths.length; index += STORAGE_PAGE_SIZE) {
    const { error } = await bucket.remove(paths.slice(index, index + STORAGE_PAGE_SIZE));
    if (error) throw error;
  }
}

async function deleteAccount(request: Request) {
  if (!isSameOriginRequest(request)) {
    return pushJsonResponse({ success: false, error: "Origem não permitida." }, 403);
  }

  const body = await readLimitedJson(request);
  if (!body.ok) {
    return pushJsonResponse({ success: false, error: body.error }, body.status);
  }

  const parsed = deleteAccountSchema.safeParse(body.value);
  if (!parsed.success) {
    return pushJsonResponse(
      {
        success: false,
        error: "Digite exatamente EXCLUIR MINHA CONTA para confirmar.",
      },
      400,
    );
  }

  const config = getSupabaseServerConfig();
  if (!config.isPublicConfigured || !config.isAdminConfigured) {
    return pushJsonResponse(
      { success: false, error: "A exclusão de conta não está disponível neste ambiente." },
      503,
    );
  }

  const { client, responseHeaders } = createSupabaseRequestClient(request);
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return pushJsonResponse(
      { success: false, error: "Sua sessão precisa ser validada novamente." },
      401,
      responseHeaders,
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    await removeHistoricalContributionFiles(admin, user.id);

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    const { error: signOutError } = await client.auth.signOut({ scope: "local" });
    if (signOutError) {
      console.warn("[account/delete] Conta removida, mas a limpeza local da sessão falhou", {
        status: signOutError.status,
        message: signOutError.message,
      });
    }

    return pushJsonResponse(
      {
        success: true,
        message:
          "A conta, as preferências, o histórico de consentimentos, as inscrições e as contribuições históricas vinculadas foram removidos.",
      },
      200,
      responseHeaders,
    );
  } catch (error) {
    console.error("[account/delete] Falha ao excluir conta", {
      message: error instanceof Error ? error.message : String(error),
    });
    return pushJsonResponse(
      { success: false, error: "Não foi possível excluir a conta agora." },
      500,
      responseHeaders,
    );
  }
}

export const Route = createFileRoute("/api/account/delete")({
  server: {
    handlers: {
      POST: ({ request }) => deleteAccount(request),
    },
  },
});
