import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const overlay = readFileSync("src/components/navigation/RouteLoadingOverlay.tsx", "utf8");
const styles = readFileSync("src/components/navigation/RouteLoadingOverlay.css", "utf8");
const root = readFileSync("src/routes/__root.tsx", "utf8");
const router = readFileSync("src/router.tsx", "utf8");

test("route loading overlay observes foreground navigation without speculative preload", () => {
  assert.match(overlay, /useRouterState\(\{ select: \(state\) => state\.isLoading \}\)/);
  assert.match(overlay, /SHOW_DELAY_MS = 190/);
  assert.match(overlay, /MIN_VISIBLE_MS = 280/);
  assert.match(overlay, /hasSettledInitialLoadRef/);
  assert.match(router, /defaultPreload: false/);
  assert.doesNotMatch(router, /defaultPreload: "intent"/);
  assert.doesNotMatch(router, /defaultPreloadDelay:/);
});

test("route loading overlay uses the official portal brand and accessible status copy", () => {
  assert.match(overlay, /src="\/brand\/tempo-pelotas-purple\.svg"/);
  assert.match(overlay, /alt="Tempo Pelotas"/);
  assert.match(overlay, /role="status"/);
  assert.match(overlay, /aria-live="polite"/);
  assert.match(overlay, /Carregando\.\.\./);
});

test("hidden route loading overlay does not mount its logo or status subtree", () => {
  assert.match(
    overlay,
    /\{visible \? \([\s\S]*route-loading-overlay__content[\s\S]*tempo-pelotas-purple\.svg[\s\S]*\) : null\}/,
  );
  assert.match(overlay, /aria-busy="true"/);
});

test("route loading overlay is global, non-blocking while hidden and motion-safe", () => {
  assert.match(root, /<RouteLoadingOverlay \/>/);
  assert.match(styles, /pointer-events: none/);
  assert.match(styles, /\[data-visible="true"\][\s\S]*pointer-events: auto/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(styles, /!important/);
});
