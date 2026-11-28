// A Dutch line the app has no recording of, said by Azure (/api/say, a rewrite to /api/check?kind=say): Claude's
// corrected sentences, a word from the dictionary, the learner's own books, a line changed since the last recording.
// POST {t, v} (t: at most SAY_MAX characters; v: F, M, F2 or M2, the voices of audio/build.mjs) -> audio/mpeg.
// So the phone's own voice is only heard without a connection or when Azure fails. Nothing is stored or logged.
// Counted in units of 100 characters (use_guard takes at most 100 at a time): a signed-in learner SAY_DAY a day
// (default 300, 30 000 characters), all guests together SAY_GUEST (default 600), everyone SAY_CAP (default 3000,
// 300 000 characters, about $4.80 a day at $16 a million). No cookie: guests share their pool.
import { accounts, caller, useGuard, addSpend, amsterdamDay } from "./_supa.js";
import { azureSay } from "./_azure.js";

const KEY = (process.env.AZURE_SPEECH_KEY || "").trim(), REGION = process.env.AZURE_SPEECH_REGION;
const SAY_DAY = Math.max(1, parseInt(process.env.SAY_DAY, 10) || 300);
const SAY_GUEST = Math.max(1, parseInt(process.env.SAY_GUEST, 10) || 600);
const SAY_CAP = Math.max(1, parseInt(process.env.SAY_CAP, 10) || 3000);
export const SAY_MAX = 400;
export const sayOn = !!(KEY && accounts);
// The same voices as the recordings (V in audio/build.mjs)
export const SAY_VOICE = { F: "nl-NL-FennaNeural", M: "nl-NL-MaartenNeural", F2: "nl-NL-ColetteNeural", M2: "nl-NL-MaartenNeural@-8%" };

export async function say(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!sayOn) return res.status(503).json({ error: "not_configured" });
  const t = String(req.body?.t ?? "").replace(/\s+/g, " ").trim();
  if (!t || t.length > SAY_MAX || !/\p{L}/u.test(t)) return res.status(400).json({ error: "text" });
  const voice = SAY_VOICE[req.body?.v] || SAY_VOICE.F, cost = Math.ceil(t.length / 100), day = amsterdamDay();
  const user = await caller(req).catch(() => null);
  const [k, lim] = user ? ["say:" + user.id, SAY_DAY] : ["say:guests", SAY_GUEST];
  const mine = await useGuard(k, day, cost, lim).catch((e) => { console.error("guard", e.message); return null; });
  if (mine == null) return res.status(503).json({ error: "quota_unavailable" });
  if (mine < 0) return res.status(429).json({ error: "limit" });
  const all = await useGuard("say:all", day, cost, SAY_CAP).catch((e) => { console.error("guard", e.message); return null; });
  const giveBack = () => useGuard(k, day, -cost, lim).catch(() => null);
  if (all == null || all < 0) { await giveBack(); return res.status(all == null ? 503 : 429).json({ error: all == null ? "quota_unavailable" : "busy" }); }
  let mp3;
  try { mp3 = await azureSay({ key: KEY, region: REGION, voice, text: t, timeout: 6000 }); }
  catch (e) {
    console.error("say azure", e?.status || e?.name || "error");
    await Promise.all([giveBack(), useGuard("say:all", day, -cost, SAY_CAP).catch(() => null)]);
    return res.status(502).json({ error: "failed" });
  }
  // In /admin as the model "azure-speech-say", one input "token" a character
  addSpend("azure-speech-say", { input_tokens: t.length }).catch(() => null);
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Length", String(mp3.length));
  res.statusCode = 200;
  return res.end(mp3);
}
