/* global process, WebSocket */
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const baseUrl = process.env.CANDIDATE_URL ?? "http://127.0.0.1:4173";
const shellRecoveryWaitMs = Number(process.env.STABILITY_RECOVERY_WAIT_MS ?? 7_000);
const ordinaryWaitMs = Number(process.env.STABILITY_PAGE_WAIT_MS ?? 1_500);

const routes = [
  {
    name: "home",
    path: "/",
    waitMs: shellRecoveryWaitMs,
    transientTexts: ["Atualizando dados meteorológicos..."],
  },
  {
    name: "hoje",
    path: "/tempo-hoje-pelotas",
    waitMs: shellRecoveryWaitMs,
    transientTexts: ["A previsão de hoje está em atualização"],
  },
  {
    name: "amanha",
    path: "/tempo-amanha-pelotas",
    waitMs: shellRecoveryWaitMs,
    transientTexts: ["A previsão de amanhã está em atualização"],
  },
  {
    name: "sete-dias",
    path: "/previsao-7-dias-pelotas",
    waitMs: shellRecoveryWaitMs,
    transientTexts: ["previsão de 7 dias está em atualização", "previsão para 7 dias está em atualização"],
  },
  {
    name: "chuva",
    path: "/chuva-em-pelotas",
    waitMs: shellRecoveryWaitMs,
    transientTexts: [],
  },
  {
    name: "vento",
    path: "/vento-em-pelotas",
    waitMs: shellRecoveryWaitMs,
    transientTexts: [],
  },
  {
    name: "meteograma",
    path: "/meteograma-pelotas",
    waitMs: shellRecoveryWaitMs,
    transientTexts: [],
  },
  {
    name: "aguas",
    path: "/situacao-hidrologica-pelotas",
    waitMs: ordinaryWaitMs,
    transientTexts: [],
  },
  {
    name: "radar-satelite",
    path: "/radar-e-satelite-pelotas",
    waitMs: ordinaryWaitMs,
    transientTexts: [],
    forbiddenTexts: [
      "Diagnóstico atual",
      "hostsCandidatos",
      "imagensAceitas",
      "chavesData",
      "chavesRadar",
      "chavesVento",
    ],
  },
  {
    name: "alertas",
    path: "/alertas",
    waitMs: shellRecoveryWaitMs,
    transientTexts: [],
  },
];

const GLOBAL_FORBIDDEN_TEXTS = ["Carregando a versão mais recente do Tempo Pelotas"];
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

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "Falha no navegador");
  return result.result?.value;
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

async function waitForDocument(cdp, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const readyState = await evaluate(cdp, "document.readyState");
      if (readyState === "interactive" || readyState === "complete") return;
    } catch {}
    await sleep(100);
  }
  throw new Error("Documento não ficou interativo dentro do limite.");
}

function normalized(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

async function inspectPage(cdp, route) {
  const snapshot = await evaluate(
    cdp,
    `(() => ({
      title: document.title,
      h1: document.querySelector("h1")?.textContent ?? "",
      body: document.body?.innerText ?? "",
      radarLink: (() => {
        const link = Array.from(document.querySelectorAll('a[href="/radar-e-satelite-pelotas"]'))
          .find((item) => /Satélites e Radares/i.test(item.textContent ?? ""));
        return link ? {
          found: true,
          ariaControls: link.getAttribute("aria-controls"),
          tag: link.tagName,
        } : { found: false, ariaControls: null, tag: null };
      })(),
    }))()`,
  );

  const body = normalized(snapshot.body);
  const failures = [];

  if (!snapshot.title) failures.push("documento sem title");
  if (!normalized(snapshot.h1)) failures.push("documento sem H1");

  for (const text of GLOBAL_FORBIDDEN_TEXTS) {
    if (body.includes(text)) failures.push(`boundary global exposto: ${text}`);
  }

  for (const text of route.transientTexts ?? []) {
    if (body.toLowerCase().includes(text.toLowerCase())) {
      failures.push(`estado transitório permaneceu após ${route.waitMs} ms: ${text}`);
    }
  }

  for (const text of route.forbiddenTexts ?? []) {
    if (body.toLowerCase().includes(text.toLowerCase())) {
      failures.push(`diagnóstico interno exposto: ${text}`);
    }
  }

  if (route.path === "/") {
    if (!snapshot.radarLink?.found) failures.push("link direto Satélites e Radares não encontrado");
    if (snapshot.radarLink?.ariaControls) {
      failures.push("Satélites e Radares voltou a controlar megamenu em vez de ser link direto");
    }
  }

  return {
    route: route.name,
    path: route.path,
    title: snapshot.title,
    h1: normalized(snapshot.h1),
    failures,
  };
}

const chromePath = findChrome();
const port = Number(process.env.CDP_PORT ?? 9231);
const profile = await mkdtemp(path.join(os.tmpdir(), "tempo-pelotas-stability-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);

let cdp;
const results = [];

try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const targetResponse = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  if (!targetResponse.ok) throw new Error(`Falha ao criar aba CDP: HTTP ${targetResponse.status}`);
  const target = await targetResponse.json();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (const route of routes) {
    try {
      const navigation = await cdp.send("Page.navigate", {
        url: new URL(route.path, baseUrl).toString(),
      });
      if (navigation.errorText) throw new Error(navigation.errorText);
      await waitForDocument(cdp);
      await sleep(route.waitMs);
      const result = await inspectPage(cdp, route);
      results.push(result);
      console.log(`${route.name}: ${result.failures.length ? "FALHOU" : "OK"} — ${result.h1}`);
    } catch (error) {
      results.push({
        route: route.name,
        path: route.path,
        title: "",
        h1: "",
        failures: [`smoke interrompido: ${error instanceof Error ? error.message : String(error)}`],
      });
    }
  }
} finally {
  cdp?.close();
  chrome.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => chrome.once("exit", resolve)),
    sleep(1_500),
  ]).catch(() => undefined);
  await rm(profile, { recursive: true, force: true }).catch(() => undefined);
}

const failures = results.flatMap((item) =>
  item.failures.map((failure) => `${item.route} (${item.path}): ${failure}`),
);

if (failures.length) {
  throw new Error(`Smoke público encontrou ${failures.length} falha(s).\n- ${failures.join("\n- ")}`);
}

console.log(`Smoke público concluído: ${results.length} rotas estáveis em ${baseUrl}.`);
