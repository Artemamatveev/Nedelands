// Azure Speech text to speech, shared by the conversations (api/_talk.js) and the recordings (audio/build.mjs).
// A voice is written as Azure's name, optionally with a pitch: "nl-NL-MaartenNeural" or "nl-NL-MaartenNeural@-8%".
// Azure has few native Dutch voices, so a pitch makes a second man or woman in a dialogue sound like another person.
// Any other name is one of Google's Chirp 3 HD voices ("Charon"): isAzure() tells them apart.
export const isAzure = (voice) => /^[a-z]{2}-[A-Z]{2}-\w+Neural(?:@[+-]\d{1,2}%)?$/.test(String(voice || ""));
const xml = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
export function ssml(text, voice) {
  const [name, pitch] = String(voice).split("@");
  const body = pitch ? `<prosody pitch="${pitch}">${xml(text)}</prosody>` : xml(text);
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="nl-NL"><voice name="${name}">${body}</voice></speak>`;
}
export const region = (r) => ((String(r || "germanywestcentral").trim().toLowerCase().match(/^[a-z0-9]+$/) || ["germanywestcentral"])[0]);
// One MP3 (24 kHz, 48 kbit/s, mono) as a Buffer; throws with .status on an HTTP error
export async function azureSay({ key, region: where, voice, text, timeout = 2500 }) {
  const r = await fetch(`https://${region(where)}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST", signal: AbortSignal.timeout(timeout),
    headers: {
      "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "bittertalen",
    },
    body: ssml(text, voice),
  });
  if (!r.ok) throw Object.assign(new Error(`Azure ${r.status}`), { status: r.status });
  return Buffer.from(await r.arrayBuffer());
}
