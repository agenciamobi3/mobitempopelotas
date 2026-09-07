import { createHash } from "node:crypto";

import {
  claimPushDispatch,
  recordPushDispatch,
  releasePushDispatch,
  renewPushDispatch,
} from "@/lib/push/push-storage.server";
import type { PushDeliveryResult } from "@/lib/push/push.types";
import { broadcastPushNotification, getPushConfigurationStatus } from "@/lib/push/web-push.server";
import { fetchInmetForecast } from "@/lib/weather/inmet-forecast.server";

import {
  buildInmetForecastPushCopy,
  classifyInmetEmail,
  isTrustedInmetMessage,
} from "./inmet-gmail";

const LOVABLE_GMAIL_API_ROOT = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const FIXED_INMET_QUERY = "in:inbox -in:spam -in:trash from:(inmet.gov.br) newer_than:1d";
const MAX_MESSAGES_PER_RUN = 20;
const MAX_EMAIL_BODY_CHARS = 64_000;
const MAX_EMAIL_AGE_MINUTES = 360;
const CONNECTOR_TIMEOUT_MS = 10_000;

type GmailHeader = {
  name?: string;
  value?: string;
};

type GmailMessagePart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailMessagePart[];
};

type GmailMessage = {
  id?: string;
  threadId?: string;
  internalDate?: string;
  snippet?: string;
  payload?: GmailMessagePart;
};

type GmailListResponse = {
  messages?: Array<{ id?: string }>;
};

type LovableGmailConfiguration = {
  lovableApiKey: string;
  connectionApiKey: string;
};

export function getInmetGmailConfigurationStatus() {
  const required = ["LOVABLE_API_KEY", "GOOGLE_MAIL_API_KEY"] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());

  return {
    configured: missing.length === 0,
    missing,
    provider: "lovable-google-mail" as const,
  };
}

function requireConfiguration(): LovableGmailConfiguration {
  const status = getInmetGmailConfigurationStatus();
  if (!status.configured) {
    throw new Error(
      `Conector Gmail do Lovable não configurado para o Tempo Pelotas: ${status.missing.join(", ")}`,
    );
  }

  return {
    lovableApiKey: process.env.LOVABLE_API_KEY!.trim(),
    connectionApiKey: process.env.GOOGLE_MAIL_API_KEY!.trim(),
  };
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPartText(part: GmailMessagePart | undefined): string[] {
  if (!part) return [];

  const mimeType = part.mimeType?.toLowerCase() ?? "";
  const data = part.body?.data;
  const own =
    data && (mimeType === "text/plain" || mimeType === "text/html")
      ? [mimeType === "text/html" ? stripHtml(decodeBase64Url(data)) : decodeBase64Url(data)]
      : [];

  const nested = (part.parts ?? []).flatMap((child) => extractPartText(child));
  return [...own, ...nested].filter(Boolean);
}

function headerValues(part: GmailMessagePart | undefined, name: string) {
  const normalized = name.toLowerCase();
  return (part?.headers ?? [])
    .filter((header) => header.name?.toLowerCase() === normalized)
    .map((header) => header.value?.trim() ?? "")
    .filter(Boolean);
}

function headerValue(part: GmailMessagePart | undefined, name: string) {
  return headerValues(part, name)[0] ?? "";
}

async function lovableGmailFetch(path: string) {
  const config = requireConfiguration();
  const response = await fetch(`${LOVABLE_GMAIL_API_ROOT}${path}`, {
    headers: {
      Authorization: `Bearer ${config.lovableApiKey}`,
      "X-Connection-Api-Key": config.connectionApiKey,
      Accept: "application/json",
    },
    redirect: "error",
    signal: AbortSignal.timeout(CONNECTOR_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Conector Gmail do Lovable respondeu com HTTP ${response.status}.`);
  }

  return response;
}

async function listRecentMessageIds() {
  const params = new URLSearchParams({
    q: FIXED_INMET_QUERY,
    maxResults: String(MAX_MESSAGES_PER_RUN),
  });
  const response = await lovableGmailFetch(`/users/me/messages?${params.toString()}`);
  const payload = (await response.json()) as GmailListResponse;
  return (payload.messages ?? []).flatMap((message) => (message.id ? [message.id] : []));
}

async function fetchMessage(id: string) {
  const response = await lovableGmailFetch(
    `/users/me/messages/${encodeURIComponent(id)}?format=full`,
  );
  return (await response.json()) as GmailMessage;
}

function messageAgeMs(message: GmailMessage) {
  const internalDate = Number(message.internalDate);
  if (Number.isFinite(internalDate) && internalDate > 0) {
    return Math.max(0, Date.now() - internalDate);
  }

  const dateHeader = headerValue(message.payload, "Date");
  const parsedDate = Date.parse(dateHeader);
  if (Number.isFinite(parsedDate)) return Math.max(0, Date.now() - parsedDate);

  return Number.POSITIVE_INFINITY;
}

function dispatchFingerprint(messageId: string) {
  const digest = createHash("sha256").update(messageId).digest("hex").slice(0, 20);
  return `inmet-gmail-${digest}`;
}

async function dispatchForecastMessage(messageId: string) {
  const fingerprint = dispatchFingerprint(messageId);
  const title = "INMET atualizou a previsão de Pelotas";
  const leaseToken = await claimPushDispatch(fingerprint, title);
  if (!leaseToken) {
    return { status: "duplicate" as const, sent: 0, failed: 0, removed: 0 };
  }

  let deliveryCompleted = false;
  const progress: { latest: PushDeliveryResult | null } = { latest: null };

  try {
    const forecast = await fetchInmetForecast();
    const copy = buildInmetForecastPushCopy(forecast);
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const result = await broadcastPushNotification(
      {
        title: copy.title,
        body: copy.body,
        url: copy.url,
        tag: `inmet-previsao-${date}`,
        urgency: "normal",
        requireInteraction: false,
        renotify: false,
        topic: "weather",
      },
      {
        consentPreference: "daily_summary",
        beforeBatch: () => renewPushDispatch(fingerprint, leaseToken),
        afterBatch: ({ result: progressResult }) => {
          progress.latest = progressResult;
        },
      },
    );

    deliveryCompleted = true;
    await recordPushDispatch(fingerprint, leaseToken, copy.title, result);
    return { status: "sent" as const, ...result };
  } catch (error) {
    if (!deliveryCompleted) {
      const partial = progress.latest;
      if (partial && partial.total > 0) {
        await recordPushDispatch(
          fingerprint,
          leaseToken,
          "INMET: envio interrompido após entrega parcial",
          partial,
        ).catch(() => undefined);
      } else {
        await releasePushDispatch(fingerprint, leaseToken).catch(() => undefined);
      }
    }
    throw error;
  }
}

export async function processRecentInmetForecastEmails() {
  requireConfiguration();

  const push = getPushConfigurationStatus();
  if (!push.enabled) {
    throw new Error(`Web Push não configurado: ${push.missing.join(", ")}`);
  }

  const ids = await listRecentMessageIds();
  const summary = {
    scanned: 0,
    forecastEmails: 0,
    confirmationsIgnored: 0,
    otherIgnored: 0,
    untrustedIgnored: 0,
    tooOldIgnored: 0,
    duplicates: 0,
    dispatches: 0,
    sent: 0,
    failed: 0,
    removed: 0,
  };
  const errors: string[] = [];

  for (const id of [...ids].reverse()) {
    summary.scanned += 1;

    try {
      const message = await fetchMessage(id);
      const from = headerValue(message.payload, "From");
      const subject = headerValue(message.payload, "Subject");
      const authenticationResults = [
        ...headerValues(message.payload, "Authentication-Results"),
        ...headerValues(message.payload, "ARC-Authentication-Results"),
      ];
      const extracted = extractPartText(message.payload).join("\n");
      const body = (extracted || message.snippet || "").slice(0, MAX_EMAIL_BODY_CHARS);

      if (!isTrustedInmetMessage({ from, authenticationResults })) {
        summary.untrustedIgnored += 1;
        continue;
      }

      const kind = classifyInmetEmail(subject, body);
      if (kind === "confirmation") {
        summary.confirmationsIgnored += 1;
        continue;
      }
      if (kind !== "forecast") {
        summary.otherIgnored += 1;
        continue;
      }

      if (messageAgeMs(message) > MAX_EMAIL_AGE_MINUTES * 60_000) {
        summary.tooOldIgnored += 1;
        continue;
      }

      summary.forecastEmails += 1;
      const result = await dispatchForecastMessage(id);
      if (result.status === "duplicate") {
        summary.duplicates += 1;
        continue;
      }

      summary.dispatches += 1;
      summary.sent += result.sent;
      summary.failed += result.failed;
      summary.removed += result.removed;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    throw new Error(`Falha ao processar ${errors.length} mensagem(ns) do INMET: ${errors[0]}`);
  }

  return summary;
}
