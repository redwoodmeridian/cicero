// Creates the xAI knowledge base (Collection) for the firm and uploads its intake knowledge.
// Requires: XAI_API_KEY, XAI_MANAGEMENT_KEY. Prints the collection id to set as XAI_COLLECTION_ID.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const API = process.env.XAI_API_KEY;
const MGMT = process.env.XAI_MANAGEMENT_KEY;
if (!API || !MGMT) { console.error("Set XAI_API_KEY and XAI_MANAGEMENT_KEY"); process.exit(1); }

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const firm = JSON.parse(readFileSync(join(root, "firm.config.json"), "utf8"));

// Build a knowledge document from firm.config (the firm can expand kb.md for more depth).
const kb = `# ${firm.name} — Intake Knowledge Base

## Firm
${firm.knowledge}
Serving ${firm.location}. ${firm.tagline}
Fees: ${firm.fee}

## We handle
${(firm.handles || []).map((h) => "- " + h).join("\n")}

## We do NOT handle
${(firm.doesNotHandle || []).map((h) => "- " + h).join("\n")}

## Qualifying
${(firm.qualifying || []).map((q, i) => `${i + 1}. ${q}`).join("\n")}

## Booking
${firm.booking?.label || "consultation"} — ${firm.booking?.hours || ""}, about ${firm.booking?.durationMin || 30} minutes.
`;

const slug = (firm.shortName || firm.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");

async function main() {
  const col = await (await fetch("https://api.x.ai/v1/collections", {
    method: "POST", headers: { Authorization: "Bearer " + API, "Content-Type": "application/json" },
    body: JSON.stringify({ collection_name: `${slug}-kb`, field_definitions: [] }),
  })).json();
  const cid = col.collection_id;
  console.log("collection:", cid);

  const tmp = join(root, "kit", "scripts", ".kb.md");
  writeFileSync(tmp, kb);
  const fd = new FormData();
  fd.append("file", new Blob([kb], { type: "text/markdown" }), "intake-kb.md");
  fd.append("purpose", "assistants");
  const file = await (await fetch("https://api.x.ai/v1/files", { method: "POST", headers: { Authorization: "Bearer " + API }, body: fd })).json();

  await fetch(`https://management-api.x.ai/v1/collections/${cid}/documents/${file.id}`, {
    method: "POST", headers: { Authorization: "Bearer " + MGMT },
  });

  console.log("\n✅ Knowledge base ready.");
  console.log("Set this on your web + bridge services:  XAI_COLLECTION_ID=" + cid);
}
main().catch((e) => { console.error(e); process.exit(1); });
