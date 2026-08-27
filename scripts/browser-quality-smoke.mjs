/* global process */
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.CANDIDATE_URL ?? "http://127.0.0.1:4173";
const outputDir = path.resolve(process.env.QUALITY_OUTPUT_DIR ?? "artifacts/browser-quality");
const strictPerformance = process.env.QUALITY_PERF_STRICT === "true";
const routes = [
  ["inicio", "/"],
  ["tempo-hoje", "/tempo-hoje-pelotas"],
  ["previsao-15-dias", "/previsao-15-dias-pelotas"],
  ["radar-satelite", "/radar-e-satelite-pelotas"],
  ["nivel-laranjal", "/nivel-da-lagoa-dos-patos-laranjal"],
  ["nivel-guaiba", "/nivel-do-guaiba"],
  ["regiao-sul", "/tempo-na-regiao-sul-rs"],
  ["status-dados", "/status-dos-dados"],
  ["privacidade", "/privacidade-e-dados"],
];
const viewports = [
  ["mobile-320", 320, 720, true],
  ["tablet-768", 768, 1024, false],
  ["desktop-1280", 1280, 900, false],
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "chromium-browser",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes("/")) {
      if (spawnSync(candidate, ["--version"], { stdio: "ignore" }).status === 0) return candidate;
      continue;
    }
    const probe = spawnSync("which", [candidate], { encoding: "utf8" });
    if (probe.status === 0 && probe.stdout.trim()) return probe.stdout.trim();
  }
  throw new Error("Chrome/Chromium não encontrado. Defina CHROME_PATH.");
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result ?? {});
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params }));
    return result;
  }
  close() {
    this.ws.close();
  }
}

async function waitForJson(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
    await sleep(100);
  }
  throw new Error("Chrome DevTools não respondeu dentro do limite.");
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Falha no navegador");
  return result.result?.value;
}

async function waitForDocument(cdp, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const state = await evaluate(cdp, "document.readyState");
      if (state === "interactive" || state === "complete") return;
    } catch {}
    await sleep(100);
  }
  throw new Error("Documento não ficou interativo dentro do limite.");
}

const vitalsObserver = `(() => {
  globalThis.__tpVitals = { lcp: 0, cls: 0 };
  try { new PerformanceObserver((list) => { const entries = list.getEntries(); const last = entries.at(-1); if (last) globalThis.__tpVitals.lcp = last.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); } catch {}
  try { new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) globalThis.__tpVitals.cls += entry.value; }).observe({ type: "layout-shift", buffered: true }); } catch {}
})();`;

const pageAudit = `(() => {
  const text = (value) => String(value ?? "").replace(/\\s+/g, " ").trim();
  const visible = (el) => {
    if (!(el instanceof HTMLElement) || el.hidden || el.getAttribute("aria-hidden") === "true") return false;
    const style = getComputedStyle(el); const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };
  const labelledBy = (el) => (el.getAttribute("aria-labelledby") ?? "").split(/\\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
  const fieldLabel = (el) => el.id ? Array.from(document.querySelectorAll("label")).find((label) => label.htmlFor === el.id)?.textContent ?? el.closest("label")?.textContent ?? "" : el.closest("label")?.textContent ?? "";
  const name = (el) => text(el.getAttribute("aria-label") || labelledBy(el) || fieldLabel(el) || ((el instanceof HTMLInputElement && ["button","submit","reset"].includes(el.type)) ? el.value : "") || el.textContent || el.getAttribute("title") || (el instanceof HTMLImageElement ? el.alt : "") || el.querySelector?.("img[alt]")?.getAttribute("alt"));
  const describe = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (text(el.textContent) ? " [" + text(el.textContent).slice(0, 50) + "]" : "");
  const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id).filter(Boolean);
  const idCounts = ids.reduce((map, id) => (map.set(id, (map.get(id) ?? 0) + 1), map), new Map());
  const interactives = Array.from(document.querySelectorAll('a[href],button,input:not([type="hidden"]),select,textarea,[role="button"],[role="link"]')).filter(visible);
  const fields = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]),select,textarea')).filter(visible);
  const skip = document.querySelector('.skip-link[href="#conteudo-principal"]');
  let skipVisible = false;
  if (skip instanceof HTMLElement) { skip.focus(); const rect = skip.getBoundingClientRect(); const style = getComputedStyle(skip); skipVisible = document.activeElement === skip && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 && rect.left < innerWidth && rect.top < innerHeight; }
  const nav = performance.getEntriesByType("navigation")[0]; const fcp = performance.getEntriesByName("first-contentful-paint")[0];
  return {
    language: document.documentElement.lang, title: document.title,
    h1Count: Array.from(document.querySelectorAll("h1")).filter(visible).length,
    mainCount: document.querySelectorAll("main").length, skipVisible,
    duplicateIds: Array.from(idCounts.entries()).filter(([, count]) => count > 1).map(([id, count]) => id + " (" + count + ")"),
    unnamedInteractive: interactives.filter((el) => !name(el)).map(describe),
    unlabelledFields: fields.filter((el) => !name(el)).map(describe),
    imagesWithoutAlt: Array.from(document.images).filter((img) => !img.hasAttribute("alt")).map(describe),
    horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    vitals: { ttfb: nav ? Math.max(0, nav.responseStart - nav.requestStart) : null, fcp: fcp?.startTime ?? null, lcp: globalThis.__tpVitals?.lcp || null, cls: globalThis.__tpVitals?.cls ?? null }
  };
})();`;

async function headerInteraction(cdp, width) {
  const mobile = width <= 1040;
  const control = mobile ? "tp-mobile-menu" : "tp-mega-forecast";
  const setup = await evaluate(cdp, `(() => { const button = document.querySelector('[aria-controls="${control}"]'); const panel = document.getElementById("${control}"); if (!(button instanceof HTMLElement) || !(panel instanceof HTMLElement)) return null; button.click(); const link = panel.querySelector("a"); if (link instanceof HTMLElement) link.focus(); return { open: button.getAttribute("aria-expanded") === "true", visible: !panel.hidden }; })()`);
  if (!setup) return [];
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(100);
  const after = await evaluate(cdp, `(() => { const button = document.querySelector('[aria-controls="${control}"]'); const panel = document.getElementById("${control}"); return { closed: button?.getAttribute("aria-expanded") === "false" && Boolean(panel?.hidden), focusReturned: document.activeElement === button }; })()`);
  const failures = [];
  if (!setup.open || !setup.visible) failures.push(`${mobile ? "menu móvel" : "megamenu"} não abriu com estado ARIA coerente`);
  if (!after.closed) failures.push("Escape não fechou o painel de navegação");
  if (!after.focusReturned) failures.push("Escape não devolveu foco ao controle que abriu o painel");
  return failures;
}

function classify(audit, interactionFailures) {
  const failures = [...interactionFailures]; const warnings = [];
  if (!String(audit.language ?? "").toLowerCase().startsWith("pt")) failures.push("documento sem lang em português");
  if (!audit.title) failures.push("documento sem title");
  if (audit.h1Count !== 1) failures.push(`quantidade de H1 visíveis: ${audit.h1Count}`);
  if (audit.mainCount !== 1) failures.push(`quantidade de landmarks main: ${audit.mainCount}`);
  if (!audit.skipVisible) failures.push("skip link não fica visível ao receber foco");
  if (audit.duplicateIds.length) failures.push(`IDs duplicados: ${audit.duplicateIds.join(", ")}`);
  if (audit.unnamedInteractive.length) failures.push(`controles sem nome: ${audit.unnamedInteractive.join(", ")}`);
  if (audit.unlabelledFields.length) failures.push(`campos sem rótulo: ${audit.unlabelledFields.join(", ")}`);
  if (audit.imagesWithoutAlt.length) failures.push(`imagens sem alt: ${audit.imagesWithoutAlt.join(", ")}`);
  if (audit.horizontalOverflow > 2) failures.push(`overflow horizontal: ${audit.horizontalOverflow}px`);
  const { lcp, cls, ttfb } = audit.vitals;
  if (typeof lcp === "number" && lcp > 2500) warnings.push(`LCP lab >2,5s: ${Math.round(lcp)}ms`);
  if (typeof cls === "number" && cls > 0.1) warnings.push(`CLS lab >0,1: ${cls.toFixed(3)}`);
  if (typeof ttfb === "number" && ttfb > 800) warnings.push(`TTFB lab >800ms: ${Math.round(ttfb)}ms`);
  if (strictPerformance && typeof lcp === "number" && lcp > 4000) failures.push(`LCP lab pobre (>4s): ${Math.round(lcp)}ms`);
  if (strictPerformance && typeof cls === "number" && cls > 0.25) failures.push(`CLS lab pobre (>0,25): ${cls.toFixed(3)}`);
  return { failures, warnings };
}

function report(results) {
  const lines = ["# Browser Quality Smoke", "", `- Candidato: ${baseUrl}`, `- Performance estrita: ${strictPerformance ? "sim" : "não"}`, "", "| Página | Viewport | H1 | Main | Overflow | LCP | CLS | TTFB | Estado |", "|---|---|---:|---:|---:|---:|---:|---:|---|"];
  for (const item of results) { const v = item.audit.vitals ?? {}; lines.push(`| ${item.route} | ${item.viewport} | ${item.audit.h1Count ?? "—"} | ${item.audit.mainCount ?? "—"} | ${item.audit.horizontalOverflow ?? "—"}px | ${v.lcp == null ? "—" : Math.round(v.lcp) + "ms"} | ${v.cls == null ? "—" : Number(v.cls).toFixed(3)} | ${v.ttfb == null ? "—" : Math.round(v.ttfb) + "ms"} | ${item.failures.length ? "falhou" : "ok"} |`); }
  const warnings = results.flatMap((item) => item.warnings.map((value) => `- ${item.route} ${item.viewport}: ${value}`));
  const failures = results.flatMap((item) => item.failures.map((value) => `- ${item.route} ${item.viewport}: ${value}`));
  if (warnings.length) lines.push("", "## Avisos de performance", "", ...warnings);
  if (failures.length) lines.push("", "## Falhas bloqueantes", "", ...failures);
  return lines.join("\n") + "\n";
}

await mkdir(outputDir, { recursive: true });
const chromePath = findChrome(); const port = Number(process.env.CDP_PORT ?? 9222);
const profile = await mkdtemp(path.join(os.tmpdir(), "tempo-pelotas-quality-"));
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
let cdp; const results = [];
try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const targetResponse = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!targetResponse.ok) throw new Error(`Falha ao criar aba CDP: HTTP ${targetResponse.status}`);
  const target = await targetResponse.json(); cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable"); await cdp.send("Runtime.enable");
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: vitalsObserver });
  for (const [viewport, width, height, mobile] of viewports) {
    await cdp.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
    for (const [route, routePath] of routes) {
      try {
        const navigation = await cdp.send("Page.navigate", { url: new URL(routePath, baseUrl).toString() });
        if (navigation.errorText) throw new Error(navigation.errorText);
        await waitForDocument(cdp); await sleep(1200);
        const audit = await evaluate(cdp, pageAudit);
        const interactionFailures = routePath === "/" ? await headerInteraction(cdp, width) : [];
        const { failures, warnings } = classify(audit, interactionFailures);
        results.push({ route, path: routePath, viewport, audit, failures, warnings });
        console.log(`${route} ${viewport}: h1=${audit.h1Count} main=${audit.mainCount} overflow=${audit.horizontalOverflow}px lcp=${audit.vitals.lcp == null ? "n/a" : Math.round(audit.vitals.lcp)} cls=${audit.vitals.cls ?? "n/a"} failures=${failures.length}`);
      } catch (error) {
        results.push({ route, path: routePath, viewport, audit: { vitals: {} }, failures: [`auditoria interrompida: ${error instanceof Error ? error.message : String(error)}`], warnings: [] });
      }
    }
  }
} finally {
  cdp?.close(); chrome.kill("SIGTERM");
  await Promise.race([new Promise((resolve) => chrome.once("exit", resolve)), sleep(1500)]).catch(() => undefined);
  await rm(profile, { recursive: true, force: true }).catch(() => undefined);
}
await writeFile(path.join(outputDir, "report.json"), JSON.stringify({ baseUrl, strictPerformance, generatedAt: new Date().toISOString(), results }, null, 2) + "\n");
await writeFile(path.join(outputDir, "README.md"), report(results));
const failures = results.flatMap((item) => item.failures.map((value) => `${item.route} ${item.viewport}: ${value}`));
if (failures.length) throw new Error(`Browser quality smoke encontrou ${failures.length} falha(s).\n- ${failures.join("\n- ")}`);
console.log(`Browser quality smoke concluído: ${results.length} verificações.`);
