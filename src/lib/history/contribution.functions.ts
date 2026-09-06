import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import type { ContributionDatabase } from "@/lib/history/contribution-database";
import { getHistoricalCollaborationContext } from "@/lib/history/historical-collaboration";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

const contributionKindSchema = z.enum([
  "source",
  "photo",
  "document",
  "testimony",
  "correction",
  "measurement",
  "other",
]);

const attachmentSchema = z.object({
  path: z.string().min(1).max(500),
  name: z.string().min(1).max(240),
  mime: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]),
  size: z.number().int().positive().max(15 * 1024 * 1024),
});

const createContributionSchema = z.object({
  id: z.string().uuid(),
  pagePath: z.string().min(1).max(200),
  kind: contributionKindSchema,
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(8000),
  locationText: z.string().trim().max(240).optional().default(""),
  dateLabel: z.string().trim().max(120).optional().default(""),
  sourceUrl: z.union([z.literal(""), z.string().url().max(1200)]).optional().default(""),
  creditName: z.string().trim().max(120).optional().default(""),
  publishAnonymously: z.boolean().default(false),
  attachments: z.array(attachmentSchema).max(5),
  rightsConfirmed: z.literal(true),
  publicationAuthorized: z.boolean().default(false),
});

export type HistoricalContributionKind = z.infer<typeof contributionKindSchema>;
export type HistoricalContributionAttachment = z.infer<typeof attachmentSchema>;
export type CreateHistoricalContributionInput = z.infer<typeof createContributionSchema>;

function nullable(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function applyPrivateResponseHeaders(headers: Headers) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

export const createHistoricalContribution = createServerFn({ method: "POST" })
  .validator(createContributionSchema)
  .handler(async ({ data }) => {
    const context = getHistoricalCollaborationContext(data.pagePath);
    if (!context) {
      return { ok: false as const, code: "invalid_page" as const };
    }

    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      return { ok: false as const, code: "unavailable" as const };
    }

    const { client: rawClient, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
      error: userError,
    } = await rawClient.auth.getUser();

    applyPrivateResponseHeaders(responseHeaders);

    if (userError || !user) {
      return { ok: false as const, code: "unauthenticated" as const };
    }

    const expectedPrefix = `${user.id}/${data.id}/`;
    if (data.attachments.some((attachment) => !attachment.path.startsWith(expectedPrefix))) {
      return { ok: false as const, code: "invalid_attachment" as const };
    }

    const client = rawClient as unknown as SupabaseClient<ContributionDatabase>;
    const { error } = await client.from("historical_contributions").insert({
      id: data.id,
      user_id: user.id,
      page_path: context.pagePath,
      page_title: context.pageTitle,
      event_year: context.eventYear,
      kind: data.kind,
      title: data.title,
      description: data.description,
      location_text: nullable(data.locationText),
      date_label: nullable(data.dateLabel),
      source_url: nullable(data.sourceUrl),
      credit_name: nullable(data.creditName),
      publish_anonymously: data.publishAnonymously,
      attachments: data.attachments,
      rights_confirmed: true,
      publication_authorized: data.publicationAuthorized,
      status: "pending",
      moderation_note: null,
      reviewed_at: null,
    });

    if (error) {
      console.error("[history-contribution] Falha ao registrar contribuição", {
        code: error.code,
        message: error.message,
      });
      return { ok: false as const, code: "storage_error" as const };
    }

    return { ok: true as const, id: data.id };
  });
