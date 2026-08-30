import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
  packages?: Record<
    string,
    {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
};
const generator = readFileSync("scripts/generate-route-tree.mjs", "utf8");
const previewLauncher = readFileSync("scripts/preview-production.mjs", "utf8");
const viteConfig = readFileSync("vite.config.ts", "utf8");
const qualityWorkflow = readFileSync(".github/workflows/quality.yml", "utf8");

const GENERATOR_COMMAND = "node scripts/generate-route-tree.mjs";

function workflowStepPosition(command: string) {
  const position = qualityWorkflow.indexOf(command);
  assert.notEqual(position, -1, `workflow deve executar ${command}`);
  return position;
}

test("route tree is generated before development, build, tests and typecheck", () => {
  assert.equal(packageJson.scripts?.["routes:generate"], GENERATOR_COMMAND);
  assert.equal(packageJson.scripts?.["routes:check"], `${GENERATOR_COMMAND} --check`);
  assert.match(packageJson.scripts?.dev ?? "", /^node scripts\/generate-route-tree\.mjs && vite dev$/);
  assert.match(packageJson.scripts?.build ?? "", /^node scripts\/generate-route-tree\.mjs && vite build$/);
  assert.match(
    packageJson.scripts?.["build:dev"] ?? "",
    /^node scripts\/generate-route-tree\.mjs && vite build --mode development$/,
  );
  assert.match(
    packageJson.scripts?.test ?? "",
    /^node scripts\/generate-route-tree\.mjs && node --test tests\/\*\*\/\*\.test\.ts$/,
  );
  assert.match(
    packageJson.scripts?.["test:routes"] ?? "",
    /^node scripts\/generate-route-tree\.mjs && node --test tests\/public-routes\.test\.ts$/,
  );
  assert.match(
    packageJson.scripts?.typecheck ?? "",
    /^node scripts\/generate-route-tree\.mjs && tsc --noEmit$/,
  );
});

test("production preview uses Nitro output with a Windows-safe Wrangler launcher", () => {
  assert.equal(packageJson.scripts?.preview, "node scripts/preview-production.mjs");
  assert.match(previewLauncher, /\.output\/nitro\.json/);
  assert.match(previewLauncher, /process\.platform === "win32"/);
  assert.match(previewLauncher, /process\.env\.ComSpec \|\| "cmd\.exe"/);
  assert.match(previewLauncher, /npx \$\{wranglerArgs\.join\(" "\)\}/);
  assert.match(previewLauncher, /"4173"/);
  assert.notEqual(packageJson.scripts?.preview, "vite preview");
});

test("direct Vite invocations generate routes before TanStack plugins are created", () => {
  const bootstrapIndex = viteConfig.indexOf("execFileSync(process.execPath");
  const configIndex = viteConfig.indexOf("export default defineConfig");

  assert.ok(bootstrapIndex >= 0, "vite.config.ts deve executar o gerador de rotas");
  assert.ok(configIndex > bootstrapIndex, "o bootstrap deve ocorrer antes da criação dos plugins");
  assert.match(viteConfig, /scripts\/generate-route-tree\.mjs/);
  assert.match(viteConfig, /stdio:\s*"inherit"/);
});

test("route generator discovers all exported file routes recursively", () => {
  assert.match(generator, /readdir\(directory, \{ withFileTypes: true \}\)/);
  assert.match(generator, /CREATE_FILE_ROUTE_CALL_PATTERN/);
  assert.match(generator, /ROUTE_PATTERN/);
  assert.match(generator, /expectedRoutePath/);
  assert.match(generator, /deve declarar createFileRoute com um caminho literal/);
  assert.match(generator, /Caminho incompatível/);
  assert.match(generator, /Rota duplicada detectada/);
  assert.match(generator, /Identificador de rota duplicado/);
  assert.match(generator, /routeTree\.gen\.ts regenerado/);
  assert.match(generator, /preLoaderRoute: typeof \$\{route\.identifier\}Import/);
  assert.match(generator, /parentRoute: typeof rootRouteImport/);
  assert.match(generator, /_addFileChildren\(rootRouteChildren\)/);
  assert.match(generator, /_addFileTypes<FileRouteTypes>\(\)/);
});

test("route check accepts TanStack final format and validates exact route coverage", () => {
  assert.match(generator, /ROUTE_TREE_IMPORT_PATTERN/);
  assert.match(generator, /function committedRouteImports/);
  assert.match(generator, /function validateCommittedRouteTree/);
  assert.match(generator, /rotas ausentes/);
  assert.match(generator, /rotas extras/);
  assert.match(generator, /Árvore versionada cobre exatamente/);
});

test("committed route tree matches every discovered route module", () => {
  const result = spawnSync(process.execPath, ["scripts/generate-route-tree.mjs", "--check"], {
    encoding: "utf8",
  });

  assert.equal(
    result.status,
    0,
    [result.stdout, result.stderr].filter(Boolean).join("\n") || "route tree check failed",
  );
});

test("quality workflow checks the committed tree before production build", () => {
  assert.doesNotMatch(qualityWorkflow, /routes:generate\s*&&\s*npm run routes:check/);
  assert.ok(
    workflowStepPosition("npm run routes:check") < workflowStepPosition("npm run build"),
    "routes:check deve executar antes do build",
  );
});

test("package manifest remains compatible with npm ci lock metadata", () => {
  const lockedRoot = packageLock.packages?.[""];
  assert.ok(lockedRoot, "package-lock.json deve conter os metadados do projeto raiz");
  assert.deepEqual(packageJson.dependencies, lockedRoot.dependencies);
  assert.deepEqual(packageJson.devDependencies, lockedRoot.devDependencies);
});
