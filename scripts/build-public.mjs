import { build } from "vite";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prerenderScript = path.join(projectRoot, "scripts", "prerender-public.mjs");
const prerenderEnvironment = { ...process.env };

await build({ mode: "public", build: { outDir: "dist-public" } });

await new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [prerenderScript, "dist-public"], {
    cwd: projectRoot,
    env: prerenderEnvironment,
    stdio: "inherit",
  });
  child.once("error", reject);
  child.once("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`Public prerender exited with status ${code ?? "unknown"}`));
  });
});
