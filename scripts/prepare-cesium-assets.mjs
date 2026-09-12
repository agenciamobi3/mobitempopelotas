import { cp, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cesiumPackageRoot = dirname(require.resolve("cesium/package.json"));
const cesiumBuildRoot = join(cesiumPackageRoot, "Build", "Cesium");
const publicTarget = join(repositoryRoot, "public", "cesium");
const directories = ["Assets", "ThirdParty", "Widgets", "Workers"];

await rm(publicTarget, { recursive: true, force: true });
await mkdir(publicTarget, { recursive: true });

for (const directory of directories) {
  await cp(join(cesiumBuildRoot, directory), join(publicTarget, directory), {
    recursive: true,
    force: true,
  });
}

console.log(
  `[cesium] Assets preparados em ${publicTarget}: ${directories.join(", ")}.`,
);
