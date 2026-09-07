import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildInmetForecastPushCopy,
  classifyInmetEmail,
  isPelotasInmetMessage,
  isTrustedInmetMessage,
} from "@/lib/integrations/inmet-gmail";

const server = readFileSync("src/lib/integrations/inmet-gmail.server.ts", "utf8");
const route = readFileSync("src/routes/api/cron/push-daily.ts", "utf8");
const docs = readFileSync("docs/INMET_GMAIL_PUSH.md", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const scheduler = readFileSync(".github/workflows/inmet-gmail-poll.yml", "utf8");

test("INMET Gmail classifier ignores confirmation and recognizes forecast without AI", () => {
  assert.equal(
    classifyInmetEmail(
      "Confirmação INMET - Previsão por E-mail",
      "Previsões por E-mail Clique AQUI para confirmar seu email.",
    ),
    "confirmation",
  );

  assert.equal(
    classifyInmetEmail(
      "INMET - Previsão por E-mail",
      "Previsão meteorológica para Pelotas.",
    ),
    "forecast",
  );

  assert.equal(classifyInmetEmail("Comunicado administrativo", "Cadastro atualizado."), "other");
});

test("INMET Gmail requires the message to target Pelotas", () => {
  assert.equal(
    isPelotasInmetMessage(
      "INMET - Previsão por E-mail",
      "Previsão meteorológica para Pelotas - RS.",
    ),
    true,
  );
  assert.equal(
    isPelotasInmetMessage(
      "INMET - Previsão por E-mail",
      "Previsão meteorológica para Rio Grande - RS.",
    ),
    false,
  );
});

test("INMET Gmail only trusts a Google authentication result aligned to inmet.gov.br", () => {
  const validAuthentication =
    "mx.google.com; spf=pass smtp.mailfrom=sepre2.df@inmet.gov.br; dmarc=pass header.from=inmet.gov.br";

  assert.equal(
    isTrustedInmetMessage({
      from: "sepre2.df@inmet.gov.br",
      authenticationResults: [validAuthentication],
    }),
    true,
  );

  assert.equal(
    isTrustedInmetMessage({
      from: "INMET <alerta@example.com>",
      authenticationResults: [
        "mx.google.com; spf=pass smtp.mailfrom=example.com; dmarc=pass header.from=example.com",
      ],
    }),
    false,
  );

  assert.equal(
    isTrustedInmetMessage({
      from: "sepre2.df@inmet.gov.br",
      authenticationResults: [
        "mx.google.com; spf=pass smtp.mailfrom=sepre2.df@inmet.gov.br; dmarc=fail header.from=inmet.gov.br",
      ],
    }),
    false,
  );

  assert.equal(
    isTrustedInmetMessage({
      from: "sepre2.df@inmet.gov.br",
      authenticationResults: [
        "attacker.example; spf=pass smtp.mailfrom=sepre2.df@inmet.gov.br; dmarc=pass header.from=inmet.gov.br",
      ],
    }),
    false,
  );

  assert.equal(
    isTrustedInmetMessage({
      from: "sepre2.df@inmet.gov.br",
      authenticationResults: [
        "mx.google.com; spf=pass smtp.mailfrom=attacker.example; dmarc=pass header.from=inmet.gov.br",
      ],
    }),
    false,
  );
});

test("INMET Gmail forecast push copy is deterministic and uses structured INMET data", () => {
  const copy = buildInmetForecastPushCopy(
    {
      status: "live",
      periods: [
        {
          id: "2026-09-07:Manhã",
          date: "2026-09-07",
          period: "Manhã",
          summary: "Muitas nuvens com possibilidade de chuva isolada",
          minimum: 12,
          maximum: 18,
          humidityMinimum: null,
          humidityMaximum: null,
          windDirection: null,
          windIntensity: null,
          icon: null,
          sunrise: null,
          sunset: null,
          season: null,
        },
      ],
      source: {
        name: "INMET",
        url: "https://portal.inmet.gov.br/",
        fetchedAt: "2026-09-07T06:00:00.000Z",
      },
      error: null,
    },
    new Date("2026-09-07T12:00:00.000Z"),
  );

  assert.equal(copy.title, "INMET atualizou a previsão de Pelotas");
  assert.match(copy.body, /Manhã: Muitas nuvens com possibilidade de chuva isolada/);
  assert.match(copy.body, /Mínima de 12 °C e máxima de 18 °C/);
  assert.equal(copy.url, "/tempo-hoje-pelotas");
});

test("INMET Gmail runtime uses the Lovable connector without custom Google credentials", () => {
  assert.match(server, /connector-gateway\.lovable\.dev\/google_mail\/gmail\/v1/);
  assert.match(server, /LOVABLE_API_KEY/);
  assert.match(server, /GOOGLE_MAIL_API_KEY/);
  assert.match(server, /X-Connection-Api-Key/);
  assert.match(server, /\/users\/me\/messages/);
  assert.match(server, /MAX_MESSAGES_PER_RUN = 20/);
  assert.match(server, /FIXED_INMET_QUERY_PREFIX[\s\S]*Pelotas/);
  assert.match(server, /after:\$\{afterUnixSeconds\}/);

  assert.doesNotMatch(server, /gmail\.googleapis\.com|oauth2\.googleapis\.com/i);
  assert.doesNotMatch(server, /INMET_GMAIL_CLIENT_ID|INMET_GMAIL_CLIENT_SECRET|INMET_GMAIL_REFRESH_TOKEN/);
  assert.doesNotMatch(server, /GOOGLE_JWKS_URL|PubSub|pubsub|GmailWatch|renewInmetGmailWatch/);
});

test("INMET Gmail is fail-closed while Web Push remains suspended", () => {
  assert.match(server, /INMET_GMAIL_PUSH_ENABLED/);
  assert.match(server, /configuration\.enabled/);
  assert.match(server, /reason = "feature-disabled"/);
  assert.match(server, /reason = "web-push-unavailable"/);
  assert.match(envExample, /^INMET_GMAIL_PUSH_ENABLED=false$/m);
  assert.match(docs, /Web Push público do Tempo Pelotas permanece suspenso/i);
});

test("INMET Gmail check can inspect the real connector without attempting delivery", () => {
  assert.match(server, /export async function inspectRecentInmetForecastEmails/);
  assert.match(server, /mode: "check"/);
  assert.match(server, /selectedMessage:\s*\{/);
  assert.match(server, /fingerprint: messageLogFingerprint\(selected\.id\)/);
  assert.match(server, /structuredForecast:\s*\{/);
  assert.match(server, /preview: copy/);

  assert.match(route, /task === "inmet-gmail-check"/);
  assert.match(route, /processInmetGmailCheck/);
  assert.match(route, /inspectRecentInmetForecastEmails/);
  assert.match(route, /dispatchAttempted:\s*false/);
  assert.match(route, /hasBearerSecret\(request, process\.env\.CRON_SECRET/);

  assert.match(docs, /inmet-gmail-check/i);
  assert.match(docs, /não reserva.*dispatch|não.*claim_web_push_dispatch/is);
});

test("INMET Gmail coalesces candidates and deduplicates by public update content", () => {
  assert.match(server, /eligibleForecasts\.sort/);
  assert.match(server, /supersededForecasts/);
  assert.match(server, /dispatchForecastUpdate\(selected\.receivedAtMs\)/);
  assert.match(server, /copy\.title.*copy\.body.*copy\.url/s);
  assert.match(server, /inmet-gmail-\$\{localDateKey/);
  assert.doesNotMatch(server, /function dispatchFingerprint\(messageId/);
  assert.match(docs, /somente a mais recente pode avançar/i);
  assert.match(docs, /fingerprint da atualização pública/i);
});

test("INMET Gmail ignores ARC as a substitute and tolerates partial message failures", () => {
  assert.match(server, /headerValues\(message\.payload, "Authentication-Results"\)/);
  assert.doesNotMatch(server, /ARC-Authentication-Results/);
  assert.match(server, /messageErrors/);
  assert.match(server, /messageFingerprint: messageLogFingerprint\(id\)/);
  assert.match(server, /summary\.messageErrors === ids\.length/);
});

test("INMET Gmail polling stays server-only, protected, deterministic and on daily_summary", () => {
  assert.match(server, /consentPreference:\s*"daily_summary"/);
  assert.match(server, /topic:\s*"weather"/);
  assert.match(server, /claimPushDispatch/);
  assert.match(server, /fetchInmetForecast/);
  assert.match(server, /isTrustedInmetMessage/);
  assert.match(server, /isPelotasInmetMessage/);
  assert.doesNotMatch(server, /gemini|openai|generateWeatherAiSnapshot|GEMINI_API_KEY/i);

  assert.match(route, /task === "inmet-gmail"/);
  assert.match(route, /processInmetGmailRecovery/);
  assert.match(route, /hasBearerSecret\(request, process\.env\.CRON_SECRET/);
  assert.doesNotMatch(route, /task === "inmet-gmail-watch"/);
  assert.doesNotMatch(route, /POST:\s*\(\{ request \}\)/);
  assert.doesNotMatch(route, /verifyInmetGmailPubSubRequest|parseInmetGmailPubSubEnvelope/);
});

test("INMET Gmail scheduler polls every ten minutes and defaults manual runs to safe check", () => {
  assert.match(scheduler, /cron:\s*"\*\/10 \* \* \* \*"/);
  assert.match(scheduler, /workflow_dispatch:[\s\S]*default:\s*check/);
  assert.match(scheduler, /options:[\s\S]*- check[\s\S]*- delivery/);
  assert.match(scheduler, /TASK="inmet-gmail"/);
  assert.match(scheduler, /TASK="inmet-gmail-check"/);
  assert.match(scheduler, /TEMPO_PELOTAS_CRON_SECRET/);
  assert.match(scheduler, /Authorization: Bearer \$CRON_SECRET/);
  assert.match(scheduler, /cancel-in-progress:\s*false/);
  assert.match(scheduler, /User-Agent: TempoPelotas-INMET-Gmail-Poll\/1\.0/);
  assert.doesNotMatch(scheduler, /gemini|openai|weather-ai|Sec-Fetch/i);
});

test("INMET Gmail connector credentials stay owned by Lovable", () => {
  assert.doesNotMatch(
    envExample,
    /^INMET_GMAIL_(?:USER|CLIENT_ID|CLIENT_SECRET|REFRESH_TOKEN|QUERY|MAX_AGE_MINUTES|PUBSUB_[A-Z_]+)=/m,
  );
  assert.doesNotMatch(envExample, /^LOVABLE_API_KEY=/m);
  assert.doesNotMatch(envExample, /^GOOGLE_MAIL_API_KEY=/m);

  assert.match(docs, /App Connector/i);
  assert.match(docs, /não usa Gemini, OpenAI/i);
  assert.match(docs, /Não criar OAuth Client ID\/Secret, refresh token, tópico Pub\/Sub ou Gmail Watch/i);
});
