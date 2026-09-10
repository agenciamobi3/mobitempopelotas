import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync(
  "src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx",
  "utf8",
);
const styles = readFileSync(
  "src/components/hydrology/LaranjalLevelVisualRefresh.css",
  "utf8",
);
const anaStyles = readFileSync(
  "src/components/hydrology/AnaRhnLaranjalStationProfile.module.css",
  "utf8",
);
const historyStyles = readFileSync(
  "src/components/hydrology/LaranjalMonitoringHistory.module.css",
  "utf8",
);

test("rota do Laranjal ativa refresh visual exclusivo", () => {
  assert.match(route, /LaranjalLevelVisualRefresh\.css/);
  assert.match(
    route,
    /className="hydrology-editorial-route hydrology-editorial-route--laranjal"/,
  );
});

test("hero do Laranjal usa faixa full-bleed clara e tipografia das páginas internas", () => {
  assert.match(styles, /\.hydrology-editorial-route--laranjal \.hydrology-editorial-hero/);
  assert.match(styles, /width: 100vw/);
  assert.match(styles, /linear-gradient\(105deg, #f2fbfc/);
  assert.match(styles, /font-size: clamp\(2\.85rem, 4\.4vw, 4\.45rem\)/);
  assert.match(styles, /\.hydrology-editorial-route--laranjal \.hydrology-editorial-back,[\s\S]*display: none/);
});

test("resumo hidrológico deixa de usar painel escuro e card elevado", () => {
  assert.match(
    styles,
    /\.hydrology-editorial-route--laranjal \.hydrology-editorial-media \{[\s\S]*background: transparent/,
  );
  assert.match(
    styles,
    /\.hydrology-editorial-route--laranjal \.hydrology-editorial-card \{[\s\S]*border-radius: 0[\s\S]*box-shadow: none/,
  );
  assert.match(styles, /\.hydrology-editorial-route--laranjal \.hydrology-editorial-card dl/);
});

test("corpo principal usa rail editorial largo e capítulos abertos", () => {
  assert.match(styles, /width: min\(1440px, calc\(100% - 48px\)\)/);
  assert.match(styles, /border-bottom: 1px solid rgb\(7 30 47 \/ 10%\)/);
  assert.match(styles, /font-size: clamp\(2\.35rem, 4vw, 4\.15rem\)/);
});

test("perfil ANA e histórico acompanham o mesmo rail de 1440px", () => {
  assert.match(anaStyles, /width: min\(1440px, calc\(100% - 48px\)\)/);
  assert.match(historyStyles, /width: min\(1440px, calc\(100% - 48px\)\)/);
  assert.match(anaStyles, /font-size: clamp\(2\.35rem, 4vw, 4\.15rem\)/);
  assert.match(historyStyles, /font-size: clamp\(2\.35rem, 4vw, 4\.15rem\)/);
});
