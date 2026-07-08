# Voices

## Built-in (26 voices)
```bash
XAI_API_KEY=... node kit/scripts/list-voices.mjs
```
Male: altair, atlas, castor, cosmo, helios, helix, kepler, leo, lumen, lux, naksh, orion, perseus,
rex, rigel, sal, sirius, zagan, zenith.
Female: ara, carina, celeste, eve, iris, luna, ursa.

Audition on your deployed site: `https://<site>/?voice=orion`. Set the winner as `"voice"` in
`firm.config.json`, run `apply-config.mjs`, and redeploy.

## Custom voice (clone)
Upload ~120 seconds of clean audio to get your own voice_id — great for matching a real attorney or a
professional VO:
```bash
curl -X POST https://api.x.ai/v1/custom-voices \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -F "audio=@sample.wav" -F "name=our-firm-voice"
```
Use the returned `voice_id` exactly like a built-in voice. No extra charge to use it.
