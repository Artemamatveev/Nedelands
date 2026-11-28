// Azure Speech for spoken Dutch (/api/pron, a rewrite to /api/check?kind=pron, see vercel.json). audio is always a base64
// WAV, 16 kHz mono 16-bit PCM.
// Zeg het na: POST {text, audio} (text: the sentence the learner reads aloud; audio at most PRON_SECONDS) -> {heard,
// scores:{accuracy, fluency, completeness, pron} (0–100), words:[{w, s, e}], left} (e: None, Mispronunciation, Omission
// or Insertion; s the word's accuracy). Scripted assessment: the reference text is known, so Azure compares the sound
// with it.
// Spreken practice: POST {free:true, audio} (an answer of at most FREE_SECONDS) -> {heard, text, scores:{accuracy,
// fluency, pron}, words, part, left}: Whisper large-v3-turbo at Groq writes the whole answer down (GROQ_API_KEY; Azure's
// speech to text when that key is missing or Groq fails), and Azure scores the pronunciation of its first PRON_SECONDS
// without a reference text (unscripted; Azure's limit for an assessment). Whisper because it keeps a learner's mistakes:
// on 60 accented A2 sentences (28 November 2026) it kept 43 of 48 (geschrijft, de brood, hij hebben), Azure 36;
// a prompt asking for a verbatim transcript made Whisper worse (35), so it gets none;
// part is true when only that first part was scored. A free answer takes its seconds plus the scored ones from the
// learner's STT_DAY seconds a day (default 2700) instead of a check of PRON_DAY.
// Before a proefexamen: POST {ask:true} -> {left, all}: the learner's seconds left today and everyone's, without using
// any, so the page can run the whole exam on Azure or the whole exam on the phone.
// nl-NL has no prosody score (Azure gives it for en-US only).
// Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (default germanywestcentral) in the Vercel project's environment variables.
// Only signed-in learners: PRON_DAY takes a day each (default 30) and all of them together PRON_CAP seconds of audio a
// day (default 14400, about $5.28 at $1.32 an hour; a free answer counts its seconds plus the scored part). The audio
// goes to Microsoft (and a free answer to Groq) for this one request and is not kept here.
import { accounts, caller, useGuard, addSpend, amsterdamDay, soundSeal } from "./_supa.js";

const KEY = (process.env.AZURE_SPEECH_KEY || "").trim();
const REGION = ((process.env.AZURE_SPEECH_REGION || "germanywestcentral").trim().toLowerCase().match(/^[a-z0-9]+$/) || ["germanywestcentral"])[0];
export const PRON_DAY = Math.max(1, parseInt(process.env.PRON_DAY, 10) || 30);
const PRON_CAP = Math.max(60, parseInt(process.env.PRON_CAP, 10) || 14400);
export const STT_DAY = Math.max(60, parseInt(process.env.STT_DAY, 10) || 2700);
export const PRON_SECONDS = 30, FREE_SECONDS = 60;
export const pronOn = !!(KEY && accounts);
const RATE = 16000, AZURE_MS = 20_000, TEXT_MAX = 400;
const ERRORS = new Set(["None", "Mispronunciation", "Omission", "Insertion"]);
const GROQ = (process.env.GROQ_API_KEY || "").trim(), WHISPER = (process.env.WHISPER_MODEL || "whisper-large-v3-turbo").trim();
// What Whisper writes for silence or noise (it was trained on subtitles): never taken as the learner's answer
const PHANTOM = /ondertitel|ondertiteling|bedankt voor het kijken|bedankt voor het luisteren|abonneer|amara\.org|tv gelderland|www\./i;
const STT = `https://${REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=nl-NL&format=detailed`;

// A WAV of the shape the page makes: RIFF, PCM, mono, 16 kHz, 16-bit; its length in seconds, or 0
export function wavSeconds(buf) {
  if (!buf || buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return 0;
  if (buf.readUInt16LE(20) !== 1 || buf.readUInt16LE(22) !== 1 || buf.readUInt32LE(24) !== RATE || buf.readUInt16LE(34) !== 16) return 0;
  return (buf.length - 44) / (RATE * 2);
}
// The first seconds of such a WAV, with its header set to the new length
export function wavHead(buf, secs) {
  const n = Math.min(buf.length - 44, Math.floor(secs * RATE) * 2), out = Buffer.alloc(44 + n);
  buf.copy(out, 0, 0, 44); buf.copy(out, 44, 44, 44 + n);
  out.writeUInt32LE(36 + n, 4); out.writeUInt32LE(n, 40);
  return out;
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
// What Azure wrote down: the display text of the best guess ("Ik woon in Utrecht."), or ""
export const readText = (j) => j && j.RecognitionStatus === "Success" ? String(j.NBest?.[0]?.Display || j.DisplayText || "").trim().slice(0, 1200) : "";

async function azure(audio, settings) {
  const headers = { "Ocp-Apim-Subscription-Key": KEY, Accept: "application/json", "Content-Type": `audio/wav; codecs=audio/pcm; samplerate=${RATE}` };
  if (settings) headers["Pronunciation-Assessment"] = Buffer.from(JSON.stringify(settings), "utf8").toString("base64");
  try {
    const r = await fetch(STT, { method: "POST", signal: AbortSignal.timeout(AZURE_MS), headers, body: audio });
    if (r.ok) return await r.json().catch(() => null);
    console.error("pron azure", r.status);
  } catch (e) { console.error("pron azure", e.name); }
  return null;
}

// Whisper at Groq: the text of a WAV, or null (no key, an error, a timeout)
export async function whisper(audio) {
  if (!GROQ) return null;
  const form = new FormData();
  form.append("file", new Blob([audio], { type: "audio/wav" }), "answer.wav");
  form.append("model", WHISPER); form.append("language", "nl"); form.append("temperature", "0"); form.append("response_format", "json");
  try {
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", signal: AbortSignal.timeout(AZURE_MS), headers: { Authorization: `Bearer ${GROQ}` }, body: form });
    if (r.ok) { const j = await r.json().catch(() => null); if (typeof j?.text === "string") return j.text.replace(/\s+/g, " ").trim().slice(0, 1200); }
    else console.error("whisper", r.status);
  } catch (e) { console.error("whisper", e.name); }
  return null;
}

export async function pron(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!pronOn) return res.status(503).json({ error: "not_configured" });
  if (Number(req.headers["content-length"]) > 2_800_000) return res.status(413).json({ error: "too_large" });
  if (req.body?.ask === true) {
    const user = await caller(req).catch(() => null);
    if (!user) return res.status(401).json({ error: "login" });
    const day = amsterdamDay();
    const [left, all] = await Promise.all([useGuard("stt:" + user.id, day, 0, STT_DAY), useGuard("pron:all", day, 0, PRON_CAP)]).catch(() => [null, null]);
    if (left == null || all == null) return res.status(503).json({ error: "quota_unavailable" });
    return res.status(200).json({ left, all });
  }
  const free = req.body?.free === true;
  const text = free ? "" : String(req.body?.text ?? "").replace(/\s+/g, " ").trim();
  if (!free && (!text || text.length > TEXT_MAX)) return res.status(400).json({ error: "text" });
  let audio = null;
  try { audio = typeof req.body?.audio === "string" ? Buffer.from(req.body.audio, "base64") : null; } catch {}
  const secs = wavSeconds(audio);
  if (secs < 0.3 || secs > (free ? FREE_SECONDS : PRON_SECONDS) + 0.5) return res.status(400).json({ error: "audio" });

  const user = await caller(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "login" });
  const scored = Math.min(secs, PRON_SECONDS), cost = Math.ceil(free ? secs + scored : secs), day = amsterdamDay();
  // Zeg het na: one check of PRON_DAY; a free answer: its seconds of STT_DAY
  const [gk, gcost, glim] = free ? ["stt:" + user.id, cost, STT_DAY] : ["pron:" + user.id, 1, PRON_DAY];
  const left = await useGuard(gk, day, gcost, glim).catch((e) => { console.error("guard", e.message); return null; });
  if (left == null) return res.status(503).json({ error: "quota_unavailable" });
  if (left < 0) return res.status(429).json({ error: "limit", limit: glim });
  const giveBack = () => useGuard(gk, day, -gcost, glim).catch(() => null);
  const all = await useGuard("pron:all", day, cost, PRON_CAP).catch((e) => { console.error("guard", e.message); return null; });
  if (all == null || all < 0) { await giveBack(); return res.status(all == null ? 503 : 429).json({ error: all == null ? "quota_unavailable" : "busy" }); }
  const fail = async () => { await Promise.all([giveBack(), useGuard("pron:all", day, -cost, PRON_CAP).catch(() => null)]); return res.status(502).json({ error: "failed" }); };
  // Billed by the second of audio: in /admin as the model "azure-speech-pron", one input "token" a second
  const spent = () => addSpend("azure-speech-pron", { input_tokens: cost }).catch(() => null);

  const settings = { GradingSystem: "HundredMark", Granularity: "Word", Dimension: "Comprehensive", EnableMiscue: !free };
  if (!free) {
    const j = await azure(audio, { ReferenceText: text, ...settings });
    if (!j) return fail();
    spent();
    return res.status(200).json({ ...readAssessment(j), left });
  }
  // A free answer: Whisper's text of the whole answer and Azure's scores of its first part, at the same time; Azure's
  // text only when Whisper gives none
  const [heardW, judged] = await Promise.all([whisper(audio), azure(secs > PRON_SECONDS ? wavHead(audio, PRON_SECONDS) : audio, settings)]);
  let t = heardW;
  if (t == null) { const said = await azure(audio); if (!said) return fail(); t = readText(said); }
  else addSpend("groq-whisper", { input_tokens: Math.max(10, Math.ceil(secs)) }).catch(() => null); // Groq bills at least 10 s
  // Azure's seconds: the scored part, and the whole answer when it also wrote the text
  addSpend("azure-speech-pron", { input_tokens: Math.ceil(scored + (heardW == null ? secs : 0)) }).catch(() => null);
  const a = readAssessment(judged);
  // Silence or noise: Whisper may still write a subtitle line; Azure heard no word in it
  if (t && (PHANTOM.test(t) || (judged && !a.heard && secs <= PRON_SECONDS))) t = "";
  return res.status(200).json({
    heard: !!t, text: t, left, part: secs > PRON_SECONDS + 0.5,
    // seal: the two scores signed for this learner, for DUO's uitspraak and vloeiendheid points in Spreken grading
    ...(a.heard ? { scores: { accuracy: a.scores.accuracy, fluency: a.scores.fluency, pron: a.scores.pron }, words: a.words } : {}),
    ...(a.heard && t ? { seal: soundSeal(user.id, a.scores.accuracy, a.scores.fluency) } : {}),
  });
}
