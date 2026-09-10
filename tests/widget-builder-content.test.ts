import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createDefaultWidgetContent,
  normalizeWidgetContent,
  withWidgetContentConfig,
  WIDGET_PRESENTATION_KEYS,
} from "../src/lib/widgets/widget-content.ts";

const builder = readFileSync("src/components/widgets/WidgetBuilder.tsx", "utf8");
const controls = readFileSync("src/components/widgets/WidgetContentControls.tsx", "utf8");
const controlCss = readFileSync("src/components/widgets/WidgetContentControls.css", "utf8");
const renderer = readFileSync("src/routes/embed/widget.tsx", "utf8");
const rendererCss = readFileSync("src/components/embed/ManagedWidgetAppearance.css", "utf8");
const functions = readFileSync("src/lib/widgets/widget.functions.ts", "utf8");
const laranjalAdapter = readFileSync("src/components/embed/ManagedLaranjalLevelEmbed.tsx", "utf8");
const currentWeather = readFileSync("src/components/embed/ObsWeatherStatusWidget.tsx", "utf8");
const forecast = readFileSync("src/components/embed/SevenDayForecastWidget.tsx", "utf8");
const rain = readFileSync("src/components/embed/RainWidget.tsx", "utf8");
const wind = readFileSync("src/components/embed/WindWidget.tsx", "utf8");

test("apresentações são fechadas em Cartão, Compacto e Horizontal", () => {
  assert.deepEqual(WIDGET_PRESENTATION_KEYS, ["card", "compact", "horizontal"]);
  assert.match(controls, /Cartão/);
  assert.match(controls, /Compacto/);
  assert.match(controls, /Horizontal/);
  assert.doesNotMatch(controls, /textarea/);
});

test("cada módulo nasce com blocos seguros e pelo menos um bloco visível", () => {
  const rainDefaults = createDefaultWidgetContent("chuva-pelotas");
  assert.equal(rainDefaults.presentation, "card");
  assert.deepEqual(rainDefaults.visibleBlocks, ["observed", "today", "hourly"]);

  const normalized = normalizeWidgetContent("chuva-pelotas", {
    content: {
      presentation: "horizontal",
      visibleBlocks: ["hourly", "javascript:alert(1)"],
    },
  });
  assert.equal(normalized.presentation, "horizontal");
  assert.deepEqual(normalized.visibleBlocks, ["hourly"]);

  const empty = normalizeWidgetContent("vento-pelotas", {
    content: { presentation: "compact", visibleBlocks: [] },
  });
  assert.deepEqual(empty.visibleBlocks, ["current-wind", "current-gust", "hourly"]);
});

test("config de conteúdo preserva as demais chaves do widget", () => {
  const merged = withWidgetContentConfig(
    { appearance: { preset: "tempo-dark" }, futureSetting: true },
    "previsao-7-dias",
    { presentation: "compact", visibleBlocks: ["rain", "updated-at"] },
  ) as Record<string, unknown>;

  assert.equal(merged.futureSetting, true);
  assert.deepEqual(merged.content, {
    presentation: "compact",
    visibleBlocks: ["rain", "updated-at"],
  });
});

test("builder oferece blocos, formatos e prévia real antes de criar", () => {
  assert.match(builder, /WidgetContentControls/);
  assert.match(builder, /buildLivePreviewUrl/);
  assert.match(builder, /previewType/);
  assert.match(builder, /Prévia real/);
  assert.match(builder, /Dados atuais do Tempo Pelotas/);
  assert.match(builder, /message\.source !== "tempo-pelotas-widget"/);
  assert.match(builder, /event\.source !== frameRef\.current\?\.contentWindow/);
  assert.match(builder, /content\.visibleBlocks\.join\(","\)/);
  assert.match(builder, /appearance, content/);
  assert.doesNotMatch(builder, /iframe[\s\S]*srcDoc=/);
});

test("controle impede desligar o último bloco e permite restaurar padrão", () => {
  assert.match(controls, /value\.visibleBlocks\.length === 1/);
  assert.match(controls, /disabled=\{lastVisible\}/);
  assert.match(controls, /Mostrar padrão/);
  assert.match(controls, /createDefaultWidgetContent/);
  assert.match(controlCss, /focus-visible/);
  assert.match(controlCss, /forced-colors: active/);
});

test("servidor valida owner, apresentação e blocos permitidos por módulo", () => {
  assert.match(functions, /widgetContentSchema/);
  assert.match(functions, /z\.enum\(WIDGET_PRESENTATION_KEYS\)/);
  assert.match(functions, /requestedContentIsAllowed/);
  assert.match(functions, /getWidgetContentCatalog\(type\)/);
  assert.match(functions, /withWidgetContentConfig/);
  assert.match(functions, /content: WidgetContentDefinition/);
  assert.match(functions, /\.eq\("user_id", user\.id\)/);
  assert.match(functions, /\.eq\("version", current\.version\)/);
  assert.match(functions, /code: "invalid_config"/);
});

test("renderer usa o mesmo caminho de dados para prévia e widget salvo", () => {
  assert.match(renderer, /createPreviewDefinition/);
  assert.match(renderer, /loadWidgetPayload/);
  assert.match(renderer, /getLaranjalLevelData/);
  assert.match(renderer, /getObsWeatherStatus/);
  assert.match(renderer, /getAggregatedPelotasWeather/);
  assert.match(renderer, /data-widget-presentation=\{widgetContent\.presentation\}/);
  assert.match(renderer, /content=\{widgetContent\}/);
  assert.match(rendererCss, /data-widget-presentation="card"/);
  assert.match(rendererCss, /data-widget-presentation="compact"/);
  assert.match(rendererCss, /data-widget-presentation="horizontal"/);
  assert.match(rendererCss, /@media \(max-width: 680px\)/);
});

test("os cinco módulos consomem apenas os blocos controlados do catálogo", () => {
  assert.match(laranjalAdapter, /"movement"/);
  assert.match(laranjalAdapter, /"chart"/);
  assert.match(laranjalAdapter, /"updated-at"/);
  assert.match(currentWeather, /isWidgetBlockVisible\(content, "icon"\)/);
  assert.match(currentWeather, /isWidgetBlockVisible\(content, "condition"\)/);
  assert.match(forecast, /isWidgetBlockVisible\(content, "rain"\)/);
  assert.match(forecast, /isWidgetBlockVisible\(content, "gusts"\)/);
  assert.match(rain, /isWidgetBlockVisible\(content, "observed"\)/);
  assert.match(rain, /isWidgetBlockVisible\(content, "today"\)/);
  assert.match(rain, /isWidgetBlockVisible\(content, "hourly"\)/);
  assert.match(wind, /isWidgetBlockVisible\(content, "current-wind"\)/);
  assert.match(wind, /isWidgetBlockVisible\(content, "current-gust"\)/);
  assert.match(wind, /isWidgetBlockVisible\(content, "hourly"\)/);
});
