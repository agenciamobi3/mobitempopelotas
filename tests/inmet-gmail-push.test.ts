import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildInmetForecastPushCopy,
  classifyInmetEmail,
  isTrustedInmetMessage,
} from "@/lib/integrations/inmet-gmail";

const server = readFileSync("src/lib/integrations/inmet-gmail.server.ts", "utf8");
const route = readFileSync("src/routes/api/cron/push-daily.ts", "utf8");
const docs = readFileSync("docs/INMET_GMAIL_PUSH.md", "utf8");

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

test("INMET Gmail only trusts aligned inmet.gov.br messages with SPF and DMARC pass", () => {
  assert.equal(
    isTrustedInmetMessage({
      from: "sepre2.df@inmet.gov.br",
      authenticationResults: [
        "spf=pass smtp.mailfrom=sepre2.df@inmet.gov.br; dmarc=pass header.from=inmet.gov.br",
      ],
    }),
    true,
  );

  assert.equal(
    isTrustedInmetMessage({
      from: "INMET <alerta@example.com>",
      authenticationResults: [
        "spf=pass smtp.mailfrom=example.com; dmarc=pass header.from=example.com",
      ],
    }),
    false,
  );

  assert.equal(
    isTrustedInmetMessage({
      from: "sepre2.df@inmet.gov.br",
      authenticationResults: ["spf=pass; dmarc=fail header.from=inmet.gov.br"],
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

test("INMET Gmail integration is zero-AI and reuses the existing push consent pipeline", () => {
  assert.doesNotMatch(server, /gemini|openai|generateWeatherAiSnapshot|GEMINI_API_KEY/i);
  assert.match(server, /consentPreference:\s*"daily_summary"/);
  assert.match(server, /topic:\s*"weather"/);
  assert.match(server, /claimPushDispatch/);
  assert.match(server, /isTrustedInmetMessage/);
  assert.match(route, /task === "inmet-gmail"/);
  assert.match(route, /task === "inmet-gmail-watch"/);
  assert.match(docs, /sem IA/i);
});
