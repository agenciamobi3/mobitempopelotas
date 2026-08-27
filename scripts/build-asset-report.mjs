import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const outputDir = path.resolve(process.env.ASSET_REPORT_OUTPUT_DIR ?? "artifacts/build-assets");
const explicitPublicDir = process.env.BUILD_PUBLIC_DIR?.trim();
const candidateDirectories = [
  explicitPublicDir,
  ".output/public",
  "dist/client",
  "dist",
  "build/client",
  "build",
].filter(Boolean);

function findBuildDirectory() {
  for (const candidate of candidateDirectories) {
    const resolved = path.resolve(candidate);
    if (existsSync(resolved)) return resolved;
  }
  throw new Error(
    `Diretório público do build não encontrado. Verificados: ${candidateDirectories.join(", ")}.`,
  );
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function categoryFor(relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  if ([".js", ".mjs", ".cjs"].includes(extension)) return "javascript";
  if (extension === ".css") return "css";
  if ([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg", ".ico"].includes(extension)) {
    return "images";
  }
  if ([".woff", ".woff2", ".ttf", ".otf"].includes(extension)) return "fonts";
  if (extension === ".map") return "source-maps";
  return "other";
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}

const buildDir = findBuildDirectory();
const allFiles = await walk(buildDir);
const rows = [];

for (const absolute of allFiles) {
  const relativePath = path.relative(buildDir, absolute).replaceAll(path.sep, "/");
  const fileStat = await stat(absolute);
  const category = categoryFor(relativePath);
  let gzipBytes = null;

  if (category === "javascript" || category === "css") {
    const content = await readFile(absolute);
    gzipBytes = gzipSync(content, { level: 9 }).byteLength;
  }

  rows.push({
    path: relativePath,
    category,
    bytes: fileStat.size,
    gzipBytes,
  });
}

rows.sort((a, b) => b.bytes - a.bytes);
const categories = new Map();
for (const row of rows) {
  const current = categories.get(row.category) ?? { files: 0, bytes: 0, gzipBytes: 0 };
  current.files += 1;
  current.bytes += row.bytes;
  if (typeof row.gzipBytes === "number") current.gzipBytes += row.gzipBytes;
  categories.set(row.category, current);
}

const summary = Object.fromEntries([...categories.entries()].sort(([a], [b]) => a.localeCompare(b)));
const totalBytes = rows.reduce((sum, row) => sum + row.bytes, 0);
const jsCssGzipBytes = rows.reduce(
  (sum, row) => sum + (typeof row.gzipBytes === "number" ? row.gzipBytes : 0),
  0,
);

const payload = {
  generatedAt: new Date().toISOString(),
  buildDirectory: path.relative(process.cwd(), buildDir) || ".",
  totalFiles: rows.length,
  totalBytes,
  jsCssGzipBytes,
  summary,
  largestFiles: rows.slice(0, 30),
};

const markdown = [
  "# Relatório de peso do build",
  "",
  `- Diretório: \`${payload.buildDirectory}\``,
  `- Arquivos: ${payload.totalFiles}`,
  `- Tamanho bruto total: ${formatBytes(totalBytes)}`,
  `- JS + CSS compactados com gzip (soma dos arquivos): ${formatBytes(jsCssGzipBytes)}`,
  "",
  "## Por categoria",
  "",
  "| Categoria | Arquivos | Bruto | Gzip JS/CSS |",
  "|---|---:|---:|---:|",
  ...Object.entries(summary).map(
    ([category, value]) =>
      `| ${category} | ${value.files} | ${formatBytes(value.bytes)} | ${value.gzipBytes ? formatBytes(value.gzipBytes) : "—"} |`,
  ),
  "",
  "## Maiores arquivos",
  "",
  "| Arquivo | Categoria | Bruto | Gzip |",
  "|---|---|---:|---:|",
  ...payload.largestFiles.map(
    (row) =>
      `| \`${row.path}\` | ${row.category} | ${formatBytes(row.bytes)} | ${row.gzipBytes == null ? "—" : formatBytes(row.gzipBytes)} |`,
  ),
  "",
  "> Este relatório mede arquivos gerados pelo build. Ele não equivale a bytes transferidos em uma navegação real, porque cache, preload, code splitting e recursos externos mudam o custo por rota.",
  "",
].join("\n");

await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
await writeFile(path.join(outputDir, "README.md"), markdown, "utf8");

console.log(
  `Build assets: ${payload.totalFiles} arquivos, ${formatBytes(totalBytes)} bruto, ${formatBytes(jsCssGzipBytes)} de JS+CSS gzip.`,
);
