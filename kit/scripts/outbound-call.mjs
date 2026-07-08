// Trigger an outbound call: the agent calls a lead and connects them.
// Usage: node kit/scripts/outbound-call.mjs +15551234567
// Requires BRIDGE_URL env (your deployed bridge, e.g. https://your-bridge.up.railway.app).
const to = process.argv[2];
const BRIDGE = process.env.BRIDGE_URL;
if (!to || !BRIDGE) { console.error('Usage: BRIDGE_URL=https://... node outbound-call.mjs +15551234567'); process.exit(1); }

const r = await fetch(`${BRIDGE.replace(/\/$/, "")}/outbound`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to }),
});
const data = await r.json();
console.log(data.ok ? `✅ Calling ${to} — callSid ${data.callSid}` : `❌ ${data.error}`);
