// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { execFileSync } from "node:child_process";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Some deployment platforms invoke Vite directly instead of the package.json build script.
// Generate the typed route tree while Vite loads its config.
execFileSync(process.execPath, ["scripts/generate-route-tree.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

export default defineConfig({
  tanstackStart: {
    enableRouteGeneration: false,

    // Country gate runs before importing the regular SSR server entry.
    server: { entry: "server-brazil" },
  },
});
