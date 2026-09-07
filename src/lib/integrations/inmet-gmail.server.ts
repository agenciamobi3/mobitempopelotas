import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";

import {
  claimPushDispatch,
  recordPushDispatch,
  releasePushDispatch,
  renewPushDispatch,
} from "@/lib/push/push-storage.server";
import { broadcastPushNotification, getPushConfigurationStatus } from "@/lib/push/web-push.server";
import { fetchInmetForecast } from "@/lib/weather/inmet-forecast.server";

import {
  buildInmetForecastPushCopy,
  classifyInmetEmail,
  isTrustedInmetMessage,
} from "./inmet-gmail";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_ROOT = "https://gmail.googleapis.com/gmail/v1";
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const DEFAULT_QUERY = "in:inbox -in:spam -in:trash from:(@inmet.gov.br) newer_than:1d";
const DEFAULT_MAX_AGE_MINUTES = 360;
const MAX_MESSAGES_PER_RUN = 20;
const MAX_EMAIL_BODY_CHARS = 64_000;
const GOOGLE_JWKS_TTL_MS = 60 * 60 * 1000;

type GmailConfiguration = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  user: string;
  query: string;
  maxAgeMinutes: number;
  pubsubTopic: string | null;
  pubsubAudience: string | null;
  pubsubServiceAccountEmail: string | null;
};

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

type GoogleJwk = JsonWebKey & {
  kid?: string;
  alg?: string;
};

type GoogleJwksResponse = {
  keys?: GoogleJwk[];
};

type GoogleOidcClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  email?: string;
  email_verified?: boolean | string;
};

type GmailPubSubEnvelope = {
  message?: {
    data?: string;
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
};

type GmailPushData = {
  emailAddress?: string;
  historyId?: string;
};

let oauthCache: { accessToken: string; expiresAt: number } | null = null;
let jwksCache: { keys: GoogleJwk[]; expiresAt: number } | null = null;

function numberFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1_440, Math.max(5, Math.trunc(parsed)));
}

export function getInmetGmailConfigurationStatus() {
  const required = [
    "INMET_GMAIL_CLIENT_ID",
    "INMET_GMAIL_CLIENT_SECRET",
    "INMET_GMAIL_REFRESH_TOKEN",
    "INMET_GMAIL_USER",
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());

  return {
    configured: missing.length === 0,
    missing,
    watchConfigured: Boolean(
      process.env.INMET_GMAIL_PUBSUB_TOPIC?.trim() &&
        process.env.INMET_GMAIL_PUBSUB_AUDIENCE?.trim(),
    ),
  };
}

function requireConfiguration(): GmailConfiguration {
  const status = getInmetGmailConfigurationStatus();
  if (!status.configured) {
    throw new Error(`Gmail do INMET não configurado: ${status.missing.join(", ")}`);
  }

  return {
    clientId: process.env.INMET_GMAIL_CLIENT_ID!.trim(),
    clientSecret: process.env.INMET_GMAIL_CLIENT_SECRET!.trim(),
    refreshToken: process.env.INMET_GMAIL_REFRESH_TOKEN!.trim(),
    user: process.env.INMET_GMAIL_USER!.trim().toLowerCase(),
    query: process.env.INMET_GMAIL_QUERY?.trim() || DEFAULT_QUERY,
    maxAgeMinutes: numberFromEnv(
      process.env.INMET_GMAIL_MAX_AGE_MINUTES,
      DEFAULT_MAX_AGE_MINUTES,
    ),
    pubsubTopic: process.env.INMET_GMAIL_PUBSUB_TOPIC?.trim() || null,
    pubsubAudience: process.env.INMET_GMAIL_PUBSUB_AUDIENCE?.trim() || null,
    pubsubServiceAccountEmail:
      process.env.INMET_GMAIL_PUBSUB_SERVICE_ACCOUNT_EMAIL?.trim().toLowerCase() || null,
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

async function getAccessToken() {
  const config = requireConfiguration();
  const now = Date.now();

  if (oauthCache && oauthCache.expiresAt - 60_000 > now) {
    return oauthCache.accessToken;
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`OAuth do Gmail respondeu com HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!payload.access_token) throw new Error("OAuth do Gmail não retornou access_token.");

  oauthCache = {
    accessToken: payload.access_token,
    expiresAt: now + Math.max(60, payload.expires_in ?? 3_600) * 1000,
  };
  return oauthCache.accessToken;
}

async function gmailFetch(path: string, init: RequestInit = {}, allowRetry = true) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${GMAIL_API_ROOT}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
    redirect: "error",
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });

  if (response.status === 401 && allowRetry) {
    oauthCache = null;
    return gmailFetch(path, init, false);
  }

  return response;
}

async function listRecentMessageIds() {
  const config = requireConfiguration();
  const params = new URLSearchParams({
    q: config.query,
    maxResults: String(MAX_MESSAGES_PER_RUN),
  });
  const response = await gmailFetch(
    `/users/${encodeURIComponent(config.user)}/messages?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(`Busca do Gmail respondeu com HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as GmailListResponse;
  return (payload.messages ?? []).flatMap((message) => (message.id ? [message.id] : []));
}

async function fetchMessage(id: string) {
  const config = requireConfiguration();
  const response = await gmailFetch(
    `/users/${encodeURIComponent(config.user)}/messages/${encodeURIComponent(id)}?format=full`,
  );
  if (!response.ok) {
    throw new Error(`Leitura do Gmail respondeu com HTTP ${response.status}.`);
  }
  return (await response.json()) as GmailMessage;
}

function messageAgeMs(message: GmailMessage) {
  const internalDate = Number(message.internalDate);
  if (!Number.isFinite(internalDate) || internalDate <= 0) return 0;
  return Math.max(0, Date.now() - internalDate);
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
  try {
    const forecast = await fetchInmetForecast();
    const copy = buildInmetForecastPushCopy(forecast);
    const result = await broadcastPushNotification(
      {
        title: copy.title,
        body: copy.body,
        url: copy.url,
        tag: `inmet-previsao-${new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date())}`,
        urgency: "normal",
        requireInteraction: false,
        renotify: false,
        topic: "weather",
      },
      {
        consentPreference: "daily_summary",
        beforeBatch: () => renewPushDispatch(fingerprint, leaseToken),
      },
    );
    deliveryCompleted = true;
    await recordPushDispatch(fingerprint, leaseToken, copy.title, result);

    return { status: "sent" as const, ...result };
  } catch (error) {
    if (!deliveryCompleted) {
      await releasePushDispatch(fingerprint, leaseToken).catch(() => undefined);
    }
    throw error;
  }
}

export async function processRecentInmetForecastEmails() {
  const config = requireConfiguration();
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
      const body = extractPartText(message.payload).join("\n").slice(0, MAX_EMAIL_BODY_CHARS);

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

      if (messageAgeMs(message) > config.maxAgeMinutes * 60_000) {
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

async function fetchGoogleJwks() {
  const now = Date.now();
  if (jwksCache && jwksCache.expiresAt > now) return jwksCache.keys;

  const response = await fetch(GOOGLE_JWKS_URL, {
    headers: { Accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`JWKS do Google respondeu com HTTP ${response.status}.`);

  const payload = (await response.json()) as GoogleJwksResponse;
  const keys = payload.keys ?? [];
  if (keys.length === 0) throw new Error("JWKS do Google não retornou chaves.");

  jwksCache = {
    keys,
    expiresAt: now + GOOGLE_JWKS_TTL_MS,
  };
  return keys;
}

function decodeJwtJson<T>(segment: string): T | null {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function verifyInmetGmailPubSubRequest(request: Request) {
  const config = requireConfiguration();
  if (!config.pubsubAudience) return false;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;
  const token = authorization.slice("Bearer ".length).trim();
  const [encodedHeader, encodedPayload, encodedSignature, ...rest] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature || rest.length > 0) return false;

  const header = decodeJwtJson<{ alg?: string; kid?: string }>(encodedHeader);
  const claims = decodeJwtJson<GoogleOidcClaims>(encodedPayload);
  if (!header || !claims || header.alg !== "RS256" || !header.kid) return false;

  const keys = await fetchGoogleJwks();
  const jwk = keys.find((candidate) => candidate.kid === header.kid);
  if (!jwk) return false;

  const verified = verifySignature(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    createPublicKey({ key: jwk, format: "jwk" }),
    Buffer.from(encodedSignature, "base64url"),
  );
  if (!verified) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (
    claims.iss !== "https://accounts.google.com" &&
    claims.iss !== "accounts.google.com"
  ) {
    return false;
  }
  if (typeof claims.exp !== "number" || claims.exp < nowSeconds - 30) return false;
  if (typeof claims.iat === "number" && claims.iat > nowSeconds + 120) return false;

  const audiences = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
  if (!audiences.includes(config.pubsubAudience)) return false;

  if (config.pubsubServiceAccountEmail) {
    if (claims.email?.toLowerCase() !== config.pubsubServiceAccountEmail) return false;
    if (claims.email_verified !== true && claims.email_verified !== "true") return false;
  }

  return true;
}

export function parseInmetGmailPubSubEnvelope(value: unknown) {
  const config = requireConfiguration();
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const envelope = value as GmailPubSubEnvelope;
  const encoded = envelope.message?.data;
  if (!encoded) return null;

  try {
    const data = JSON.parse(Buffer.from(encoded, "base64").toString("utf8")) as GmailPushData;
    const emailAddress = data.emailAddress?.trim().toLowerCase();
    const historyId = data.historyId?.trim();
    if (emailAddress !== config.user || !historyId || !/^\d+$/.test(historyId)) return null;

    return {
      emailAddress,
      historyId,
      messageId: envelope.message?.messageId ?? null,
    };
  } catch {
    return null;
  }
}

export async function renewInmetGmailWatch() {
  const config = requireConfiguration();
  if (!config.pubsubTopic) {
    throw new Error("INMET_GMAIL_PUBSUB_TOPIC não configurado.");
  }

  const response = await gmailFetch(`/users/${encodeURIComponent(config.user)}/watch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topicName: config.pubsubTopic,
      labelIds: ["INBOX"],
      labelFilterBehavior: "include",
    }),
  });

  if (!response.ok) {
    throw new Error(`Gmail watch respondeu com HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as {
    historyId?: string;
    expiration?: string;
  };
  if (!payload.historyId || !payload.expiration) {
    throw new Error("Gmail watch não retornou historyId e expiration.");
  }

  return {
    historyId: payload.historyId,
    expiration: payload.expiration,
  };
}
