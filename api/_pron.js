// Zeg het na with Azure Speech pronunciation assessment (/api/pron, a rewrite to /api/check?kind=pron, see vercel.json).
// POST {text, audio} (text: the Dutch sentence the learner reads aloud; audio: base64 WAV, 16 kHz mono 16-bit PCM, at most
// PRON_SECONDS) -> {heard, scores:{accuracy, fluency, completeness, pron} (0–100), words:[{w, s, e}], left}
// (e: None, Mispronunciation, Omission or Insertion; s the word's accuracy). Scripted assessment: the reference text is
// known, so Azure compares the sound with it. nl-NL has no prosody score (Azure gives it for en-US only).
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (default germanywestcentral) in the Vercel project's environment variables.
// Only signed-in learners: PRON_DAY takes a day each (default 30) and all of them together PRON_CAP seconds of audio a
// day (default 3600, about $1.32 at $1.32 an hour). The audio goes to Microsoft for this one request and is not kept here.
import { accounts, caller, useGuard, addSpend, amsterdamDay } from "./_supa.js";

const KEY = (process.env.AZURE_SPEECH_KEY || "").trim();
const REGION = ((process.env.AZURE_SPEECH_REGION || "germanywestcentral").trim().toLowerCase().match(/^[a-z0-9]+$/) || ["germanywestcentral"])[0];
export const PRON_DAY = Math.max(1, parseInt(process.env.PRON_DAY, 10) || 30);
const PRON_CAP = Math.max(60, parseInt(process.env.PRON_CAP, 10) || 3600);
export const PRON_SECONDS = 30;
export const pronOn = !!(KEY && accounts);
const RATE = 16000, AZURE_MS = 15_000, TEXT_MAX = 400;
const ERRORS = new Set(["None", "Mispronunciation", "Omission", "Insertion"]);

// A WAV of the shape the page makes: RIFF, PCM, mono, 16 kHz, 16-bit; its length in seconds, or 0
export function wavSeconds(buf) {
  if (!buf || buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return 0;
  if (buf.readUInt16LE(20) !== 1 || buf.readUInt16LE(22) !== 1 || buf.readUInt32LE(24) !== RATE || buf.readUInt16LE(34) !== 16) return 0;
  return (buf.length - 44) / (RATE * 2);
}
const num = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
// Azure's answer, in the short shape the page shows. The scores sit on NBest[0] or under its PronunciationAssessment.
export function readAssessment(j) {
  if (!j || j.RecognitionStatus !== "Success" || !Array.isArray(j.NBest) || !j.NBest[0]) return { heard: false };
  const b = j.NBest[0], p = b.PronunciationAssessment || b;
  const words = (Array.isArray(b.Words) ? b.Words : []).slice(0, 200).map((w) => {
    const a = w.PronunciationAssessment || w;
    return { w: String(w.Word || "").slice(0, 60), s: num(a.AccuracyScore), e: ERRORS.has(a.ErrorType) ? a.ErrorType : "None" };
  }).filter((w) => w.w);
  return {
    heard: words.some((w) => w.e !== "Omission"),
    scores: { accuracy: num(p.AccuracyScore), fluency: num(p.FluencyScore), completeness: num(p.CompletenessScore), pron: num(p.PronScore) },
    words,
  };
}

export async function pron(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!pronOn) return res.status(503).json({ error: "not_configured" });
  if (Number(req.headers["content-length"]) > 1_400_000) return res.status(413).json({ error: "too_large" });
  const text = String(req.body?.text ?? "").replace(/\s+/g, " ").trim();
  if (!text || text.length > TEXT_MAX) return res.status(400).json({ error: "text" });
  let audio = null;
  try { audio = typeof req.body?.audio === "string" ? Buffer.from(req.body.audio, "base64") : null; } catch {}
  const secs = wavSeconds(audio);
  if (secs < 0.3 || secs > PRON_SECONDS + 0.5) return res.status(400).json({ error: "audio" });

  const user = await caller(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "login" });
  const day = amsterdamDay(), cost = Math.ceil(secs);
  const left = await useGuard("pron:" + user.id, day, 1, PRON_DAY).catch((e) => { console.error("guard", e.message); return null; });
  if (left == null) return res.status(503).json({ error: "quota_unavailable" });
  if (left < 0) return res.status(429).json({ error: "limit", limit: PRON_DAY });
  const giveBack = () => useGuard("pron:" + user.id, day, -1, PRON_DAY).catch(() => null);
  const all = await useGuard("pron:all", day, cost, PRON_CAP).catch((e) => { console.error("guard", e.message); return null; });
  if (all == null || all < 0) { await giveBack(); return res.status(all == null ? 503 : 429).json({ error: all == null ? "quota_unavailable" : "busy" }); }

  const settings = { ReferenceText: text, GradingSystem: "HundredMark", Granularity: "Word", Dimension: "Comprehensive", EnableMiscue: true };
  let j = null;
  try {
    const r = await fetch(`https://${REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=nl-NL&format=detailed`, {
      method: "POST", signal: AbortSignal.timeout(AZURE_MS),
      headers: {
        "Ocp-Apim-Subscription-Key": KEY, Accept: "application/json",
        "Content-Type": `audio/wav; codecs=audio/pcm; samplerate=${RATE}`,
        "Pronunciation-Assessment": Buffer.from(JSON.stringify(settings), "utf8").toString("base64"),
      },
      body: audio,
    });
    if (r.ok) j = await r.json().catch(() => null);
    else console.error("pron azure", r.status);
  } catch (e) { console.error("pron azure", e.name); }
  if (!j) {
    await Promise.all([giveBack(), useGuard("pron:all", day, -cost, PRON_CAP).catch(() => null)]);
    return res.status(502).json({ error: "failed" });
  }
  // Billed by the second of audio: in /admin as the model "azure-speech-pron", one input "token" a second
  addSpend("azure-speech-pron", { input_tokens: cost }).catch(() => null);
  return res.status(200).json({ ...readAssessment(j), left });
}
