import type { Metadata } from "next";
import VoiceWidget from "@/components/voice-widget";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vantage Injury Law — Phoenix Personal Injury Attorneys | Free Case Review",
  description:
    "Hurt in an accident in Phoenix or the Valley? Vantage Injury Law fights insurance companies so you can heal. No fee unless we win. Free case review — talk to us now.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <VoiceWidget />
      </body>
    </html>
  );
}
