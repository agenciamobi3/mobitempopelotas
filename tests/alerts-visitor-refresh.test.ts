import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("src/components/weather/WeatherAlertsPage.tsx", "utf8");
const coverage = readFileSync("src/components/weather/InmetAlertCoverageDetails.tsx", "utf8");
const guide = readFileSync("src/components/weather/AlertsOperationalGuide.tsx", "utf8");
const accent = readFileSync("src/components/weather/WeatherAlertsAccentContract.css", "utf8");

test("alertas removes the redundant decision card and old hero back link", () => {
  assert.doesNotMatch(page, /Informação oficial e tomada de decisão/);
  assert.doesNotMatch(page, /className="alerts-method"/);
  assert.doesNotMatch(page, /alerts-editorial-back/);
  assert.doesNotMatch(page, /ArrowLeft/);
});

test("first fold is compact editorial instead of a duplicated dashboard", () => {
  assert.match(accent, /\.alerts-editorial-hero[\s\S]*grid-template-columns:\s*minmax\(0, 1\.28fr\)/);
  assert.match(accent, /\.alerts-editorial-metrics\s*\{[\s\S]*display:\s*none/);
  assert.match(accent, /\.alerts-editorial-panel-status[\s\S]*border:\s*0/);
  assert.match(accent, /\.alerts-overview article[\s\S]*border-radius:\s*0/);
  assert.match(accent, /\.alerts-overview article[\s\S]*background:\s*transparent/);
});

test("coverage title stays concise and removes the documentary side copy", () => {
  assert.match(coverage, /Veja exatamente o território/);
  assert.match(coverage, /inmet-alert-coverage-details__desktop-break/);
  assert.match(coverage, /citado em cada aviso/);
  assert.doesNotMatch(coverage, /O INMET pode publicar áreas amplas e listas extensas de municípios/);
  assert.match(accent, /\.inmet-alert-coverage-details > footer[\s\S]*white-space:\s*nowrap/);
});

test("official source renders the repository INMET logo at 40px high and stays responsive", () => {
  assert.match(guide, /src="\/inmet_logo_banner\.png"/);
  assert.match(guide, /alt="INMET — Instituto Nacional de Meteorologia"/);
  assert.match(guide, /width="227"[\s\S]*height="40"/);
  assert.doesNotMatch(guide, /INMET consultado/);
  assert.match(accent, /dd\.alerts-source-logo-cell[\s\S]*max-width:\s*100%[\s\S]*border-radius:\s*10px/);
  assert.match(accent, /\.alerts-source-logo[\s\S]*width:\s*min\(227px, 100%\)[\s\S]*height:\s*auto[\s\S]*border-radius:\s*6px/);
});
