import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveAccountAccess } from "../src/lib/auth/account-access.ts";
import { ObservatoryLayerManager } from "../src/observatory/core/ObservatoryLayerManager.ts";
import { ObservatoryRenderGovernor } from "../src/observatory/core/ObservatoryRenderGovernor.ts";

const route = readFileSync("src/routes/observatorio.tsx", "utf8");
const accessFunctions = readFileSync(
  "src/observatory/data/observatory-access.functions.ts",
  "utf8",
);
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const packageJson = readFileSync("package.json", "utf8");

test("Observatório é negado ao Free e concedido somente ao PRO ativo", () => {
  assert.equal(resolveAccountAccess(null).entitlements.observatoryAccess, false);
  assert.equal(
    resolveAccountAccess({ tier: "pro", status: "active" }).entitlements.observatoryAccess,
    true,
  );
  assert.equal(
    resolveAccountAccess({ tier: "pro", status: "suspended" }).entitlements.observatoryAccess,
    false,
  );
});

test("rota do Observatório permanece privada para robôs e fora do inventário público", () => {
  for (const directive of ["noindex", "nofollow", "noarchive", "nosnippet", "noimageindex"]) {
    assert.match(route, new RegExp(directive));
  }
  assert.match(route, /googlebot/);
  assert.match(route, /absoluteUrl\("\/observatorio"\)/);
  assert.doesNotMatch(publicRoutes, /\/observatorio(?:["'`/]|$)/);
});

test("Observatório usa shell próprio sem header/footer público duplicado", () => {
  assert.match(siteLayout, /"\/observatorio"/);
  assert.match(siteLayout, /standaloneRoutes\.has\(resolvedPathname\)/);
});

test("gate do Observatório resolve sessão e entitlement no servidor", () => {
  assert.match(accessFunctions, /createServerFn\(\{ method: "GET" \}\)/);
  assert.match(accessFunctions, /client\.auth\.getUser\(\)/);
  assert.match(accessFunctions, /access\.entitlements\.observatoryAccess/);
  assert.match(accessFunctions, /Cache-Control", "private, no-store, max-age=0"/);
  assert.match(accessFunctions, /CDN-Cache-Control", "no-store"/);
  assert.match(accessFunctions, /X-Robots-Tag/);
  assert.match(accessFunctions, /noimageindex/);
  assert.doesNotMatch(accessFunctions, /service_role|SUPABASE_SERVICE_ROLE_KEY/i);
});

test("usuário sem entitlement não monta o shell avançado", () => {
  const deniedGate = route.indexOf("if (!access.allowed)");
  const shellMount = route.lastIndexOf("return <ObservatoryShell />");
  assert.ok(deniedGate >= 0, "rota precisa tratar acesso negado explicitamente");
  assert.ok(shellMount > deniedGate, "shell só pode ser montado depois do gate de entitlement");
});

test("Layer Manager começa tipado e sem camadas meteorológicas implícitas", () => {
  const manager = new ObservatoryLayerManager();
  assert.deepEqual(manager.list(), []);

  manager.register({
    id: "foundation-test",
    label: "Fundação",
    category: "visual",
    classification: "visual",
    temporal: false,
    defaultEnabled: false,
    requiredEntitlement: "observatoryAccess",
    attribution: "Tempo Pelotas",
    sourcePolicyId: "internal-foundation",
  });

  assert.equal(manager.get("foundation-test")?.runtime.status, "disabled");
  assert.equal(manager.setEnabled("foundation-test", true)?.runtime.status, "loading");
  assert.equal(manager.setOpacity("foundation-test", 2)?.runtime.opacity, 1);
});

test("Render Governor é independente de Cesium e pode ficar ocioso", () => {
  const governor = new ObservatoryRenderGovernor();
  assert.equal(typeof governor.request, "function");
  assert.equal(typeof governor.attach, "function");
  governor.destroy();
});

test("fundação atual não finge que Cesium já está instalado", () => {
  const parsed = JSON.parse(packageJson) as { dependencies?: Record<string, string> };
  assert.equal(parsed.dependencies?.cesium, undefined);
  assert.doesNotMatch(route, /from ["']cesium["']/);
  assert.doesNotMatch(shell, /from ["']cesium["']/);
  assert.match(shell, /runtime Cesium será\s+conectado após a instalação versionada/s);
});
