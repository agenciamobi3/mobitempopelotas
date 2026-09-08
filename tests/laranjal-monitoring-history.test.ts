import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx", "utf8");
const component = readFileSync("src/components/hydrology/LaranjalMonitoringHistory.tsx", "utf8");
const styles = readFileSync("src/components/hydrology/LaranjalMonitoringHistory.module.css", "utf8");

test("Laranjal page places monitoring history after the ANA registry profile", () => {
  assert.match(route, /AnaRhnLaranjalStationProfile/);
  assert.match(route, /LaranjalMonitoringHistory/);
  assert.match(
    route,
    /<AnaRhnLaranjalStationProfile data=\{data\.anaRhnProfile\} \/>\s*<LaranjalMonitoringHistory anaRhnProfile=\{data\.anaRhnProfile\} \/>\s*<LaranjalEmbedGuide \/>/,
  );
});

test("monitoring history keeps concrete dates and named sources", () => {
  assert.match(component, /9 de maio de 2024/);
  assert.match(component, /27 de junho de 2025/);
  assert.match(component, /16 de agosto de 2026/);
  assert.match(component, /I CONABREH/);
  assert.match(component, /Prefeitura Municipal de Pelotas/);
  assert.match(component, /A Hora do Sul/);
  assert.match(component, /static\.even3\.com\/anais\/937195\.pdf/);
  assert.match(component, /pelotas\.rs\.gov\.br\/noticia\/prefeitura-realiza-acoes-preventivas-no-laranjal/);
  assert.match(component, /ahoradosul\.com\.br\/conteudos\/2026\/08\/16/);
});

test("ANA milestone is derived from the live 87955001 inventory instead of a copied date", () => {
  assert.match(component, /profile\.status !== "live"/);
  assert.match(component, /instrument\.label === "Telemetria"/);
  assert.match(component, /telemetric\?\.startedAt/);
  assert.match(component, /ANA registra a identidade telemétrica 87955001 no Laranjal/);
  assert.match(component, /Cadastro público ANA\/SNIRH da estação 87955001/);
  assert.match(component, /não demonstra que ela seja o mesmo equipamento anunciado pela Prefeitura em 2025/);
  assert.doesNotMatch(component, /dateIso: "2026-06-08"/);
});

test("monitoring history does not manufacture vertical or hardware continuity", () => {
  assert.match(component, /não comprova/);
  assert.match(component, /mesmo hardware, zero de régua, RN ou datum vertical/);
  assert.match(component, /cadastro da 87955001 é posterior ao anúncio municipal de 2025/);
  assert.match(component, /mantém as referências separadas/);
  assert.doesNotMatch(component, /87955001[^\n]{0,120}é o mesmo sensor/i);
  assert.doesNotMatch(component, /87955001[^\n]{0,120}mesmo zero/i);
});

test("monitoring history stays editorial and open instead of becoming another card grid", () => {
  assert.match(styles, /border-top: 1px solid/);
  assert.match(styles, /grid-template-columns: minmax\(150px, 0\.26fr\) minmax\(0, 1fr\)/);
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.doesNotMatch(styles, /box-shadow/);
  assert.doesNotMatch(styles, /border-radius/);
});
