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
const accountAccessMigration = readFileSync(
  "supabase/migrations/20260822043000_create_account_access.sql",
  "utf8",
);
const publicRoutes = readFileSync("src/lib/public-routes.ts", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const shell = readFileSync("src/observatory/ui/ObservatoryShell.tsx", "utf8");
const viewer = readFileSync("src/observatory/core/ObservatoryViewer.tsx", "utf8");
const layerCatalog = readFileSync("src/observatory/core/ObservatoryLayerCatalog.ts", "utf8");
const liveLayers = readFileSync("src/observatory/data/observatory-live-layers.ts", "utf8");
const cesiumRuntime = readFileSync(
  "src/observatory/core/observatory-cesium-runtime.ts",
  "utf8",
);
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
    "admin de allowlist precisa ser liberado antes da consulta de assinatura",
  );
});

test("admin persistente pode acessar como Free sem forjar tier PRO", () => {
  assert.match(accountAccessMigration, /source[^\n]*system, admin ou billing/);
  assert.match(accountAccessMigration, /revoke all on table public\.account_access from public, anon, authenticated/);
  assert.match(accountAccessMigration, /grant select on table public\.account_access to authenticated/);
  assert.doesNotMatch(accountAccessMigration, /grant\s+(?:update|insert|delete)[^\n]*authenticated/i);
  assert.match(accessFunctions, /ADMIN_ACCESS_SOURCE = "admin"/);
  assert.match(accessFunctions, /hasPersistentAdminGrant/);
  assert.match(accessFunctions, /access\.status === "active"/);
  assert.match(accessFunctions, /access\.source\.trim\(\)\.toLowerCase\(\) === ADMIN_ACCESS_SOURCE/);
  assert.match(accessFunctions, /persistentAdminGrant \|\| entitlementGrant/);
  assert.match(accessFunctions, /persistentAdminGrant \? "admin"/);
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

test("catálogo inicial expõe apenas camadas observacionais aprovadas", () => {
  for (const id of ["radar", "satellite", "lightning", "alerts", "hydrology"]) {
    assert.match(layerCatalog, new RegExp(`id: "${id}"`));
  }
  assert.match(layerCatalog, /id: "radar"[\s\S]*defaultEnabled: true/);
  assert.match(layerCatalog, /classification: "observed"/);
  assert.doesNotMatch(layerCatalog, /clouds3d|wind3d|fires/);
  assert.match(shell, /OBSERVATORY_LAYER_DEFINITIONS/);
  assert.match(shell, /aria-pressed=\{layer\.runtime\.enabled\}/);
});

test("camadas reutilizam integrações canônicas e não expõem novas APIs diretas", () => {
  assert.match(liveLayers, /getRedemetOverview/);
  assert.match(liveLayers, /getAggregatedPelotasWeather/);
  assert.match(liveLayers, /getLagoonMonitoringNetwork/);
  assert.match(liveLayers, /getLaranjalLevelData/);
  assert.doesNotMatch(liveLayers, /REDEMET_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(liveLayers, /fetch\s*\(/);
  assert.match(liveLayers, /alert\.relevance === "pelotas"/);
  assert.match(liveLayers, /REGIONAL_CITIES/);
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
  assert.match(viewer, /import\("\.\/observatory-cesium-runtime"\)/);
  assert.doesNotMatch(route, /(?:from|import\()\s*["']cesium/);
  assert.equal(route.includes("ObservatoryViewer"), false);
  assert.match(viewer, /CESIUM_BASE_URL = "\/cesium\/"/);
  assert.ok(
    viewer.indexOf("CESIUM_BASE_URL = CESIUM_BASE_URL") < viewer.indexOf('import("./observatory-cesium-runtime")'),
    "base URL precisa ser definida antes de importar o runtime Cesium",
  );
  assert.match(parsed.scripts?.["cesium:prepare"] ?? "", /prepare-cesium-assets\.mjs/);
  assert.match(parsed.scripts?.build ?? "", /cesium:prepare/);
  assert.match(parsed.scripts?.dev ?? "", /cesium:prepare/);
});

test("runtime 3D usa CesiumWidget sem Viewer/Knockout e mantém CSP rígida", () => {
  assert.match(cesiumRuntime, /CesiumWidget/);
  assert.doesNotMatch(cesiumRuntime, /\bViewer\b/);
  assert.doesNotMatch(viewer, /Build\/Cesium\/Widgets\/widgets\.css/);
  assert.match(cesiumRuntime, /failIfMajorPerformanceCaveat:\s*false/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test("runtime Cesium materializa raster georreferenciado e coleções de pontos", () => {
  assert.match(cesiumRuntime, /SingleTileImageryProvider\.fromUrl/);
  assert.match(cesiumRuntime, /Rectangle\.fromDegrees/);
  assert.match(cesiumRuntime, /PointPrimitiveCollection/);
  assert.match(cesiumRuntime, /setImageLayer/);
  assert.match(cesiumRuntime, /setPointLayer/);
  assert.match(viewer, /loadObservatoryLayer/);
  assert.match(viewer, /runtime\.removeLayer\(id\)/);
});

test("assets Cesium são materializados sem versionar cópia do node_modules", () => {
  for (const directory of ["Assets", "ThirdParty", "Widgets", "Workers"]) {
    assert.match(assetPrep, new RegExp(`"${directory}"`));
  }
  assert.match(assetPrep, /Build", "Cesium"/);
  assert.match(assetPrep, /public", "cesium"/);
});

test("viewer mínimo usa base keyless, terreno com fallback e render sob demanda", () => {
  assert.match(cesiumRuntime, /OpenStreetMapImageryProvider/);
  assert.match(cesiumRuntime, /© OpenStreetMap contributors/);
  assert.match(cesiumRuntime, /terrain\.reearth\.land\/cesium-mesh\/ellipsoid/);
  assert.match(cesiumRuntime, /CesiumTerrainProvider\.fromUrl/);
  assert.match(cesiumRuntime, /new EllipsoidTerrainProvider\(\)/);
  assert.match(cesiumRuntime, /requestRenderMode = true/);
  assert.match(cesiumRuntime, /maximumRenderTimeChange = Number\.POSITIVE_INFINITY/);
  assert.match(cesiumRuntime, /PELOTAS_LONGITUDE/);
  assert.match(cesiumRuntime, /PELOTAS_LATITUDE/);
  assert.match(viewer, /widget\.destroy\(\)/);
  assert.match(viewer, /CESIUM_RUNTIME/);
});

test("CSP acrescenta somente os providers usados pela fundação 3D", () => {
  assert.match(csp, /https:\/\/tile\.openstreetmap\.org/);
  assert.match(csp, /https:\/\/terrain\.reearth\.land/);
  assert.match(csp, /worker-src 'self' blob:/);
  assert.doesNotMatch(csp, /script-src[^\n]*terrain\.reearth\.land/);
  assert.doesNotMatch(csp, /script-src[^\n]*tile\.openstreetmap\.org/);
});
