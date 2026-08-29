import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("src/lib/supabase/server-client.server.ts", "utf8");

test("modo mock explícito continua soberano", () => {
  assert.match(source, /requestedMode === "mock"\s*\? "mock"/);
});

test("modo externo pode ser inferido somente com configuração pública completa quando a flag estiver ausente", () => {
  assert.match(
    source,
    /requestedMode === "external" \|\| \(!requestedMode && Boolean\(url && publishableKey\)\)/,
  );
  assert.match(source, /isPublicConfigured: mode === "external" && Boolean\(url && publishableKey\)/);
  assert.match(source, /isAdminConfigured: mode === "external" && Boolean\(url && secretKey\)/);
});

test("ausência de URL ou chave pública não promove runtime automaticamente para external", () => {
  assert.doesNotMatch(source, /!requestedMode && Boolean\(secretKey\)/);
  assert.doesNotMatch(source, /!requestedMode \? "external"/);
  assert.match(source, /:\s*"mock";\s*\n\s*return \{/);
});
