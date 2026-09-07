import type { InmetForecast } from "@/lib/weather/official-sources.types";

const TIMEZONE = "America/Sao_Paulo";
const MAX_PUBLIC_COPY_CHARS = 240;

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

export function classifyInmetEmail(subject: string, body: string): InmetEmailKind {
  const normalizedSubject = normalizeText(subject);
  const normalizedBody = normalizeText(body.slice(0, 12_000));
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

export function isTrustedInmetMessage(input: {
  from: string;
  authenticationResults: readonly string[];
}) {
  const address = extractEmailAddress(input.from);
  if (!/^[^@\s]+@inmet\.gov\.br$/.test(address)) return false;

  const authentication = input.authenticationResults.join(" ");
  const spfPass = /\bspf=pass\b/i.test(authentication);
  const dmarcPass = /\bdmarc=pass\b/i.test(authentication);
  const alignedFrom = /header\.from\s*=\s*inmet\.gov\.br\b/i.test(authentication);

  return spfPass && dmarcPass && alignedFrom;
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
