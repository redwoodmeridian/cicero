// Lists xAI's built-in voices. Requires XAI_API_KEY.
const API = process.env.XAI_API_KEY;
if (!API) { console.error("Set XAI_API_KEY"); process.exit(1); }
const d = await (await fetch("https://api.x.ai/v1/tts/voices", { headers: { Authorization: "Bearer " + API } })).json();
const v = d.voices || [];
console.log(`${v.length} built-in voices (audition on your deployed site with ?voice=NAME):\n`);
for (const g of ["male", "female"]) {
  console.log(g.toUpperCase() + ":", v.filter((x) => x.gender === g).map((x) => x.voice_id).join(", "));
}
console.log("\nWant a custom voice? See docs/VOICE.md (upload ~120s of audio -> your own voice_id).");
