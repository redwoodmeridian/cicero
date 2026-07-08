const NAVY = "#0e1420";
const RED = "#c8102e";
const PHONE = "(814) 747-6198";
const PHONE_HREF = "tel:+18147476198";

export default function Home() {
  return (
    <main>
      {/* Top bar */}
      <header style={{ background: NAVY, color: "#fff", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, letterSpacing: ".5px", fontSize: 18 }}>
          VANTAGE<span style={{ color: RED }}>·</span>INJURY LAW
        </div>
        <a href={PHONE_HREF} style={{ background: RED, color: "#fff", padding: "9px 18px", borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
          Call {PHONE}
        </a>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #16233a 100%)`, color: "#fff", padding: "72px 24px 84px", textAlign: "center" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: "rgba(200,16,46,.16)", color: "#ff8a9c", border: "1px solid rgba(200,16,46,.4)", padding: "6px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, marginBottom: 22 }}>
            Phoenix &amp; the Valley · No fee unless we win
          </div>
          <h1 style={{ fontSize: "clamp(34px, 6vw, 56px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-1px" }}>
            Hurt in an accident?<br /><span style={{ color: "#ff5a72" }}>You focus on healing.</span> We handle the fight.
          </h1>
          <p style={{ fontSize: 19, opacity: 0.85, maxWidth: 620, margin: "22px auto 34px", lineHeight: 1.55 }}>
            The insurance company already has a team working against you. Get yours. Find out in 90 seconds whether you have a case — talk to our intake team right now, no forms.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={PHONE_HREF} style={{ background: RED, color: "#fff", padding: "16px 30px", borderRadius: 10, fontWeight: 700, fontSize: 17 }}>📞 Call {PHONE}</a>
            <span style={{ alignSelf: "center", opacity: 0.7, fontSize: 15 }}>or tap <b>“Talk to us”</b> bottom-right to speak with us here →</span>
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section style={{ background: "#f6f7f9", padding: "40px 24px", display: "flex", gap: 40, justifyContent: "center", flexWrap: "wrap", textAlign: "center" }}>
        {[["$100M+", "Recovered for clients"], ["24/7", "We answer, day or night"], ["$0", "Upfront — you pay if we win"], ["4.9★", "From 600+ reviews"]].map(([a, b]) => (
          <div key={b}>
            <div style={{ fontSize: 34, fontWeight: 800, color: NAVY }}>{a}</div>
            <div style={{ fontSize: 14, color: "#5a6472" }}>{b}</div>
          </div>
        ))}
      </section>

      {/* Practice areas */}
      <section style={{ padding: "64px 24px", maxWidth: 1040, margin: "0 auto" }}>
        <h2 style={{ fontSize: 30, fontWeight: 800, textAlign: "center", color: NAVY, marginBottom: 8 }}>We handle serious injury cases</h2>
        <p style={{ textAlign: "center", color: "#5a6472", marginBottom: 40 }}>If someone else caused your injury, we&rsquo;ll go after every dollar you&rsquo;re owed.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          {[
            ["🚗", "Car & Truck Accidents", "Wrecks, rear-ends, distracted and drunk drivers, hit-and-run."],
            ["🏍️", "Motorcycle & Rideshare", "Bikers and Uber/Lyft passengers hurt through no fault of their own."],
            ["🚶", "Pedestrian & Bicycle", "Crosswalk and roadway collisions with life-changing injuries."],
            ["⚠️", "Slip & Fall", "Unsafe properties, wet floors, negligent owners."],
            ["🐕", "Dog Bites", "Serious bites and attacks under Arizona&rsquo;s owner-liability law."],
            ["🕊️", "Wrongful Death", "Compassionate, determined representation for grieving families."],
          ].map(([icon, title, body]) => (
            <div key={title} style={{ border: "1px solid #e6e9ee", borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 26 }}>{icon}</div>
              <div style={{ fontWeight: 700, color: NAVY, margin: "8px 0 6px", fontSize: 17 }}>{title}</div>
              <div style={{ color: "#5a6472", fontSize: 14.5 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: NAVY, color: "#fff", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, textAlign: "center", marginBottom: 40 }}>Getting help is simple</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 26 }}>
            {[
              ["1", "Tell us what happened", "Talk to our team by phone or right here on the site. Two minutes, no forms."],
              ["2", "We review your case free", "We tell you honestly if you have a claim and what it could be worth."],
              ["3", "We fight — you heal", "We take on the insurers. You pay nothing unless we win."],
            ].map(([n, t, b]) => (
              <div key={n}>
                <div style={{ width: 40, height: 40, borderRadius: 999, background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, marginBottom: 12 }}>{n}</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{t}</div>
                <div style={{ opacity: 0.8, fontSize: 15 }}>{b}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 44 }}>
            <a href={PHONE_HREF} style={{ background: RED, color: "#fff", padding: "16px 32px", borderRadius: 10, fontWeight: 700, fontSize: 17, display: "inline-block" }}>Get your free case review →</a>
          </div>
        </div>
      </section>

      <footer style={{ background: "#0a0f18", color: "#8a94a6", padding: "30px 24px", textAlign: "center", fontSize: 13 }}>
        <div style={{ fontWeight: 800, color: "#fff", fontSize: 16, marginBottom: 6 }}>VANTAGE·INJURY LAW</div>
        <div>Serving Phoenix &amp; the Valley · {PHONE} · Free case review, no fee unless we win</div>
        <div style={{ marginTop: 10, opacity: 0.6 }}>Fictional firm for demonstration purposes. Attorney advertising.</div>
      </footer>
    </main>
  );
}
