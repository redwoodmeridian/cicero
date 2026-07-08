// Phone agent config — built from firm.config.json via the shared builder.
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { buildInstructions, buildTools } from "./agent-instructions.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const firm = JSON.parse(readFileSync(join(__dir, "firm.config.json"), "utf8"));

export const VOICE = process.env.AGENT_VOICE || firm.voice || "atlas";
export const TIMEZONE = firm.timezone || "America/New_York";

export function sessionConfig({ nowIso } = {}) {
  return {
    type: "session.update",
    session: {
      instructions: buildInstructions(firm, nowIso || new Date().toISOString(), "phone"),
      voice: VOICE,
      modalities: ["audio", "text"],
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      turn_detection: { type: "server_vad", threshold: 0.6, prefix_padding_ms: 200, silence_duration_ms: 500 },
      input_audio_transcription: { model: "whisper-1" },
      tools: buildTools(firm, process.env.XAI_COLLECTION_ID || ""),
    },
  };
}
