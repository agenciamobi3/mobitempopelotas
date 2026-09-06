import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authorizePortalOperator } from "@/lib/admin/operator-authorization.server";
import type { ContributionDatabase } from "@/lib/history/contribution-database";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/server-client.server";

const moderationStatusSchema = z.enum(["reviewing", "accepted", "rejected"]);
const moderateContributionSchema = z.object({
  id: z.string().uuid(),
  status: moderationStatusSchema,
  moderationNote: z.string().trim().max(2000).optional().default(""),
});

type ModerationAttachment = {
  path: string;
  name: string;
  mime: string;
  size: number;
  signedUrl: string | null;
};

export type HistoricalModerationItem = {
  id: string;
  pagePath: string;
  pageTitle: string;
  eventYear: number | null;
  kind: string;
  title: string;
  description: string;
  locationText: string | null;
  dateLabel: string | null;
  sourceUrl: string | null;
  creditName: string | null;
  publishAnonymously: boolean;
  rightsConfirmed: boolean;
  publicationAuthorized: boolean;
  status: string;
  moderationNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  attachments: ModerationAttachment[];
};

export type HistoricalModerationSnapshot =
  | { status: "authorized"; items: HistoricalModerationItem[]; truncated: boolean }
  | { status: "unauthenticated" | "forbidden" | "unavailable" };

function contributionClient() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<ContributionDatabase>;
}

function parseAttachments(value: Json): Omit<ModerationAttachment, "signedUrl">[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const candidate = item as Record<string, Json | undefined>;
    const path = typeof candidate.path === "string" ? candidate.path : "";
    const name = typeof candidate.name === "string" ? candidate.name : "";
    const mime = typeof candidate.mime === "string" ? candidate.mime : "application/octet-stream";
    const size = typeof candidate.size === "number" && Number.isFinite(candidate.size) ? candidate.size : 0;
    if (!path || !name) return [];
    return [{ path, name, mime, size }];
  });
}

function safeSourceUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

async function signedAttachmentUrls(
  client: SupabaseClient<ContributionDatabase>,
  paths: readonly string[],
) {
  if (paths.length === 0) return new Map<string, string>();

  const { data, error } = await client.storage
    .from("historical-contributions")
    .createSignedUrls([...paths], 10 * 60);

  if (error || !data) return new Map<string, string>();

  return new Map(
    data.flatMap((item) =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [],
    ),
  );
}

export const getHistoricalModerationSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  const authorization = await authorizePortalOperator();
  if (authorization.status !== "authorized") {
    return { status: authorization.status } as HistoricalModerationSnapshot;
  }

  const client = contributionClient();
  const { data, error } = await client
    .from("historical_contributions")
    .select(
      "id,page_path,page_title,event_year,kind,title,description,location_text,date_label,source_url,credit_name,publish_anonymously,attachments,rights_confirmed,publication_authorized,status,moderation_note,created_at,reviewed_at",
    )
    .in("status", ["pending", "reviewing"])
    .order("created_at", { ascending: false })
    .limit(51);

  if (error || !data) {
    console.error("[history-moderation] Falha ao carregar fila", {
      code: error?.code,
      message: error?.message,
    });
    return { status: "unavailable" } as HistoricalModerationSnapshot;
  }

  const rows = data.slice(0, 50);
  const parsedAttachments = rows.map((row) => parseAttachments(row.attachments));
  const paths = [...new Set(parsedAttachments.flatMap((attachments) => attachments.map((item) => item.path)))];
  const signedUrls = await signedAttachmentUrls(client, paths);

  return {
    status: "authorized",
    truncated: data.length > rows.length,
    items: rows.map((row, index) => ({
      id: row.id,
      pagePath: row.page_path,
      pageTitle: row.page_title,
      eventYear: row.event_year,
      kind: row.kind,
      title: row.title,
      description: row.description,
      locationText: row.location_text,
      dateLabel: row.date_label,
      sourceUrl: safeSourceUrl(row.source_url),
      creditName: row.credit_name,
      publishAnonymously: row.publish_anonymously,
      rightsConfirmed: row.rights_confirmed,
      publicationAuthorized: row.publication_authorized,
      status: row.status,
      moderationNote: row.moderation_note,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      attachments: parsedAttachments[index].map((attachment) => ({
        ...attachment,
        signedUrl: signedUrls.get(attachment.path) ?? null,
      })),
    })),
  } satisfies HistoricalModerationSnapshot;
});

export const moderateHistoricalContribution = createServerFn({ method: "POST" })
  .validator(moderateContributionSchema)
  .handler(async ({ data }) => {
    const authorization = await authorizePortalOperator();
    if (authorization.status !== "authorized") {
      return { ok: false as const, code: authorization.status };
    }

    const moderationNote = data.moderationNote.trim() || null;
    const reviewedAt = data.status === "accepted" || data.status === "rejected"
      ? new Date().toISOString()
      : null;

    const client = contributionClient();
    const { data: updated, error } = await client
      .from("historical_contributions")
      .update({
        status: data.status,
        moderation_note: moderationNote,
        reviewed_at: reviewedAt,
      })
      .eq("id", data.id)
      .select("id,status,moderation_note,reviewed_at")
      .single();

    if (error || !updated) {
      console.error("[history-moderation] Falha ao moderar contribuição", {
        code: error?.code,
        message: error?.message,
      });
      return { ok: false as const, code: "storage_error" as const };
    }

    return {
      ok: true as const,
      item: {
        id: updated.id,
        status: updated.status,
        moderationNote: updated.moderation_note,
        reviewedAt: updated.reviewed_at,
      },
    };
  });
