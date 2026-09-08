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
    /<AnaRhnLaranjalStationProfile data=\{data\.anaRhnProfile\} \/>\s*<LaranjalMonitoringHistory \/>\s*<LaranjalEmbedGuide \/>/,
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

test("monitoring history does not manufacture vertical continuity", () => {
  assert.match(component, /não comprova/);
  assert.match(component, /mesmo hardware, zero de régua, RN ou datum vertical/);
  assert.match(component, /mantém as identidades e referências separadas/);
  assert.doesNotMatch(component, /87955001[^\n]{0,120}mesmo sensor/i);
  assert.doesNotMatch(component, /87955001[^\n]{0,120}mesmo zero/i);
});

test("monitoring history stays editorial and open instead of becoming another card grid", () => {
  assert.match(styles, /border-top: 1px solid/);
  assert.match(styles, /grid-template-columns: minmax\(150px, 0\.26fr\) minmax\(0, 1fr\)/);
  assert.match(styles, /@media \(max-width: 700px\)/);
  assert.doesNotMatch(styles, /box-shadow/);
  assert.doesNotMatch(styles, /border-radius/);
}
);
