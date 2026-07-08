/*
 * Cicero voice widget — universal embed.
 * Drop this on ANY website (WordPress, Squarespace, Wix, raw HTML):
 *   <script src="https://YOUR-DEPLOY.up.railway.app/embed.js" defer></script>
 * Optional data attributes on the script tag:
 *   data-label="Talk to us"   data-color="#c8102e"   data-position="right"
 */
(function () {
  var s = document.currentScript;
  var origin = new URL(s.src).origin;
  var label = s.getAttribute("data-label") || "🎙 Talk to us — free";
  var color = s.getAttribute("data-color") || "#c8102e";
  var side = s.getAttribute("data-position") === "left" ? "left" : "right";

  var open = false, frame = null;

  var btn = document.createElement("button");
  btn.textContent = label;
  btn.setAttribute("aria-label", "Talk to us");
  css(btn, {
    position: "fixed", bottom: "22px", zIndex: 2147483000,
    background: color, color: "#fff", border: "none", borderRadius: "999px",
    padding: "14px 22px", fontSize: "15px", fontWeight: "700", cursor: "pointer",
    boxShadow: "0 12px 34px rgba(0,0,0,.35)", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"
  });
  btn.style[side] = "22px";

  function toggle() {
    open = !open;
    if (open) {
      if (!frame) {
        frame = document.createElement("iframe");
        frame.src = origin + "/widget?embed=1";
        frame.allow = "microphone; autoplay";
        css(frame, {
          position: "fixed", bottom: "84px", width: "360px", height: "560px",
          maxWidth: "92vw", maxHeight: "76vh", border: "none", borderRadius: "16px",
          zIndex: 2147483000, boxShadow: "0 26px 64px rgba(0,0,0,.5)", background: "#141414"
        });
        frame.style[side] = "22px";
        document.body.appendChild(frame);
      }
      frame.style.display = "block";
      btn.textContent = "Close";
    } else {
      if (frame) frame.style.display = "none";
      btn.textContent = label;
    }
  }
  btn.addEventListener("click", toggle);

  function mount() { document.body.appendChild(btn); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  function css(el, o) { for (var k in o) el.style[k] = o[k]; }
})();
