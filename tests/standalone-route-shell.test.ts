import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const routesRoot = path.resolve("src/routes");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");

const SELF_CONTAINED_SHELL_MARKERS = [
  "<InternalWeatherPageShell",
  "<ContentPageShell",
  "<DataExperiencePageShell",
  "<ObservationDataPageShell",
] as const;

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(resolved);
    return entry.isFile() && entry.name.endsWith(".tsx") ? [resolved] : [];
  });
}

function ownsFullShell(source: string) {
  return (
    SELF_CONTAINED_SHELL_MARKERS.some((marker) => source.includes(marker)) ||
    (source.includes("<SiteHeader") && source.includes("<SiteFooter"))
  );
}

test("rotas que renderizam shell próprio não recebem um segundo SiteLayout", () => {
  const selfContainedRoutes = routeFiles(routesRoot)
    .map((filename) => ({ filename, source: readFileSync(filename, "utf8") }))
    .filter(({ source }) => ownsFullShell(source))
    .map(({ filename, source }) => {
      const match = source.match(/createFileRoute\(["']([^"']+)["']\)/);
      assert.ok(match?.[1], `${filename} deve declarar createFileRoute com caminho literal`);
      return match[1];
    });

  assert.ok(selfContainedRoutes.length > 0, "deve existir ao menos uma rota com shell próprio");

  for (const routePath of selfContainedRoutes) {
    assert.match(
      siteLayout,
      new RegExp(`["']${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`),
      `${routePath} deve constar em standaloneRoutes para evitar header/footer duplicados`,
    );
  }
});
