// Distributes the root firm.config.json and the shared agent builder into the
// web and bridge subprojects so each service is self-contained for deploy.
// Run this after editing firm.config.json.
import { copyFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const cfg = join(root, "firm.config.json");
const builder = join(root, "kit", "lib", "agent-instructions.mjs");

const targets = [
  { dir: join(root, "kit", "web"), cfgName: "firm.config.json", builderDir: join(root, "kit", "web", "lib") },
  { dir: join(root, "kit", "bridge"), cfgName: "firm.config.json", builderDir: join(root, "kit", "bridge") },
];

for (const t of targets) {
  mkdirSync(t.builderDir, { recursive: true });
  copyFileSync(cfg, join(t.dir, t.cfgName));
  copyFileSync(builder, join(t.builderDir, "agent-instructions.mjs"));
  console.log("applied config ->", t.dir.replace(root, "."));
}
console.log("Done. Redeploy web + bridge for changes to take effect.");
