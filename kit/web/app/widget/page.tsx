import VoiceWidget from "@/components/voice-widget";

// Widget-only page, meant to be loaded inside the embed.js iframe on any website.
export default function WidgetPage() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#141414" }}>
      <VoiceWidget embedded />
    </div>
  );
}
