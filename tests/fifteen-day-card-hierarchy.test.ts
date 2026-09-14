import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(
  "src/components/weather/FifteenDayForecastEditorialRefinement.css",
  "utf8",
);

test("cards de 15 dias ficam mais compactos sem reduzir protagonismo dos ícones", () => {
  assert.match(
    styles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day__day \{[\s\S]*min-height:\s*14\.5rem[\s\S]*padding:\s*14px 15px 13px/,
  );
  assert.match(
    styles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day__condition \{[\s\S]*display:\s*flex[\s\S]*align-items:\s*center/,
  );
  assert.match(
    styles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day__condition svg \{[\s\S]*width:\s*3\.15rem[\s\S]*height:\s*3\.15rem/,
  );
});

test("hierarquia separa condição principal de chuva e rajadas em duas colunas", () => {
  assert.match(
    styles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day__day dl \{[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)[\s\S]*border-top:/,
  );
  assert.match(
    styles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day__day dl > div \+ div \{[\s\S]*border-left:/,
  );
  assert.match(
    styles,
    /\.internal-weather-shell--fifteen-day \.fifteen-day__day dd \{[\s\S]*font-size:\s*0\.95rem[\s\S]*font-weight:\s*850/,
  );
});

test("responsividade preserva densidade sem esmagar os cards", () => {
  assert.match(styles, /@media \(max-width: 1280px\)[\s\S]*min-height:\s*13\.75rem/);
  assert.match(styles, /@media \(max-width: 980px\)[\s\S]*min-height:\s*13\.25rem/);
  assert.match(styles, /@media \(max-width: 560px\)[\s\S]*min-height:\s*0/);
});
