import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import {
  createCanonicalRedirectResponse,
  getCanonicalRedirectUrl,
} from "../src/lib/canonical-host.ts";
import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";
import { REGIONAL_CITIES, regionalCityPath } from "../src/lib/regional-cities.ts";
import {
  BRAND_LOGO_URL,
  CANONICAL_SITE_URL,
  SITE_URL,
  SOCIAL_IMAGE_URL,
  absoluteUrl,
} from "../src/lib/site-config.ts";
import { createSitemapXml } from "../src/lib/sitemap.ts";

const technicalHosts = [
  ["mobitempopelotas", "lovable", "app"].join("."),
  ["tempopelotas", "vercel", "app"].join("."),
];
const wwwHost = ["www", "tempopelotas", "com", "br"].join(".");
const forbiddenHostFragments = [
  ...technicalHosts,
  ["vercel", "app"].join("."),
  wwwHost,
];
const ignoredDirectories = new Set([
  ".git",
  ".output",
  ".vinxi",
  "artifacts",
  "dist",
  "node_modules",
]);
const publicSurfaceRoots = ["src/routes", "src/components", "src/production", "public"];
const sitemapRoute = readFileSync("src/routes/sitemap[.]xml.ts", "utf8");
const robotsRoute = readFileSync("src/routes/robots[.]txt.ts", "utf8");
const feedRoute = readFileSync("src/routes/feed.ts", "utf8");
const brandAliasRoute = readFileSync("src/routes/brand/tempo-pelotas-header.ts", "utf8");
const accountRoute = readFileSync("src/routes/conta.tsx", "utf8");

function listProjectFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listProjectFiles(target));
    if (entry.isFile()) files.push(target);
  }

  return files;
}

test("o domínio canônico é único e não depende de ambiente", () => {
  assert.equal(CANONICAL_SITE_URL, "https://tempopelotas.com.br");
  assert.equal(SITE_URL, CANONICAL_SITE_URL);
  assert.equal(absoluteUrl("/alertas"), "https://tempopelotas.com.br/alertas");
});

test("a imagem social é raster, 1200x630 e separada do logotipo institucional", () => {
  const socialImage = readFileSync("public/brand/tempo-pelotas-social.png");

  assert.equal(SOCIAL_IMAGE_URL, absoluteUrl("/brand/tempo-pelotas-social.png"));
  assert.equal(BRAND_LOGO_URL, absoluteUrl("/brand/tempo-pelotas-primary.svg"));
  assert.notEqual(SOCIAL_IMAGE_URL, BRAND_LOGO_URL);
  assert.equal(socialImage.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(socialImage.readUInt32BE(16), 1200);
  assert.equal(socialImage.readUInt32BE(20), 630);
});

test("hosts técnicos redirecionam permanentemente preservando caminho e consulta", () => {
  for (const technicalHost of technicalHosts) {
    assert.equal(
      getCanonicalRedirectUrl(`https://${technicalHost}/chuva-em-pelotas?origem=busca`),
      "https://tempopelotas.com.br/chuva-em-pelotas?origem=busca",
    );
  }
});

test("o host técnico Lovable do projeto instrui remoção do índice e aponta o canônico", () => {
  const response = createCanonicalRedirectResponse(
    new Request(`https://${technicalHosts[0]}/meteograma-pelotas?origem=google`),
  );

  assert.ok(response);
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://tempopelotas.com.br/meteograma-pelotas?origem=google",
  );
  assert.equal(
    response.headers.get("x-robots-tag"),
    "noindex, nofollow, noarchive, nosnippet, noimageindex",
  );
  assert.equal(
    response.headers.get("link"),
    '<https://tempopelotas.com.br/meteograma-pelotas?origem=google>; rel="canonical"',
  );
});

test("www e http convergem para o domínio oficial em HTTPS", () => {
  assert.equal(
    getCanonicalRedirectUrl(`https://${wwwHost}/alertas`),
    "https://tempopelotas.com.br/alertas",
  );
  assert.equal(
    getCanonicalRedirectUrl("http://tempopelotas.com.br/"),
    "https://tempopelotas.com.br/",
  );
});

test("o domínio oficial e hosts locais não sofrem redirecionamento", () => {
  assert.equal(getCanonicalRedirectUrl("https://tempopelotas.com.br/vento-em-pelotas"), null);
  assert.equal(getCanonicalRedirectUrl("http://localhost:5173/"), null);
});

test("o sitemap contém Home, Central Regional e todas as páginas municipais canônicas", () => {
  const sitemap = createSitemapXml();
  const regionalPaths = REGIONAL_CITIES.filter((city) => city.slug !== "pelotas-rs").map(
    regionalCityPath,
  );

  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, PUBLIC_ROUTES.length);
  assert.match(sitemap, /<loc>https:\/\/tempopelotas\.com\.br\/<\/loc>/);
  assert.match(
    sitemap,
    /<loc>https:\/\/tempopelotas\.com\.br\/tempo-na-regiao-sul-rs<\/loc>/,
  );
  assert.equal(regionalPaths.length, 23);

  for (const forbiddenHost of forbiddenHostFragments) {
    assert.equal(sitemap.includes(forbiddenHost), false);
  }

  for (const route of PUBLIC_ROUTES) {
    assert.equal(sitemap.includes(`<loc>${absoluteUrl(route.path)}</loc>`), true);
  }
  for (const regionalPath of regionalPaths) {
    assert.equal(sitemap.includes(`<loc>${absoluteUrl(regionalPath)}</loc>`), true);
  }
});

test("robots aponta o sitemap e reduz crawling de superfícies operacionais", () => {
  assert.match(robotsRoute, /User-agent: \*/);
  assert.match(robotsRoute, /Allow: \/$/m);
  assert.match(robotsRoute, /Disallow: \/api\//);
  assert.match(robotsRoute, /Disallow: \/_server\//);
  assert.match(robotsRoute, /Disallow: \/auth\//);
  assert.match(robotsRoute, /Disallow: \/conta/);
  assert.match(robotsRoute, /Disallow: \/entrar/);
  assert.match(robotsRoute, /Disallow: \/painel/);
  assert.match(robotsRoute, /Disallow: \/embed\//);
  assert.match(robotsRoute, /Sitemap:/);
});

test("recursos técnicos permanecem acessíveis sem virar páginas de busca", () => {
  assert.match(feedRoute, /"X-Robots-Tag": "noindex, nofollow"/);
  assert.match(brandAliasRoute, /"X-Robots-Tag": "noindex, nofollow"/);
  assert.match(brandAliasRoute, /Location: "\/brand\/tempo-pelotas-header\.svg"/);
  assert.match(accountRoute, /src="\/brand\/tempo-pelotas-header\.svg"/);
  assert.doesNotMatch(accountRoute, /src="\/brand\/tempo-pelotas-header"(?!\.svg)/);
  assert.doesNotMatch(sitemapRoute, /"X-Robots-Tag": "index, follow"/);
  assert.match(sitemapRoute, /"X-Content-Type-Options": "nosniff"/);
});

test("superfícies públicas não publicam domínios técnicos/obsoletos", () => {
  const offenders: string[] = [];
  const files = publicSurfaceRoots.flatMap((root) => listProjectFiles(root));

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf8");
      if (forbiddenHostFragments.some((host) => content.includes(host))) offenders.push(file);
    } catch {
      // Arquivos binários não participam da verificação textual.
    }
  }

  assert.deepEqual(offenders, []);
});
