"use client";

import { useState } from "react";

// Outbound demo: enter a lead's info -> the agent calls that number immediately.
export default function OutboundDemo() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call() {
    setBusy(true); setStatus(null);
    try {
      const r = await fetch("/api/outbound", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: phone, name }) });
      const d = await r.json();
      setStatus(d.ok ? `📞 Calling ${phone} now — pick up!` : `Error: ${d.error}`);
    } catch (e) { setStatus("Error: " + (e as Error).message); }
    setBusy(false);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0e1420", color: "#fff", fontFamily: "-apple-system,sans-serif", padding: 24 }}>
      <div style={{ width: 420, maxWidth: "92vw", background: "#141b2a", border: "1px solid #24304a", borderRadius: 16, padding: 28 }}>
        <div style={{ fontWeight: 800, letterSpacing: ".5px" }}>VANTAGE · NEW LEAD</div>
        <h1 style={{ fontSize: 24, margin: "10px 0 6px" }}>Instant lead callback</h1>
        <p style={{ opacity: 0.75, fontSize: 14, marginBottom: 20 }}>A new lead just came in. Enter their number and the agent calls them <b>right now</b> to qualify and book.</p>
        <input placeholder="Lead name" value={name} onChange={(e) => setName(e.target.value)} style={inp} />
        <input placeholder="+1 555 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} style={inp} />
        <button onClick={call} disabled={busy || !phone} style={{ ...btn, opacity: busy || !phone ? 0.5 : 1 }}>{busy ? "Calling…" : "📞 Call this lead now"}</button>
        {status && <div style={{ marginTop: 16, fontSize: 14, textAlign: "center", color: "#9ff0b5" }}>{status}</div>}
      </div>
    </main>
  );
}

const inp: React.CSSProperties = { width: "100%", padding: 13, marginBottom: 12, borderRadius: 10, border: "1px solid #2a3550", background: "#0e1420", color: "#fff", fontSize: 15 };
const btn: React.CSSProperties = { width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#c8102e", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" };
