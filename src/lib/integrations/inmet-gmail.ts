import type { InmetForecast } from "@/lib/weather/official-sources.types";

const TIMEZONE = "America/Sao_Paulo";
const MAX_PUBLIC_COPY_CHARS = 240;
const MAX_CLASSIFICATION_BODY_CHARS = 12_000;
const MAX_TARGET_BODY_CHARS = 24_000;

export type InmetEmailKind = "confirmation" | "forecast" | "other";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function extractEmailAddress(value: string) {
  const angle = value.match(/<([^<>]+)>/);
  return (angle?.[1] ?? value).trim().toLowerCase();
}

function extractEmailAddresses(value: string) {
  return (value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []).map((address) =>
    address.toLowerCase(),
  );
}

export function classifyInmetEmail(subject: string, body: string): InmetEmailKind {
  const normalizedSubject = normalizeText(subject);
  const normalizedBody = normalizeText(body.slice(0, MAX_CLASSIFICATION_BODY_CHARS));
  const combined = `${normalizedSubject} ${normalizedBody}`;

  if (
    normalizedSubject.includes("confirmacao inmet") ||
    combined.includes("clique aqui para confirmar seu email") ||
    combined.includes("clique aqui para confirmar seu e-mail")
  ) {
    return "confirmation";
  }

  if (
    normalizedSubject.includes("previsao") ||
    combined.includes("previsoes por e-mail") ||
    combined.includes("previsoes por email") ||
    combined.includes("previsao meteorologica")
  ) {
    return "forecast";
  }

  return "other";
}

export function isPelotasInmetMessage(subject: string, body: string) {
  const combined = normalizeText(`${subject} ${body.slice(0, MAX_TARGET_BODY_CHARS)}`);
  return /\bpelotas\b/.test(combined);
}

export function isExpectedInmetRecipient(input: {
  expectedRecipient: string;
  recipientHeaders: readonly string[];
}) {
  const expected = input.expectedRecipient.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(expected)) return false;

  return input.recipientHeaders.some((value) => extractEmailAddresses(value).includes(expected));
}

function isTrustedGoogleAuthenticationResult(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!/^mx\.google\.com\s*;/i.test(normalized)) return false;

  const spfPass = /\bspf=pass\b/i.test(normalized);
  const smtpMailFromInmet =
    /\bsmtp\.mailfrom\s*=\s*(?:[^@\s;]+@)?(?:[a-z0-9-]+\.)*inmet\.gov\.br\b/i.test(
      normalized,
    );
  const dmarcPass = /\bdmarc=pass\b/i.test(normalized);
  const alignedFrom = /\bheader\.from\s*=\s*inmet\.gov\.br\b/i.test(normalized);

  return spfPass && smtpMailFromInmet && dmarcPass && alignedFrom;
}

export function isTrustedInmetMessage(input: {
  from: string;
  authenticationResults: readonly string[];
}) {
  const address = extractEmailAddress(input.from);
  if (!/^[^@\s]+@inmet\.gov\.br$/.test(address)) return false;

  return input.authenticationResults.some(isTrustedGoogleAuthenticationResult);
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function compactSentence(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim().replace(/[.;,\s]+$/, "");
  return normalized ? `${normalized}.` : "";
}

function compactTemperature(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function buildInmetForecastPushCopy(forecast: InmetForecast, now = new Date()) {
  const generic = {
    title: "INMET atualizou a previsão de Pelotas",
    body: "Uma nova previsão do INMET chegou por e-mail. Confira os detalhes atualizados no Tempo Pelotas.",
    url: "/tempo-hoje-pelotas",
  } as const;

  if (forecast.status !== "live" || forecast.periods.length === 0) return generic;

  const today = localDateKey(now);
  const todayPeriods = forecast.periods.filter((period) => period.date === today);
  const periods = todayPeriods.length > 0 ? todayPeriods : forecast.periods.slice(0, 4);
  const usable = periods.filter((period) => period.summary.trim());

  const summary = usable
    .slice(0, 2)
    .map((period) => {
      const periodLabel = normalizeText(period.period);
      const prefix =
        periodLabel && periodLabel !== "previsao diaria" && periodLabel !== "dia inteiro"
          ? `${period.period}: `
          : "";
      return `${prefix}${period.summary.trim()}`;
    })
    .join(" ");

  const minimums = periods
    .map((period) => period.minimum)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const maximums = periods
    .map((period) => period.maximum)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  const temperatures =
    minimums.length > 0 && maximums.length > 0
      ? ` Mínima de ${compactTemperature(Math.min(...minimums))} °C e máxima de ${compactTemperature(
          Math.max(...maximums),
        )} °C.`
      : "";

  const body = `${compactSentence(summary) || "Confira a previsão atualizada do INMET."}${temperatures}`
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PUBLIC_COPY_CHARS);

  return {
    title: generic.title,
    body,
    url: generic.url,
  };
}
