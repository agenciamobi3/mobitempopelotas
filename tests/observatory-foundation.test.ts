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
const operatorAuthorization = readFileSync(
  "src/lib/admin/operator-authorization.server.ts",
  "utf8",
);
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const viewer = readFileSync("src/observatory/core/ObservatoryViewer.tsx", "utf8");
const assetPrep = readFileSync("scripts/prepare-cesium-assets.mjs", "utf8");
const csp = readFileSync("src/lib/security/content-security-policy.server.ts", "utf8");
const packageJson = readFileSync("package.json", "utf8");

test("Observatório é negado ao Free e concedido ao PRO ativo", () => {
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

test("admin confirmado pode acessar sem assinatura por allowlist server-only", () => {
  assert.match(operatorAuthorization, /process\.env\.MOBI_PORTAL_ADMIN_EMAILS/);
  assert.match(operatorAuthorization, /export function isPortalOperatorEmail/);
  assert.doesNotMatch(operatorAuthorization, /VITE_.*PORTAL_ADMIN_EMAILS/);
  assert.match(accessFunctions, /isPortalOperatorEmail\(user\.email\)/);
  assert.match(accessFunctions, /user\.email_confirmed_at/);
  assert.match(accessFunctions, /grant: "admin"/);
  assert.match(accessFunctions, /allowed: true/);
  assert.ok(
    accessFunctions.indexOf("if (isConfirmedAdmin)") < accessFunctions.indexOf("loadAccountAccess(client, user.id)"),
    "admin precisa ser liberado antes da consulta de assinatura",
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

test("Render Governor é independente do runtime Cesium e pode ficar ocioso", () => {
  const governor = new ObservatoryRenderGovernor();
  assert.equal(typeof governor.request, "function");
  assert.equal(typeof governor.attach, "function");
  governor.destroy();
});

test("Cesium fica restrito à árvore lazy do Observatório", () => {
  const parsed = JSON.parse(packageJson) as {
    dependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };

  assert.equal(parsed.dependencies?.cesium, "1.145.0");
  assert.match(shell, /lazy\(\(\) =>\s*import\("\.\.\/core\/ObservatoryViewer"\)/s);
  assert.match(viewer, /await import\("cesium"\)/);
  assert.doesNotMatch(route, /(?:from|import\()\s*["']cesium/);
  assert.equal(route.includes("ObservatoryViewer"), false);
  assert.match(viewer, /CESIUM_BASE_URL = "\/cesium\/"/);
  assert.ok(
    viewer.indexOf("CESIUM_BASE_URL = CESIUM_BASE_URL") < viewer.indexOf('await import("cesium")'),
    "base URL precisa ser definido antes de importar o runtime Cesium",
  );
  assert.match(parsed.scripts?.["cesium:prepare"] ?? "", /prepare-cesium-assets\.mjs/);
  assert.match(parsed.scripts?.build ?? "", /cesium:prepare/);
  assert.match(parsed.scripts?.dev ?? "", /cesium:prepare/);
});

test("assets Cesium são materializados sem versionar cópia do node_modules", () => {
  for (const directory of ["Assets", "ThirdParty", "Widgets", "Workers"]) {
    assert.match(assetPrep, new RegExp(`"${directory}"`));
  }
  assert.match(assetPrep, /Build", "Cesium"/);
  assert.match(assetPrep, /public", "cesium"/);
});

test("viewer mínimo usa base keyless, terreno com fallback e render sob demanda", () => {
  assert.match(viewer, /OpenStreetMapImageryProvider/);
  assert.match(viewer, /© OpenStreetMap contributors/);
  assert.match(viewer, /terrain\.reearth\.land\/cesium-mesh\/ellipsoid/);
  assert.match(viewer, /CesiumTerrainProvider\.fromUrl/);
  assert.match(viewer, /new Cesium\.EllipsoidTerrainProvider\(\)/);
  assert.match(viewer, /requestRenderMode = true/);
  assert.match(viewer, /maximumRenderTimeChange = Number\.POSITIVE_INFINITY/);
  assert.match(viewer, /PELOTAS_LONGITUDE/);
  assert.match(viewer, /PELOTAS_LATITUDE/);
  assert.match(viewer, /viewer\.destroy\(\)/);
});

test("CSP acrescenta somente os providers usados pela fundação 3D", () => {
  assert.match(csp, /https:\/\/tile\.openstreetmap\.org/);
  assert.match(csp, /https:\/\/terrain\.reearth\.land/);
  assert.match(csp, /worker-src 'self' blob:/);
  assert.doesNotMatch(csp, /script-src[^\n]*terrain\.reearth\.land/);
  assert.doesNotMatch(csp, /script-src[^\n]*tile\.openstreetmap\.org/);
});
