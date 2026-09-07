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
  isExpectedInmetRecipient,
  isPelotasInmetMessage,
  isTrustedInmetMessage,
} from "./inmet-gmail";

const LOVABLE_GMAIL_API_ROOT = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const FIXED_INMET_QUERY_PREFIX =
  "in:inbox -in:spam -in:trash from:(inmet.gov.br) Pelotas";
const MAX_MESSAGES_PER_RUN = 20;
const MAX_EMAIL_BODY_CHARS = 64_000;
const MAX_EMAIL_AGE_MINUTES = 360;
const CONNECTOR_TIMEOUT_MS = 10_000;
const TIMEZONE = "America/Sao_Paulo";

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
  expectedRecipient: string;
};

type EligibleForecastEmail = {
  id: string;
  receivedAtMs: number;
};

type ScanResult = {
  summary: ReturnType<typeof createSummary>;
  eligibleForecasts: EligibleForecastEmail[];
};

function featureEnabled() {
  return process.env.INMET_GMAIL_PUSH_ENABLED?.trim().toLowerCase() === "true";
}

function normalizeExpectedRecipient(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized) ? normalized : "";
}

export function getInmetGmailConfigurationStatus() {
  const missing: string[] = [];
  if (!process.env.LOVABLE_API_KEY?.trim()) missing.push("LOVABLE_API_KEY");
  if (!process.env.GOOGLE_MAIL_API_KEY?.trim()) missing.push("GOOGLE_MAIL_API_KEY");

  const expectedRecipient = normalizeExpectedRecipient(process.env.INMET_GMAIL_EXPECTED_RECIPIENT);
  if (!expectedRecipient) missing.push("INMET_GMAIL_EXPECTED_RECIPIENT");

  return {
    enabled: featureEnabled(),
    configured: missing.length === 0,
    recipientConfigured: Boolean(expectedRecipient),
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
    expectedRecipient: normalizeExpectedRecipient(process.env.INMET_GMAIL_EXPECTED_RECIPIENT),
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

function recipientHeaderValues(part: GmailMessagePart | undefined) {
  return ["To", "Delivered-To", "X-Original-To", "Envelope-To"].flatMap((name) =>
    headerValues(part, name),
  );
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

function buildRecentInmetQuery(nowMs: number, expectedRecipient: string) {
  const afterUnixSeconds = Math.floor(
    (nowMs - MAX_EMAIL_AGE_MINUTES * 60_000) / 1_000,
  );
  return `${FIXED_INMET_QUERY_PREFIX} to:${expectedRecipient} after:${afterUnixSeconds}`;
}

async function listRecentMessageIds(nowMs: number, expectedRecipient: string) {
  const params = new URLSearchParams({
    q: buildRecentInmetQuery(nowMs, expectedRecipient),
    maxResults: String(MAX_MESSAGES_PER_RUN),
    fields: "messages(id)",
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

function messageReceivedAtMs(message: GmailMessage) {
  const internalDate = Number(message.internalDate);
  if (Number.isFinite(internalDate) && internalDate > 0) return internalDate;

  const dateHeader = headerValue(message.payload, "Date");
  const parsedDate = Date.parse(dateHeader);
  return Number.isFinite(parsedDate) ? parsedDate : null;
}

function messageAgeMs(message: GmailMessage, nowMs: number) {
  const receivedAtMs = messageReceivedAtMs(message);
  if (receivedAtMs === null) return Number.POSITIVE_INFINITY;
  return Math.max(0, nowMs - receivedAtMs);
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function dispatchFingerprint(
  copy: ReturnType<typeof buildInmetForecastPushCopy>,
  receivedAtMs: number,
) {
  const digest = createHash("sha256")
    .update(`${copy.title}\n${copy.body}\n${copy.url}`)
    .digest("hex")
    .slice(0, 20);
  return `inmet-gmail-${localDateKey(new Date(receivedAtMs))}-${digest}`;
}

function messageLogFingerprint(messageId: string) {
  return createHash("sha256").update(messageId).digest("hex").slice(0, 10);
}

async function dispatchForecastUpdate(receivedAtMs: number) {
  const forecast = await fetchInmetForecast();
  const copy = buildInmetForecastPushCopy(forecast);
  const fingerprint = dispatchFingerprint(copy, receivedAtMs);
  const leaseToken = await claimPushDispatch(fingerprint, copy.title);
  if (!leaseToken) {
    return { status: "duplicate" as const, sent: 0, failed: 0, removed: 0 };
  }

  let deliveryCompleted = false;
  const progress: { latest: PushDeliveryResult | null } = { latest: null };

  try {
    const date = localDateKey(new Date(receivedAtMs));
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

function createSummary() {
  return {
    provider: "lovable-google-mail" as const,
    skipped: false,
    reason: null as string | null,
    scanned: 0,
    forecastEmails: 0,
    confirmationsIgnored: 0,
    otherIgnored: 0,
    nonPelotasIgnored: 0,
    unexpectedRecipientIgnored: 0,
    untrustedIgnored: 0,
    tooOldIgnored: 0,
    messageErrors: 0,
    supersededForecasts: 0,
    duplicates: 0,
    dispatches: 0,
    sent: 0,
    failed: 0,
    removed: 0,
  };
}

async function scanRecentInmetForecastEmails(): Promise<ScanResult> {
  const configuration = requireConfiguration();

  const summary = createSummary();
  const nowMs = Date.now();
  const ids = await listRecentMessageIds(nowMs, configuration.expectedRecipient);
  const eligibleForecasts: EligibleForecastEmail[] = [];

  for (const id of ids) {
    summary.scanned += 1;

    try {
      const message = await fetchMessage(id);
      if (messageAgeMs(message, nowMs) > MAX_EMAIL_AGE_MINUTES * 60_000) {
        summary.tooOldIgnored += 1;
        continue;
      }

      const from = headerValue(message.payload, "From");
      const subject = headerValue(message.payload, "Subject");
      const authenticationResults = headerValues(message.payload, "Authentication-Results");

      if (!isTrustedInmetMessage({ from, authenticationResults })) {
        summary.untrustedIgnored += 1;
        continue;
      }

      if (
        !isExpectedInmetRecipient({
          expectedRecipient: configuration.expectedRecipient,
          recipientHeaders: recipientHeaderValues(message.payload),
        })
      ) {
        summary.unexpectedRecipientIgnored += 1;
        continue;
      }

      const extracted = extractPartText(message.payload).join("\n");
      const body = (extracted || message.snippet || "").slice(0, MAX_EMAIL_BODY_CHARS);
      const kind = classifyInmetEmail(subject, body);

      if (kind === "confirmation") {
        summary.confirmationsIgnored += 1;
        continue;
      }
      if (kind !== "forecast") {
        summary.otherIgnored += 1;
        continue;
      }
      if (!isPelotasInmetMessage(subject, body)) {
        summary.nonPelotasIgnored += 1;
        continue;
      }

      const receivedAtMs = messageReceivedAtMs(message);
      if (receivedAtMs === null) {
        summary.tooOldIgnored += 1;
        continue;
      }

      summary.forecastEmails += 1;
      eligibleForecasts.push({ id, receivedAtMs });
    } catch (error) {
      summary.messageErrors += 1;
      console.warn("[push/inmet-gmail] Mensagem não pôde ser avaliada", {
        message: error instanceof Error ? error.message : String(error),
        messageFingerprint: messageLogFingerprint(id),
      });
    }
  }

  if (ids.length > 0 && summary.messageErrors === ids.length) {
    throw new Error("Nenhuma mensagem candidata do Gmail pôde ser avaliada nesta execução.");
  }

  eligibleForecasts.sort((left, right) => right.receivedAtMs - left.receivedAtMs);
  summary.supersededForecasts = Math.max(0, eligibleForecasts.length - 1);

  return { summary, eligibleForecasts };
}

export async function inspectRecentInmetForecastEmails() {
  const configuration = getInmetGmailConfigurationStatus();
  const { summary, eligibleForecasts } = await scanRecentInmetForecastEmails();
  const selected = eligibleForecasts[0];

  if (!selected) {
    return {
      ...summary,
      mode: "check" as const,
      pushEnabled: configuration.enabled,
      recipientConfigured: configuration.recipientConfigured,
      wouldDispatch: false,
      selectedMessage: null,
      structuredForecast: null,
      preview: null,
    };
  }

  const forecast = await fetchInmetForecast();
  const copy = buildInmetForecastPushCopy(forecast);

  return {
    ...summary,
    mode: "check" as const,
    pushEnabled: configuration.enabled,
    recipientConfigured: configuration.recipientConfigured,
    wouldDispatch: true,
    selectedMessage: {
      fingerprint: messageLogFingerprint(selected.id),
      receivedAt: new Date(selected.receivedAtMs).toISOString(),
    },
    structuredForecast: {
      status: forecast.status,
      periods: forecast.periods.length,
      fetchedAt: forecast.source.fetchedAt,
    },
    preview: copy,
  };
}

export async function processRecentInmetForecastEmails() {
  const summary = createSummary();
  const configuration = getInmetGmailConfigurationStatus();

  if (!configuration.enabled) {
    summary.skipped = true;
    summary.reason = "feature-disabled";
    return summary;
  }

  const push = getPushConfigurationStatus();
  if (!push.enabled) {
    summary.skipped = true;
    summary.reason = "web-push-unavailable";
    return summary;
  }

  const scan = await scanRecentInmetForecastEmails();
  const selected = scan.eligibleForecasts[0];
  if (!selected) return scan.summary;

  const result = await dispatchForecastUpdate(selected.receivedAtMs);
  if (result.status === "duplicate") {
    scan.summary.duplicates += 1;
    return scan.summary;
  }

  scan.summary.dispatches += 1;
  scan.summary.sent += result.sent;
  scan.summary.failed += result.failed;
  scan.summary.removed += result.removed;
  return scan.summary;
}
