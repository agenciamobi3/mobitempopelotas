import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { resolveAccountAccess, type EffectiveAccountAccess } from "@/lib/auth/account-access";
import {
  FAVORITE_RESOURCE_KEYS,
  getFavoriteResource,
  isFavoriteResourceKey,
  type FavoriteResourceKey,
  type FavoriteResourceType,
} from "@/lib/auth/favorite-resources";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

const favoriteResourceKeySchema = z.enum(FAVORITE_RESOURCE_KEYS);
const setFavoriteSchema = z.object({
  resourceKey: favoriteResourceKeySchema,
  active: z.boolean(),
});

export type UserFavoriteRow = {
  id: string;
  user_id: string;
  resource_key: string;
  resource_type: FavoriteResourceType;
  created_at: string;
};

export type FavoriteDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      user_favorites: {
        Row: UserFavoriteRow;
        Insert: {
          id?: string;
          user_id: string;
          resource_key: string;
          resource_type: FavoriteResourceType;
          created_at?: string;
        };
        Update: Partial<Omit<UserFavoriteRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
  };
};

export type AccountFavoritesSnapshot =
  | { status: "unavailable" }
  | { status: "unauthenticated" }
  | {
      status: "authenticated";
      storageReady: boolean;
      enabled: boolean;
      favoriteKeys: FavoriteResourceKey[];
    };

type AccountRequestClient = ReturnType<typeof createSupabaseRequestClient>["client"];

function applyPrivateHeaders(headers: Headers) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

async function loadFavoriteAccess(
  client: AccountRequestClient,
  userId: string,
): Promise<{ access: EffectiveAccountAccess | null; failed: boolean }> {
  let result = await client
    .from("account_access")
    .select("tier,status,source,valid_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (!result.error && !result.data) {
    const repair = await client.rpc("ensure_current_user_account_foundation");
    if (!repair.error) {
      result = await client
        .from("account_access")
        .select("tier,status,source,valid_until")
        .eq("user_id", userId)
        .maybeSingle();
    }
  }

  if (result.error || !result.data) {
    if (result.error) {
      console.error("[favorites] Falha ao consultar acesso da conta", {
        code: result.error.code,
        message: result.error.message,
      });
    }
    return { access: null, failed: true };
  }

  return {
    access: resolveAccountAccess({
      tier: result.data.tier,
      status: result.data.status,
      source: result.data.source,
      validUntil: result.data.valid_until,
    }),
    failed: false,
  };
}

export const getAccountFavorites = createServerFn({ method: "GET" }).handler(
  async (): Promise<AccountFavoritesSnapshot> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyPrivateHeaders(new Headers());
      return { status: "unavailable" };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      applyPrivateHeaders(responseHeaders);
      return { status: "unauthenticated" };
    }

    const { access, failed } = await loadFavoriteAccess(client, user.id);
    if (failed || !access) {
      applyPrivateHeaders(responseHeaders);
      return {
        status: "authenticated",
        storageReady: false,
        enabled: false,
        favoriteKeys: [],
      };
    }

    if (!access.entitlements.favorites) {
      applyPrivateHeaders(responseHeaders);
      return {
        status: "authenticated",
        storageReady: true,
        enabled: false,
        favoriteKeys: [],
      };
    }

    const favoriteClient = client as unknown as SupabaseClient<FavoriteDatabase>;
    const { data, error } = await favoriteClient
      .from("user_favorites")
      .select("resource_key")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    applyPrivateHeaders(responseHeaders);

    if (error) {
      console.error("[favorites] Falha ao listar favoritos da conta", {
        code: error.code,
        message: error.message,
      });
      return {
        status: "authenticated",
        storageReady: false,
        enabled: true,
        favoriteKeys: [],
      };
    }

    return {
      status: "authenticated",
      storageReady: true,
      enabled: true,
      favoriteKeys: (data ?? []).flatMap((row) =>
        isFavoriteResourceKey(row.resource_key) ? [row.resource_key] : [],
      ),
    };
  },
);

export const setAccountFavorite = createServerFn({ method: "POST" })
  .validator(setFavoriteSchema)
  .handler(async ({ data }) => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyPrivateHeaders(new Headers());
      return { ok: false as const, code: "unavailable" as const };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "unauthenticated" as const };
    }

    const { access, failed } = await loadFavoriteAccess(client, user.id);
    if (failed || !access) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "storage" as const };
    }
    if (!access.entitlements.favorites) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "not_entitled" as const };
    }

    const resource = getFavoriteResource(data.resourceKey);
    if (!resource) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "unsupported" as const };
    }

    const favoriteClient = client as unknown as SupabaseClient<FavoriteDatabase>;
    const operation = data.active
      ? favoriteClient.from("user_favorites").upsert(
          {
            user_id: user.id,
            resource_key: resource.key,
            resource_type: resource.type,
          },
          { onConflict: "user_id,resource_key", ignoreDuplicates: true },
        )
      : favoriteClient
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("resource_key", resource.key);

    const { error } = await operation;
    applyPrivateHeaders(responseHeaders);

    if (error) {
      console.error("[favorites] Falha ao atualizar favorito da conta", {
        code: error.code,
        message: error.message,
        resourceKey: resource.key,
      });
      return { ok: false as const, code: "storage" as const };
    }

    return { ok: true as const, resourceKey: resource.key, active: data.active };
  });
