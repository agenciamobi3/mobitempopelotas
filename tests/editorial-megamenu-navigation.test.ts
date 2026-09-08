import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const header = readFileSync("src/production/components/home-editorial-header.tsx", "utf8");
const styles = readFileSync("src/production/components/home-editorial-header.css", "utf8");
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const homeForecastTrend = readFileSync("src/production/components/home-forecast-trend.tsx", "utf8");
const homeRadarCta = readFileSync("src/production/components/home-radar-cta.tsx", "utf8");

const requiredPublicNavigationPaths = [
  "/tempo-hoje-pelotas",
  "/tempo-amanha-pelotas",
  "/previsao-7-dias-pelotas",
  "/previsao-15-dias-pelotas",
  "/chuva-em-pelotas",
  "/vento-em-pelotas",
  "/meteograma-pelotas",
  "/radar-e-satelite-pelotas",
  "/mapa-de-geadas-rio-grande-do-sul",
  "/cameras-ao-vivo-pelotas",
  "/alertas",
  "/situacao-hidrologica-pelotas",
  "/nivel-da-lagoa-dos-patos-laranjal",
  "/nivel-do-guaiba",
  "/nivel-do-canal-sao-goncalo",
  "/nivel-do-rio-jaguarao",
  "/historia-das-enchentes-pelotas",
  "/enchente-1941-pelotas",
  "/enchente-2001-pelotas",
  "/enchente-2015-pelotas",
  "/enchente-2024-pelotas-laranjal",
  "/tempo-na-regiao-sul-rs",
  "/clima-em-pelotas",
  "/historico-climatico-pelotas",
  "/blog",
  "/status-dos-dados",
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("megamenu groups the public weather inventory into editorial areas", () => {
  for (const label of ["Previsão", "Águas", "Região", "Explorar"]) {
    assert.match(header, new RegExp(`label: "${label}"`));
  }

  for (const path of requiredPublicNavigationPaths) {
    assert.match(header, new RegExp(escapeRegExp(path)), `Menu deve expor ${path}`);
  }

  assert.match(header, /label: "História das enchentes"/);
  assert.match(header, /Índice de pesquisa com os registros de 1941, 2001, 2015 e 2024/);
});

test("approved Defesa Civil hydrology pages live under Águas and keep weather navigation separate", () => {
  assert.match(header, /label: "Nível do Canal São Gonçalo"[\s\S]*to: "\/nivel-do-canal-sao-goncalo"/);
  assert.match(header, /label: "Nível do Rio Jaguarão"[\s\S]*to: "\/nivel-do-rio-jaguarao"/);
  assert.match(header, /activePaths:[\s\S]*"\/nivel-do-canal-sao-goncalo"[\s\S]*"\/nivel-do-rio-jaguarao"/);
  assert.match(header, /label: "Jaguarão"[\s\S]*path: "\/tempo-em\/jaguarao-rs"/);
  assert.match(header, /label: "Capão do Leão"[\s\S]*path: "\/tempo-em\/capao-do-leao-rs"/);
});

test("satélites e radares ficam em página dedicada e navegação direta", () => {
  assert.doesNotMatch(productionHome, /HomeRadarEditorial/);
  assert.doesNotMatch(header, /id: "monitoring"/);
  assert.match(header, /to="\/radar-e-satelite-pelotas"/);
  assert.match(header, />\s*Satélites e Radares\s*<\/Link>/);
  assert.match(header, /return <a \{\.\.\.props\} href=\{href\} \/>/);
});

test("Home mantém descoberta por CTA estática sem carregar REDEMET", () => {
  assert.match(homeForecastTrend, /import \{ HomeRadarCta \}/);
  assert.match(homeForecastTrend, /<HomeRadarCta \/>/);
  assert.match(homeRadarCta, /href="\/radar-e-satelite-pelotas"/);
  assert.match(homeRadarCta, /As imagens são carregadas somente quando você abre o monitoramento/);
  assert.doesNotMatch(homeRadarCta, /getRedemetOverview|loadRadarPageData|fetchRedemet|WeatherMap/);
});

test("atalhos estaticos principais do megamenu pertencem ao inventario indexavel", () => {
  for (const path of requiredPublicNavigationPaths) {
    assert.match(
      publicRoutes,
      new RegExp(`path:\\s*"${escapeRegExp(path)}"`),
      `${path} deve existir em PUBLIC_ROUTES antes de aparecer no header`,
    );
  }

  assert.doesNotMatch(publicRoutes, /path:\s*"\/metodologia"|path:\s*"\/estacao-embrapa-pelotas"/);
});

test("regional shortcuts preserve TanStack typed dynamic navigation", () => {
  assert.match(header, /to: "\/tempo-em\/\$citySlug"/);
  assert.match(header, /params: \{ citySlug: "capao-do-leao-rs" \}/);
  assert.match(header, /params: \{ citySlug: "rio-grande-rs" \}/);
  assert.match(header, /params=\{item\.params\}/);
  assert.match(header, /const path = itemPath\(item\)/);
});

test("desktop megamenu is keyboard aware and exposes current navigation state", () => {
  assert.match(header, /aria-expanded=\{isOpen\}/);
  assert.match(header, /aria-controls=\{`tp-mega-\$\{menu\.id\}`\}/);
  assert.match(header, /hidden=\{!isOpen\}/);
  assert.match(header, /onBlur=\{\(event\) =>/);
  assert.match(header, /document\.addEventListener\("keydown", closeOnEscape\)/);
  assert.match(header, /aria-current=\{active \? "page" : undefined\}/);
});

test("desktop megamenu keeps the hover path continuous between trigger and panel", () => {
  assert.match(styles, /\.tp-home-header__mega \{[\s\S]*top: 100%;[\s\S]*padding-top: 10px;/);
  assert.doesNotMatch(styles, /top: calc\(100% \+ 10px\)/);
});

test("mobile navigation reuses the same megamenu inventory and direct radar link", () => {
  assert.match(header, /id="tp-mobile-menu"/);
  assert.match(header, /aria-expanded=\{mobileOpen\}/);
  assert.match(header, /\{megaMenus\.map\(\(menu\) =>/);
  assert.match(header, /menu\.sections\.flatMap/);
  assert.match(header, /aria-label="Satélites e Radares"/);
  assert.match(styles, /@media \(max-width: 1040px\)/);
  assert.match(styles, /\.tp-home-header__nav \{[\s\S]*display: none/);
  assert.match(styles, /\.tp-home-header__mobile-menu/);
});

test("megamenu keeps editorial accessibility and motion contracts", () => {
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
