import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/enchente-2015-pelotas.tsx", "utf8");
const page = readFileSync("src/components/history/Flood2015HistoricalPage.tsx", "utf8");
const content = readFileSync("src/lib/content/flood-2015-pelotas.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("2015 flood record is a canonical public editorial route", () => {
  assert.match(route, /createFileRoute\("\/enchente-2015-pelotas"\)/);
  assert.match(route, /Enchente de 2015 em Pelotas: linha do tempo, níveis e impactos/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(publicRoutes, /\/enchente-2015-pelotas/);
});

test("2015 page preserves the principal official milestones", () => {
  assert.match(content, /299 mm/);
  assert.match(content, /2,20 m/);
  assert.match(content, /~1\.300 famílias/);
  assert.match(content, /18–19 de outubro de 2015/);
  assert.match(content, /2,04 m/);
  assert.match(content, /2,18 m/);
  assert.match(content, /1,90 m/);
  assert.match(content, /2,16 m/);
  assert.match(content, /2,02 m/);
  assert.match(content, /1,80 m/);
  assert.match(content, /1,40 m/);
});

test("regional mechanism keeps the hydrological branches and wind explicit", () => {
  for (const term of ["Lagoa Mirim", "Piratini", "Jaguarão", "Canal São Gonçalo", "Guaíba", "Lagoa dos Patos"]) {
    assert.match(content, new RegExp(term));
  }
  assert.match(content, /vento nordeste/);
  assert.match(page, /Bombear não resolve quando o destino da água também está alto/);
});

test("historical levels keep temporal and vertical-reference caveats", () => {
  assert.match(page, /cada valor abaixo conserva a data e o contexto/);
  assert.match(page, /estação, datum, zero da régua e referência vertical/);
  assert.match(page, /2,25 m acima do normal/);
  assert.match(page, /não entra como\s+cota calibrada/);
  assert.match(content, /não representa famílias simultaneamente desabrigadas/);
});

test("source hierarchy is explicit and the G1 remains complementary", () => {
  assert.match(content, /www\.pelotas\.rs\.gov\.br/);
  assert.match(content, /pelotashomolog\.coinpel\.com\.br/);
  assert.match(content, /g1\.globo\.com/);
  assert.match(content, /Registro jornalístico contemporâneo complementar/);
  assert.match(page, /espinha dorsal desta reconstrução é a série “Cheias 2015” da Prefeitura/);
});

test("2015 history connects earlier, later and current hydrology pages", () => {
  assert.match(page, /to="\/enchente-1941-pelotas"/);
  assert.match(page, /to="\/enchente-2024-pelotas-laranjal"/);
  assert.match(page, /to="\/situacao-hidrologica-pelotas"/);
  assert.match(page, /to="\/nivel-da-lagoa-dos-patos-laranjal"/);
});
