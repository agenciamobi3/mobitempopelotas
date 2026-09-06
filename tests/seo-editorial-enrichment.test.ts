import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const editorial = source("src/lib/editorial-content.ts");
const home = source("src/routes/index.tsx");
const today = source("src/routes/tempo-hoje-pelotas.tsx");
const tomorrow = source("src/routes/tempo-amanha-pelotas.tsx");
const sevenDays = source("src/routes/previsao-7-dias-pelotas.tsx");
const fifteenDays = source("src/routes/previsao-15-dias-pelotas.tsx");
const rain = source("src/routes/chuva-em-pelotas.tsx");
const wind = source("src/routes/vento-em-pelotas.tsx");
const radar = source("src/routes/radar-e-satelite-pelotas.tsx");
const alerts = source("src/routes/alertas.tsx");
const meteogram = source("src/routes/meteograma-pelotas.tsx");
const frost = source("src/routes/mapa-de-geadas-rio-grande-do-sul.tsx");
const climate = source("src/routes/clima-em-pelotas.tsx");
const history = source("src/routes/historico-climatico-pelotas.tsx");
const status = source("src/routes/status-dos-dados.tsx");
const privacy = source("src/routes/privacidade-e-dados.tsx");
const contentShell = source("src/components/layout/ContentPageShell.tsx");
const regionalHub = source("src/routes/tempo-na-regiao-sul-rs.tsx");
const laranjal = source("src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx");
const hydrology = source("src/routes/situacao-hidrologica-pelotas.tsx");
const guaiba = source("src/routes/nivel-do-guaiba.tsx");
const regionalEditorial = source("src/lib/regional-city-editorial.ts");
const regionalPage = source("src/components/regional/RegionalCityWeatherPage.tsx");
const regionalRoute = source("src/routes/tempo-em/$citySlug.tsx");

test("home e hoje formam um cluster de intenção sem criar novas URLs redundantes", () => {
  assert.match(home, /Tempo agora em Pelotas/);
  assert.match(home, /Temperatura atual em Pelotas/);
  assert.match(editorial, /href: "\/tempo-hoje-pelotas"/);
  assert.match(today, /href: "\/previsao-7-dias-pelotas"/);
  assert.match(today, /href: "\/previsao-15-dias-pelotas"/);
  assert.match(today, /Onde vejo a previsão por hora de hoje/);
});

test("amanhã, 7 dias e 15 dias possuem papéis distintos e navegação progressiva", () => {
  assert.match(tomorrow, /Tempo amanhã em Pelotas: temperatura, chuva e vento/);
  assert.match(tomorrow, /Vai chover amanhã em Pelotas/);
  assert.match(tomorrow, /href: "\/previsao-7-dias-pelotas"/);
  assert.match(tomorrow, /href: "\/previsao-15-dias-pelotas"/);
  assert.match(tomorrow, /createFaqPageJsonLd/);
  assert.match(tomorrow, /<EditorialContentSection/);

  assert.match(sevenDays, /7 dias e semana/);
  assert.match(sevenDays, /Como fica o tempo em Pelotas nesta semana/);
  assert.match(sevenDays, /href: "\/previsao-15-dias-pelotas"/);
  assert.match(sevenDays, /previsão do tempo para a semana em Pelotas/i);

  assert.match(fifteenDays, /10 e 15 dias/);
  assert.match(fifteenDays, /Os primeiros 10 dias estão dentro desta mesma janela de 15 dias/);
  assert.match(fifteenDays, /Qual a diferença entre a previsão de 7 e 15 dias/);
  assert.match(fifteenDays, /não cria uma página duplicada apenas para trocar o número do horizonte/);
});

test("chuva conecta previsão, observação e hidrologia sem somar janelas incompatíveis", () => {
  assert.match(rain, /Vai chover hoje em Pelotas/);
  assert.match(rain, /Quanto choveu hoje em Pelotas/);
  assert.match(rain, /href: "\/situacao-hidrologica-pelotas"/);
  assert.match(rain, /href: "\/nivel-da-lagoa-dos-patos-laranjal"/);
  assert.match(rain, /não é somado ao volume previsto para hoje/);
});

test("vento cobre intenção de hoje e mantém observação separada de previsão", () => {
  assert.match(wind, /Vento em Pelotas hoje: direção e rajadas por hora/);
  assert.match(wind, /Como está o vento hoje em Pelotas/);
  assert.match(wind, /Quando o dado vem da Estação Embrapa, ele é uma observação local/);
  assert.match(wind, /A direção por horário é previsão do perfil detalhado do Open-Meteo/);
  assert.match(wind, /href: "\/previsao-15-dias-pelotas"/);
  assert.match(wind, /href: "\/situacao-hidrologica-pelotas"/);
});

test("radar cobre busca por chuva recente sem prometer imagem instantânea", () => {
  assert.match(radar, /Satélites e radares em Pelotas: chuva, nuvens e trovoadas/);
  assert.match(radar, /Onde vejo o radar de chuva de Pelotas agora/);
  assert.match(radar, /A expressão radar agora deve ser lida como a imagem mais recente disponível na fonte/);
  assert.match(radar, /Confira esse horário antes de interpretar a imagem como situação atual/);
  assert.match(radar, /A sequência mostra registros passados e recentes, não uma projeção futura/);
  assert.match(radar, /href: "\/vento-em-pelotas"/);
});

test("meteograma, clima e histórico recente não disputam a mesma intenção", () => {
  assert.match(meteogram, /Meteograma de Pelotas: previsão hora a hora por 48h/);
  assert.match(meteogram, /Qual é a diferença entre o meteograma e a página Tempo hoje/);
  assert.match(meteogram, /href: "\/vento-em-pelotas"/);
  assert.match(meteogram, /href: "\/tempo-amanha-pelotas"/);

  assert.match(climate, /Clima de Pelotas: estações do ano e climatologia/);
  assert.match(climate, /Qual é a diferença entre clima e histórico de 30 dias/);
  assert.match(climate, /Uma normal climatológica exige décadas de observações/);
  assert.match(climate, /href: "\/mapa-de-geadas-rio-grande-do-sul"/);

  assert.match(history, /Histórico meteorológico de 30 dias em Pelotas/);
  assert.match(history, /Este histórico compara somente os últimos 30 dias completos disponíveis/);
  assert.match(history, /Um período de 30 dias não substitui uma normal climatológica/);
  assert.match(history, /sem tratar o período como climatologia/);
});

test("alertas e geadas preservam fonte oficial e diferença entre observação e previsão", () => {
  assert.match(alerts, /Alertas do INMET em Pelotas e região/);
  assert.match(alerts, /A ausência de alerta não elimina mudanças rápidas no tempo/);
  assert.match(alerts, /href: "\/situacao-hidrologica-pelotas"/);

  assert.match(frost, /Mapa de geadas observadas no Rio Grande do Sul/);
  assert.match(frost, /O mapa mostra registros passados e não prevê geada para a próxima madrugada/);
  assert.match(frost, /href: "\/previsao-7-dias-pelotas"/);
});

test("páginas de apoio preservam semântica, estrutura e entidades", () => {
  assert.match(contentShell, /<main id="conteudo-principal"/);
  assert.match(privacy, /<ContentPageShell pageClassName="privacy-data-shell">/);
  assert.match(privacy, /<div className="privacy-page">/);
  assert.doesNotMatch(privacy, /<main className="privacy-page"/);

  assert.match(status, /createEditorialPageJsonLd/);
  assert.match(status, /Status dos dados e integrações/);
  assert.match(status, /Histórico de incidentes de dados/);
  assert.match(status, /Uma fonte offline não significa que todo o portal parou/);

  assert.match(regionalHub, /Tempo na Região Sul do RS: previsão por cidade/);
  assert.match(regionalHub, /Previsão do tempo por cidade no sul do RS/);
  assert.match(regionalHub, /Mapa meteorológico regional/);
  assert.match(regionalHub, /PUBLIC_REGIONAL_CITIES/);
});

test("cluster hidrológico conecta operação atual e memória histórica preservando referências", () => {
  for (const route of [laranjal, hydrology, guaiba]) {
    assert.match(route, /\/nivel-do-guaiba|Nível do Guaíba/);
    assert.match(route, /\/enchente-1941-pelotas/);
    assert.match(route, /\/enchente-2024-pelotas-laranjal/);
  }

  assert.match(laranjal, /não são convertidas em cota da Estação Laranjal/);
  assert.match(hydrology, /não devem ser comparados por simples subtração/);
  assert.match(guaiba, /não confirma risco de enchente em Pelotas/);
  assert.match(guaiba, /sem transferi-la para as réguas atuais do Guaíba/);
});

test("páginas regionais preservam perfis locais sem FAQ templated em massa", () => {
  const priorityProfiles = [...regionalEditorial.matchAll(/^\s{2}"[a-z0-9-]+-rs": \{/gm)];
  assert.ok(
    priorityProfiles.length >= 10,
    `esperava ao menos 10 perfis editoriais, encontrou ${priorityProfiles.length}`,
  );

  assert.match(regionalEditorial, /"sao-jose-do-norte-rs"/);
  assert.match(regionalEditorial, /"sao-lourenco-do-sul-rs"/);
  assert.match(regionalEditorial, /"piratini-rs"/);
  assert.match(regionalEditorial, /"bage-rs"/);
  assert.match(regionalEditorial, /"santa-vitoria-do-palmar-rs"/);
  assert.match(regionalEditorial, /"chui-rs"/);
  assert.doesNotMatch(regionalEditorial, /regionalCityFaqs|RegionalCityFaq/);
  assert.doesNotMatch(regionalPage, /perguntas-frequentes|perguntas-sobre-tempo-local|FAQPage/);
  assert.doesNotMatch(regionalRoute, /createFaqPageJsonLd|regionalCityFaqs|regionalCityEditorialFaqs/);
});
