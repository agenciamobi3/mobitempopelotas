import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/enchente-2015-pelotas.tsx", "utf8");
const page = readFileSync("src/components/history/Flood2015HistoricalPage.tsx", "utf8");
const styles = readFileSync("src/components/history/Flood2015HistoricalPage.css", "utf8");
const content = readFileSync("src/lib/content/flood-2015-pelotas.ts", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");

test("2015 flood record is a canonical public editorial route", () => {
  assert.match(route, /createFileRoute\("\/enchente-2015-pelotas"\)/);
  assert.match(route, /Enchente de 2015 em Pelotas: linha do tempo, níveis e impactos/);
  assert.match(route, /createEditorialPageJsonLd/);
  assert.match(route, /Flood2015HistoricalPage\.css/);
  assert.match(publicRoutes, /\/enchente-2015-pelotas/);
});

test("2015 page preserves the principal official milestones", () => {
  assert.match(content, /299 mm/);
  assert.match(content, /2,20 m/);
  assert.match(content, /~1\.300 famílias/);
  assert.match(content, /18-19 de outubro de 2015/);
  assert.match(content, /2,04 m/);
  assert.match(content, /2,18 m/);
  assert.match(content, /1,90 m/);
  assert.match(content, /2,16 m/);
  assert.match(content, /2,02 m/);
  assert.match(content, /1,80 m/);
  assert.match(content, /1,40 m/);
});

test("timeline now starts before the peak and keeps the Porto gauge isolated", () => {
  assert.match(content, /14 de outubro · tarde/);
  assert.match(content, /170 mm/);
  assert.match(content, /Casa de Bombas do Porto/);
  assert.match(content, /2,10 m/);
  assert.match(content, /não é cota diretamente comparável à série Lagoa\/São Gonçalo/);
  assert.match(page, /A leitura de 2,10 m da Casa de Bombas do Porto/);
});

test("timeline renders recovered measurements with their temporal context", () => {
  assert.match(content, /measurements\?: Flood2015Measurement\[]/);
  assert.match(page, /tp-flood-event__measurements/);
  assert.match(page, /Medições de \$\{item\.date\}/);

  for (const marker of [
    "Variação do São Gonçalo",
    "Variação da Lagoa",
    "Lagoa dos Patos · 10h30",
    "Lagoa dos Patos · tarde",
    "Canal São Gonçalo · manhã",
    "fim da tarde de 27/10",
    "manhã de 27/10",
    "manhã de 03/11",
    "pico retrospectivo",
  ]) {
    assert.ok(content.includes(marker), `medição deve preservar contexto: ${marker}`);
  }

  assert.match(content, /> 1,80 m/);
  assert.match(content, /régua de 1,80 m ficou submersa; sem pico calibrado informado/);
});

test("rescued contemporary reports stay distinct from missing municipal bulletins", () => {
  assert.match(content, /27 de outubro · manhã/);
  assert.match(content, /1,60 m/);
  assert.match(content, /-40 cm/);
  assert.match(content, /137/);
  assert.match(content, /GZH citando Defesa Civil de Pelotas/);
  assert.match(content, /28 de outubro · cerca de 14h/);
  assert.match(content, /\+2 cm/);
  assert.match(content, /última medição da Defesa Civil citada pela GZH às 14h01/);
  assert.match(content, /não substitui o boletim perdido das 18h/);
  assert.match(page, /Quando um valor sobrevive apenas em reportagem contemporânea que cita a Defesa Civil/);
});

test("daily archive distinguishes full documents from index-only bulletins", () => {
  assert.match(content, /FLOOD_2015_ARCHIVE/);
  assert.match(content, /27\/10/);
  assert.match(content, /Boletim atualizado às 19h/);
  assert.match(content, /39270/);
  assert.match(content, /39279/);
  assert.match(content, /39294/);
  assert.match(content, /29\/10/);
  assert.match(content, /retrieval: "indexed"/);
  assert.match(page, /Arquivo oficial localizado/);
  assert.match(page, /não transforma essa fonte no boletim municipal perdido/);
  assert.match(styles, /\.tp-flood-archive/);
});

test("regional mechanism keeps the hydrological branches and wind explicit", () => {
  for (const term of ["Lagoa Mirim", "Piratini", "Jaguarão", "Canal São Gonçalo", "Guaíba", "Lagoa dos Patos"]) {
    assert.match(content, new RegExp(term));
  }
  assert.match(content, /vento nordeste/);
  assert.match(page, /Bombear não resolve quando o destino da água também está alto/);
});

test("historical levels keep temporal and vertical-reference caveats", () => {
  assert.match(page, /Cada medição abaixo conserva a data, o horário ou a referência temporal/);
  assert.match(page, /estação, datum, zero da régua e referência vertical/);
  assert.match(page, /2,25 m acima do normal/);
  assert.match(page, /não entra como\s+cota calibrada/);
  assert.match(content, /não representa famílias simultaneamente desabrigadas/);
  assert.match(content, /sem cota absoluta no boletim/);
  assert.match(content, /não atribui a elas níveis, totais ou tendência que não tenham sido recuperados/);
});

test("timeline includes operational recovery milestones already found in municipal archive", () => {
  assert.match(content, /23 de outubro/);
  assert.match(content, /retoma atividade na Colônia Z3/i);
  assert.match(content, /25 de outubro/);
  assert.match(content, /dique no Pontal da Barra/i);
  assert.match(content, /5 de novembro/);
  assert.match(content, /19 cargas/);
  assert.match(content, /abrigos.*desativados/i);
});

test("source hierarchy keeps municipality primary and journalism explicitly complementary", () => {
  assert.match(content, /www\.pelotas\.rs\.gov\.br/);
  assert.match(content, /pelotashomolog\.coinpel\.com\.br/);
  assert.match(content, /g1\.globo\.com/);
  assert.match(content, /gauchazh\.clicrbs\.com\.br/);
  assert.match(content, /Corroboração jornalística contemporânea/);
  assert.match(content, /Arquivo municipal de Segurança Pública - página 84/);
  assert.match(page, /espinha dorsal desta reconstrução é a série “Cheias 2015” da Prefeitura/);
  assert.match(page, /G1 e GZH entram como fontes jornalísticas contemporâneas complementares/);
});

test("2015 history connects earlier, later and current hydrology pages", () => {
  assert.match(page, /to="\/enchente-1941-pelotas"/);
  assert.match(page, /to="\/enchente-2024-pelotas-laranjal"/);
  assert.match(page, /to="\/situacao-hidrologica-pelotas"/);
  assert.match(page, /to="\/nivel-da-lagoa-dos-patos-laranjal"/);
});
