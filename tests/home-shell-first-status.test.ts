import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync("src/production/ProductionHome.tsx", "utf8");

test("home diferencia recuperação shell-first de indisponibilidade confirmada", () => {
  assert.match(home, /WEATHER_RECOVERY_GRACE_MS = 12_250/);
  assert.match(home, /weatherRecoveryExpired/);
  assert.match(home, /Atualizando dados meteorológicos\.\.\./);
  assert.match(home, /Dados meteorológicos temporariamente indisponíveis/);
  assert.match(home, /aria-busy=\{recoveryPending\}/);
  assert.match(home, /setTimeout\([\s\S]*WEATHER_RECOVERY_GRACE_MS/);
});

test("home continua navegável durante a recuperação", () => {
  assert.match(home, /A página permanece navegável enquanto a atualização acontece\./);
  assert.match(home, /<HomeExplorePortal \/>/);
  assert.match(home, /<HomeDataGuide \/>/);
});
