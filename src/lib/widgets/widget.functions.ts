import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { resolveAccountAccess, type EffectiveAccountAccess } from "@/lib/auth/account-access";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import {
  createSupabasePublicServerClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";
import {
  createAppearanceFromPreset,
  normalizeWidgetAppearance,
  widgetThemeForAppearance,
  withWidgetAppearanceConfig,
  WIDGET_DENSITY_KEYS,
  WIDGET_STYLE_PRESET_KEYS,
  type WidgetAppearance,
} from "./widget-appearance";
import {
  createDefaultWidgetContent,
  getWidgetContentCatalog,
  normalizeWidgetContent,
  withWidgetContentConfig,
  WIDGET_PRESENTATION_KEYS,
  type WidgetContentDefinition,
} from "./widget-content";
import {
  canUseWidgetType,
  getWidgetDefinition,
  isWidgetType,
  WIDGET_REGISTRY,
  type WidgetTheme,
  type WidgetType,
} from "./widget-registry";

const SITE_ORIGIN = "https://tempopelotas.com.br";
const EMBED_SCRIPT_URL = `${SITE_ORIGIN}/widgets/embed.js`;

const widgetTypeSchema = z
  .string()
  .refine(isWidgetType, "Módulo de widget inválido")
  .transform((value) => value as WidgetType);
const widgetThemeSchema = z.enum(["auto", "light", "dark"]);
const widgetAppearanceSchema = z.object({
  preset: z.enum(WIDGET_STYLE_PRESET_KEYS),
  accentColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Cor de destaque inválida")
    .transform((value) => value.toUpperCase()),
  radius: z.number().int().min(0).max(36),
  density: z.enum(WIDGET_DENSITY_KEYS),
});
const widgetContentSchema = z.object({
  presentation: z.enum(WIDGET_PRESENTATION_KEYS),
  visibleBlocks: z.array(z.string().trim().min(1).max(48)).min(1).max(8),
});

const createWidgetSchema = z.object({
  widgetType: widgetTypeSchema,
  title: z.string().trim().min(1).max(100),
  theme: widgetThemeSchema.optional(),
  appearance: widgetAppearanceSchema.optional(),
  content: widgetContentSchema.optional(),
});

const updateWidgetAppearanceSchema = z.object({
  id: z.string().uuid(),
  appearance: widgetAppearanceSchema,
  content: widgetContentSchema.optional(),
});

const setWidgetStatusSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});

const publicWidgetSchema = z.object({ token: z.string().uuid() });

type UserWidgetRow = {
  id: string;
  user_id: string;
  public_token: string;
  widget_type: string;
  title: string;
  theme: string;
  config: Json;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
};

type PublicWidgetRow = Pick<
  UserWidgetRow,
  "public_token" | "widget_type" | "title" | "theme" | "config" | "version" | "updated_at"
>;

type WidgetDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      user_widgets: {
        Row: UserWidgetRow;
        Insert: {
          id?: string;
          user_id: string;
          public_token?: string;
          widget_type: string;
          title: string;
          theme?: string;
          config?: Json;
          status?: string;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserWidgetRow, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      get_public_widget: {
        Args: { p_token: string };
        Returns: PublicWidgetRow[];
      };
    };
  };
};

export type ManagedWidget = {
  id: string;
  publicToken: string;
  widgetType: WidgetType;
  title: string;
  theme: WidgetTheme;
  appearance: WidgetAppearance;
  content: WidgetContentDefinition;
  status: "active" | "inactive";
  version: number;
  createdAt: string;
  updatedAt: string;
  embedUrl: string;
  embedCode: string;
};

export type WidgetManagerSnapshot =
  | { status: "unavailable" }
  | { status: "unauthenticated" }
  | {
      status: "authenticated";
      access: EffectiveAccountAccess;
      widgets: ManagedWidget[];
      modules: Array<{
        type: WidgetType;
        label: string;
        description: string;
        category: string;
        defaultTitle: string;
        enabled: boolean;
      }>;
    };

export type PublicWidgetDefinition = {
  publicToken: string;
  widgetType: WidgetType;
  title: string;
  theme: WidgetTheme;
  appearance: WidgetAppearance;
  content: WidgetContentDefinition;
  config: Json;
  version: number;
  updatedAt: string;
};

function applyPrivateHeaders(headers: Headers) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

function mapTheme(value: string): WidgetTheme {
  return value === "light" || value === "dark" ? value : "auto";
}

function fallbackAppearanceFromLegacyTheme(theme: string): WidgetAppearance {
  return createAppearanceFromPreset(theme === "light" ? "clean-light" : "tempo-dark");
}

function hasStoredAppearanceConfig(config: Json) {
  return (
    typeof config === "object" &&
    config !== null &&
    !Array.isArray(config) &&
    "appearance" in config
  );
}

function resolveRowAppearance(row: Pick<UserWidgetRow, "config" | "theme">): WidgetAppearance {
  return hasStoredAppearanceConfig(row.config)
    ? normalizeWidgetAppearance(row.config)
    : fallbackAppearanceFromLegacyTheme(row.theme);
}

function requestedContentIsAllowed(type: WidgetType, content: WidgetContentDefinition) {
  const allowed = new Set(getWidgetContentCatalog(type).blocks.map((block) => block.key));
  return content.visibleBlocks.length > 0 && content.visibleBlocks.every((block) => allowed.has(block));
}

function resolveRowContent(row: Pick<UserWidgetRow, "widget_type" | "config">) {
  if (!isWidgetType(row.widget_type)) return null;
  return normalizeWidgetContent(row.widget_type, row.config);
}

function mapManagedWidget(row: UserWidgetRow): ManagedWidget | null {
  if (!isWidgetType(row.widget_type)) return null;
  const publicToken = row.public_token;
  const appearance = resolveRowAppearance(row);
  const content = resolveRowContent(row) ?? createDefaultWidgetContent(row.widget_type);
  return {
    id: row.id,
    publicToken,
    widgetType: row.widget_type,
    title: row.title,
    theme: mapTheme(row.theme),
    appearance,
    content,
    status: row.status === "inactive" ? "inactive" : "active",
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    embedUrl: `${SITE_ORIGIN}/embed/widget?token=${encodeURIComponent(publicToken)}&v=${row.version}`,
    embedCode: `<script src="${EMBED_SCRIPT_URL}" data-widget="${publicToken}" async></script>`,
  };
}

async function loadAccess(
  client: ReturnType<typeof createSupabaseRequestClient>["client"],
  userId: string,
) {
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

  const row = result.data;
  return resolveAccountAccess(
    row
      ? {
          tier: row.tier,
          status: row.status,
          source: row.source,
          validUntil: row.valid_until,
        }
      : null,
  );
}

export const getWidgetManagerSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<WidgetManagerSnapshot> => {
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

    const access = await loadAccess(client, user.id);
    const widgetClient = client as unknown as SupabaseClient<WidgetDatabase>;
    const { data, error } = await widgetClient
      .from("user_widgets")
      .select("id,user_id,public_token,widget_type,title,theme,config,status,version,created_at,updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    applyPrivateHeaders(responseHeaders);

    if (error) {
      console.error("[widgets] Falha ao listar widgets do usuário", {
        code: error.code,
        message: error.message,
      });
    }

    return {
      status: "authenticated",
      access,
      widgets: (data ?? []).flatMap((row) => {
        const widget = mapManagedWidget(row);
        return widget ? [widget] : [];
      }),
      modules: WIDGET_REGISTRY.map((definition) => ({
        type: definition.type,
        label: definition.label,
        description: definition.description,
        category: definition.category,
        defaultTitle: definition.defaultTitle,
        enabled: canUseWidgetType(access.entitlements, definition.type),
      })),
    };
  },
);

export const createUserWidget = createServerFn({ method: "POST" })
  .validator(createWidgetSchema)
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

    const access = await loadAccess(client, user.id);
    const definition = getWidgetDefinition(data.widgetType);
    if (
      !definition ||
      !access.entitlements.widgetsCreate ||
      !canUseWidgetType(access.entitlements, data.widgetType) ||
      ((data.appearance || data.content) && !access.entitlements.widgetsAdvancedThemes)
    ) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "not_entitled" as const };
    }

    if (data.content && !requestedContentIsAllowed(data.widgetType, data.content)) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "invalid_config" as const };
    }

    const widgetClient = client as unknown as SupabaseClient<WidgetDatabase>;
    if (access.entitlements.widgetsMax !== null) {
      const { count, error: countError } = await widgetClient
        .from("user_widgets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (countError) {
        applyPrivateHeaders(responseHeaders);
        return { ok: false as const, code: "storage" as const };
      }
      if ((count ?? 0) >= access.entitlements.widgetsMax) {
        applyPrivateHeaders(responseHeaders);
        return { ok: false as const, code: "limit" as const };
      }
    }

    const appearance = data.appearance ?? fallbackAppearanceFromLegacyTheme(data.theme ?? "auto");
    const content = data.content
      ? normalizeWidgetContent(data.widgetType, { content: data.content })
      : createDefaultWidgetContent(data.widgetType);
    const appearanceConfig = withWidgetAppearanceConfig({}, appearance);
    const widgetConfig = withWidgetContentConfig(appearanceConfig, data.widgetType, content);
    const { data: created, error } = await widgetClient
      .from("user_widgets")
      .insert({
        user_id: user.id,
        widget_type: data.widgetType,
        title: data.title,
        theme: widgetThemeForAppearance(appearance),
        config: widgetConfig,
      })
      .select("id,user_id,public_token,widget_type,title,theme,config,status,version,created_at,updated_at")
      .single();

    applyPrivateHeaders(responseHeaders);

    if (error || !created) {
      console.error("[widgets] Falha ao criar widget", {
        code: error?.code,
        message: error?.message,
      });
      return { ok: false as const, code: "storage" as const };
    }

    const widget = mapManagedWidget(created);
    if (!widget) return { ok: false as const, code: "unsupported" as const };
    return { ok: true as const, widget };
  });

export const updateUserWidgetAppearance = createServerFn({ method: "POST" })
  .validator(updateWidgetAppearanceSchema)
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

    const access = await loadAccess(client, user.id);
    if (!access.entitlements.widgetsAccess || !access.entitlements.widgetsAdvancedThemes) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "not_entitled" as const };
    }

    const widgetClient = client as unknown as SupabaseClient<WidgetDatabase>;
    const { data: current, error: currentError } = await widgetClient
      .from("user_widgets")
      .select("id,user_id,public_token,widget_type,title,theme,config,status,version,created_at,updated_at")
      .eq("id", data.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentError || !current || !isWidgetType(current.widget_type)) {
      applyPrivateHeaders(responseHeaders);
      return {
        ok: false as const,
        code: currentError ? ("storage" as const) : ("not_found" as const),
      };
    }

    if (!canUseWidgetType(access.entitlements, current.widget_type)) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "not_entitled" as const };
    }

    if (data.content && !requestedContentIsAllowed(current.widget_type, data.content)) {
      applyPrivateHeaders(responseHeaders);
      return { ok: false as const, code: "invalid_config" as const };
    }

    const nextVersion = current.version + 1;
    const content = data.content
      ? normalizeWidgetContent(current.widget_type, { content: data.content })
      : normalizeWidgetContent(current.widget_type, current.config);
    const appearanceConfig = withWidgetAppearanceConfig(current.config, data.appearance);
    const nextConfig = withWidgetContentConfig(appearanceConfig, current.widget_type, content);
    const { data: updated, error } = await widgetClient
      .from("user_widgets")
      .update({
        config: nextConfig,
        theme: widgetThemeForAppearance(data.appearance),
        version: nextVersion,
      })
      .eq("id", data.id)
      .eq("user_id", user.id)
      .eq("version", current.version)
      .select("id,user_id,public_token,widget_type,title,theme,config,status,version,created_at,updated_at")
      .maybeSingle();

    applyPrivateHeaders(responseHeaders);

    if (error) {
      console.error("[widgets] Falha ao atualizar estilo do widget", {
        code: error.code,
        message: error.message,
      });
      return { ok: false as const, code: "storage" as const };
    }

    if (!updated) return { ok: false as const, code: "conflict" as const };
    const widget = mapManagedWidget(updated);
    if (!widget) return { ok: false as const, code: "unsupported" as const };
    return { ok: true as const, widget };
  });

export const setUserWidgetActive = createServerFn({ method: "POST" })
  .validator(setWidgetStatusSchema)
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

    const widgetClient = client as unknown as SupabaseClient<WidgetDatabase>;
    const { error } = await widgetClient
      .from("user_widgets")
      .update({ status: data.active ? "active" : "inactive" })
      .eq("id", data.id)
      .eq("user_id", user.id);

    applyPrivateHeaders(responseHeaders);

    if (error) {
      console.error("[widgets] Falha ao alterar status do widget", {
        code: error.code,
        message: error.message,
      });
      return { ok: false as const, code: "storage" as const };
    }

    return { ok: true as const };
  });

export const getPublicWidgetDefinition = createServerFn({ method: "GET" })
  .validator(publicWidgetSchema)
  .handler(async ({ data }): Promise<PublicWidgetDefinition | null> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) return null;

    const client = createSupabasePublicServerClient() as unknown as SupabaseClient<WidgetDatabase>;
    const { data: rows, error } = await client.rpc("get_public_widget", { p_token: data.token });
    if (error) {
      console.warn("[widgets] Não foi possível resolver widget público", {
        code: error.code,
        message: error.message,
      });
      return null;
    }

    const row = rows?.[0];
    if (!row || !isWidgetType(row.widget_type)) return null;

    setResponseHeaders(
      new Headers({
        "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
        "CDN-Cache-Control": "max-age=60, stale-while-revalidate=240",
      }),
    );

    return {
      publicToken: row.public_token,
      widgetType: row.widget_type,
      title: row.title,
      theme: mapTheme(row.theme),
      appearance: resolveRowAppearance({ config: row.config, theme: row.theme }),
      content: normalizeWidgetContent(row.widget_type, row.config),
      config: row.config,
      version: row.version,
      updatedAt: row.updated_at,
    };
  });
