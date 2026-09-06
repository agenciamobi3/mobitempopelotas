import { existsSync } from "node:fs";
import { extname } from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE_ROOT = new URL("../src/", import.meta.url);
const MODULE_EXTENSIONS = [".ts", ".tsx", ".js", ".mjs", ".json"];

function resolveExistingModule(candidateUrl) {
  const candidatePath = fileURLToPath(candidateUrl);

  if (existsSync(candidatePath)) {
    return candidateUrl.href;
  }

  const extension = extname(candidatePath);
  if (MODULE_EXTENSIONS.includes(extension)) {
    return null;
  }

  for (const moduleExtension of MODULE_EXTENSIONS) {
    const filePath = `${candidatePath}${moduleExtension}`;
    if (existsSync(filePath)) {
      return pathToFileURL(filePath).href;
    }
  }

  for (const moduleExtension of MODULE_EXTENSIONS) {
    const indexPath = `${candidatePath}/index${moduleExtension}`;
    if (existsSync(indexPath)) {
      return pathToFileURL(indexPath).href;
    }
  }

  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const resolved = resolveExistingModule(new URL(specifier.slice(2), SOURCE_ROOT));
      if (resolved) {
        return { url: resolved, shortCircuit: true };
      }
    }

    if (
      context.parentURL?.startsWith("file:") &&
      (specifier.startsWith("./") || specifier.startsWith("../"))
    ) {
      const resolved = resolveExistingModule(new URL(specifier, context.parentURL));
      if (resolved) {
        return { url: resolved, shortCircuit: true };
      }
    }

    return nextResolve(specifier, context);
  },
});
