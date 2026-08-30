import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const host = process.env.PREVIEW_HOST?.trim() || "127.0.0.1";
const port = process.env.PREVIEW_PORT?.trim() || "4173";

if (!existsSync(".output/nitro.json")) {
  console.error("[preview] Build Nitro não encontrado em .output. Execute npm run build primeiro.");
  process.exit(1);
}

const wranglerArgs = ["wrangler", "--cwd", "./", "dev", "--port", port, "--host", host];
const npxArgs = ["--yes", ...wranglerArgs];

let command;
let args;

if (process.platform === "win32") {
  command = process.env.ComSpec || "cmd.exe";
  args = ["/d", "/s", "/c", `npx ${npxArgs.join(" ")}`];
} else {
  command = "npx";
  args = npxArgs;
}

console.log(`[preview] Wrangler em http://${host}:${port}/`);

const child = spawn(command, args, {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("error", (error) => {
  console.error(`[preview] Falha ao iniciar Wrangler: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[preview] Wrangler encerrado por ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
