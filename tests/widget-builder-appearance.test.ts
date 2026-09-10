import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import "./widget-builder-content.test.ts";
import { resolveAccountAccess } from "../src/lib/auth/account-access.ts";
import {
  createAppearanceFromPreset,
  normalizeWidgetAppearance,
  widgetAppearanceCssVariables,
  withWidgetAppearanceConfig,
  WIDGET_STYLE_PRESET_KEYS,
  WIDGET_STYLE_PRESETS,
} from "../src/lib/widgets/widget-appearance.ts";

const builder = readFileSync("src/components/widgets/WidgetBuilder.tsx", "utf8");
const controls = readFileSync("src/components/widgets/WidgetAppearanceControls.tsx", "utf8");
const builderCss = readFileSync("src/components/widgets/WidgetBuilderAppearance.css", "utf8");
const functions = readFileSync("src/lib/widgets/widget.functions.ts", "utf8");
const renderer = readFileSync("src/routes/embed/widget.tsx", "utf8");
const rendererCss = readFileSync("src/components/embed/ManagedWidgetAppearance.css", "utf8");

test("Free recebe todos os presets visuais controlados nesta fase", () => {
  const access = resolveAccountAccess(null);
  assert.equal(access.tier, "free");
  assert.equal(access.entitlements.widgetsAdvancedThemes, true);
  assert.deepEqual(WIDGET_STYLE_PRESET_KEYS, [
    "tempo-dark",
    "clean-light",
    "soft-glass",
    "minimal-neutral",
  ]);
  assert.equal(WIDGET_STYLE_PRESETS.length, 4);
  assert.equal(new Set(WIDGET_STYLE_PRESETS.map((preset) => preset.key)).size, 4);
});

test("preset vira uma base editável com defaults coerentes", () => {
  const clean = createAppearanceFromPreset("clean-light");
  assert.deepEqual(clean, {
    preset: "clean-light",
    accentColor: "#087C8A",
    radius: 22,
    density: "comfortable",
  });

  const minimal = createAppearanceFromPreset("minimal-neutral");
  assert.equal(minimal.radius, 12);
  assert.equal(minimal.density, "compact");
});

test("config visual é normalizado sem aceitar valores livres perigosos", () => {
  assert.deepEqual(
    normalizeWidgetAppearance({
      appearance: {
        preset: "soft-glass",
        accentColor: "#a1b2c3",
        radius: 999,
        density: "compact",
      },
    }),
    {
      preset: "soft-glass",
      accentColor: "#A1B2C3",
      radius: 36,
      density: "compact",
    },
  );

  assert.deepEqual(normalizeWidgetAppearance({ appearance: { preset: "javascript:alert(1)" } }), {
    preset: "tempo-dark",
    accentColor: "#18BDCD",
    radius: 28,
    density: "comfortable",
  });
});

test("salvar aparência preserva outras configurações do widget", () => {
  const merged = withWidgetAppearanceConfig(
    { horizon: 7, sourceLabel: "preservar" },
    {
      preset: "clean-light",
      accentColor: "#123456",
      radius: 18,
      density: "compact",
    },
  ) as Record<string, unknown>;

  assert.equal(merged.horizon, 7);
  assert.equal(merged.sourceLabel, "preservar");
  assert.deepEqual(merged.appearance, {
    preset: "clean-light",
    accentColor: "#123456",
    radius: 18,
    density: "compact",
  });
});

test("tokens do renderer derivam apenas da aparência normalizada", () => {
  const vars = widgetAppearanceCssVariables({
    preset: "minimal-neutral",
    accentColor: "#334455",
    radius: 10,
    density: "compact",
  });

  assert.equal(vars["--tp-widget-accent"], "#334455");
  assert.equal(vars["--tp-widget-radius"], "10px");
  assert.equal(vars["--tp-widget-gap"], "12px");
  assert.equal(vars["--tp-widget-shadow"], "none");
});

test("builder permite escolher preset e refinar cor, cantos e densidade", () => {
  assert.match(builder, /WidgetAppearanceControls/);
  assert.match(builder, /createAppearanceFromPreset\("tempo-dark"\)/);
  assert.match(builder, /canCustomizeAppearance \? \{ appearance, content \} : \{\}/);
  assert.match(builder, /updateUserWidgetAppearance/);
  assert.match(builder, /Personalizar widget/);
  assert.match(controls, /WIDGET_STYLE_PRESETS\.map/);
  assert.match(controls, /type="radio"/);
  assert.match(controls, /type="color"/);
  assert.match(controls, /widget-style-color-hex/);
  assert.match(controls, /pattern="#[0-9A-Fa-f]\{6\}"/);
  assert.match(controls, /type="range"/);
  assert.match(controls, /Densidade/);
  assert.match(controls, /Amostra do estilo/);
  assert.match(controls, /Prévia visual/);
  assert.doesNotMatch(controls, /18°C/);
  assert.doesNotMatch(controls, /Parcialmente nublado/);
  assert.doesNotMatch(controls, /textarea/);
  assert.doesNotMatch(builder, /dangerouslySetInnerHTML/);
});

test("servidor valida, persiste e versiona personalização por owner", () => {
  assert.match(functions, /widgetAppearanceSchema/);
  assert.match(functions, /regex\(\/\^#\[0-9A-F\]\{6\}\$\/i/);
  assert.match(functions, /radius: z\.number\(\)\.int\(\)\.min\(0\)\.max\(36\)/);
  assert.match(functions, /\(data\.appearance \|\| data\.content\) && !access\.entitlements\.widgetsAdvancedThemes/);
  assert.match(functions, /updateUserWidgetAppearance/);
  assert.match(functions, /widgetsAdvancedThemes/);
  assert.match(functions, /withWidgetAppearanceConfig\(current\.config, data\.appearance\)/);
  assert.match(functions, /version: nextVersion/);
  assert.match(functions, /\.eq\("user_id", user\.id\)/);
  assert.match(functions, /\.eq\("version", current\.version\)/);
  assert.match(functions, /hasStoredAppearanceConfig/);
  assert.doesNotMatch(functions, /cssText/);
  assert.doesNotMatch(functions, /html:/);
});

test("renderer aplica preset dentro do iframe sem contaminar o site hospedeiro", () => {
  assert.match(renderer, /ManagedWidgetAppearance\.css/);
  assert.match(renderer, /widgetAppearanceCssVariables/);
  assert.match(renderer, /data-widget-preset=\{appearance\.preset\}/);
  assert.match(renderer, /data-widget-scheme=\{preset\.scheme\}/);
  assert.match(renderer, /data-widget-density=\{appearance\.density\}/);
  assert.match(renderer, /loaderDeps: \(\{ search \}\) => \(\{ \.\.\.search \}\)/);
  assert.match(rendererCss, /--tp-widget-background/);
  assert.match(rendererCss, /--tp-widget-accent/);
  assert.match(rendererCss, /data-widget-preset="soft-glass"/);
  assert.match(rendererCss, /data-widget-preset="minimal-neutral"/);
  assert.match(rendererCss, /forced-colors: active/);
});

test("editor de presets é responsivo e mantém foco visível", () => {
  assert.match(builderCss, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(builderCss, /@media \(max-width: 980px\)/);
  assert.match(builderCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(builderCss, /@media \(max-width: 520px\)/);
  assert.match(builderCss, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(builderCss, /focus-visible/);
  assert.match(builderCss, /prefers-reduced-motion: reduce/);
  assert.match(builderCss, /forced-colors: active/);
});
