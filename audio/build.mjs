// Records every line the app says itself (audio/<key>.mp3) with Google's Chirp 3 HD voices, and writes
// audio/index.json (the keys the page has a file for) and audio/lines.json (key → [voice, text], for the next run).
//
//   node audio/build.mjs            record what is new or changed, delete files no line uses any more
//   node audio/build.mjs --dry      only count what would be recorded (--dry --who: and show who says what)
//
// The texts come from the page itself: voiceTexts() and sayKeys() in index.html, run in headless Chrome, so a key here is
// exactly the key speak() looks up. The Google key is read from ~/.config/bittertalen/tts.env (GOOGLE_TTS_KEY=…),
// never from the repository.
import { createServer } from "node:http";
import { readFile, writeFile, readdir, unlink, mkdtemp, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), ".."), OUT = join(ROOT, "audio");
const DRY = process.argv.includes("--dry");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// The voices (chosen by ear in November 2026). F and M speak; F2 and M2 only when two women or two men talk together.
const V = { F: "Vindemiatrix", M: "Charon", F2: "Aoede", M2: "Orus" };
const NARRATOR = "M"; // reads the KNM, Luisteren and Spreken questions aloud, as the voice on the exam does

// Who is speaking: the names and titles people introduce themselves with in the texts, and the people in the Gesprekken (GP .w)
const FEMALE = new Set(`Anouk Samira Lisa Fatima Fatma Sandra Els Marieke Ayşe Aisha Amina Amira Anna Anne Annemiek Astrid Carla
  Emma Esther Eva Femke Hanna Ilse Inge Ingrid Iris Jasmijn Joyce Julia Karin Linda Lotte Maria Marja Marloes Monique Nadia
  Noor Petra Rachida Saskia Sanne Sophie Tamara Wendy Yasmina Yvonne Zeynep Esra Nora Elif Leila Mirjam Ellen Joke Ria Tineke
  Hatice Meryem Malika Naima Khadija Ewa Olga Kim Fleur Lieke Roos Mila Sara Sarah Fenna Jolanda Marian Mariam Hiba Rania Dina
  assistente juf mevrouw moeder mam oma buurvrouw zus`.split(/\s+/));
const MALE = new Set(`Samir Peter Mark Kees Jan Piet Ahmed Mohammed Mohamed Mo Youssef Yusuf Ali Omar Hassan Karim Bram
  Daan Dennis Erik Frank Hans Henk Jeroen Joost Kevin Lucas Martijn Mehmet Mustafa Niels Pieter Rob Ruben Sander Sem Thijs
  Tim Tom Wim Willem Bas Gerrit Jaap Koen Luuk Milan Ravi Tomasz Piotr Marek Hamza Bilal Ibrahim Emre Murat Kofi Arjen
  Dirk Gert Joris Marco Paul Stefan Vincent Wouter Ahmet Rachid Driss Said Tarik Roel Lars Bart Thomas Johan Ruud Dmitri
  Mateo Noah Lars Jesse Hugo Max Rik Ruud Theo
  assistent meester meneer vader pap opa buurman broer bakker ober verkoper marktkoopman fietsenmaker`.split(/\s+/));
const genderOf = word => { const w = (word || "").trim(); if (!w) return null;
  for (const x of [w, w.toLowerCase()]) { if (FEMALE.has(x)) return "F"; if (MALE.has(x)) return "M" } return null };
// How a speaker says who they are: "met Samira Benali", "u spreekt met de assistente", "Ik ben je nieuwe buurvrouw, Fatma",
// "Mijn naam is Wouter", "met trainer Kevin", "Groeten, Petra"; a title (mevrouw, juf …) says it, else the name
const SELF = /(?:\b[Mm]et|\b[Ii]k ben|\b[Ii]k heet|\b[Mm]ijn naam is|\b[Hh]ier is|\b[Gg]roeten,|\b[Gg]roetjes,)\s+(?:(?:de|je|uw) )?(?:nieuwe )?(?:(mevrouw|meneer|juf|meester|trainer|assistente|assistent|buurvrouw|buurman|moeder|vader|zus|broer),? ?)?([A-ZÀ-Ý][\wÀ-ÿş]+)?/g;
const unknown = new Set();
const selfGender = lines => { for (const l of lines) for (const m of l.matchAll(SELF)) {
  const g = genderOf(m[1]) || genderOf(m[2]); if (g) return g; if (m[2] && !/^(De|Het|Een)$/.test(m[2])) unknown.add(m[2]) } return null };
const roleGender = (role, lines) => { for (const w of String(role).split(/\s+/)) { const g = genderOf(w); if (g) return g } return selfGender(lines) };
const coin = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % 2 ? "F" : "M"; // unknown: half and half, always the same

function env() {
  return readFile(join(homedir(), ".config/bittertalen/tts.env"), "utf8").then(t => Object.fromEntries(
    t.split("\n").filter(l => l.includes("=") && !l.trim().startsWith("#")).map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })));
}

// The page's texts and keys, from headless Chrome: the app with one more script at the end, which prints them base64'd
async function pageTexts() {
  const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".txt": "text/plain" };
  const probe = `<script>try{const r=voiceTexts().map(x=>({...x,L:(L=>{const K=sayKeys(L);return L.map((l,i)=>[K[i],l])})(x.t.split("\\n").map(l=>l.trim()).filter(Boolean))})),
    o=document.createElement("pre");o.id="out";o.textContent=btoa(unescape(encodeURIComponent(JSON.stringify(r))));document.documentElement.appendChild(o)}
    catch(e){const o=document.createElement("pre");o.id="err";o.textContent=e;document.documentElement.appendChild(o)}</script>`;
  const srv = createServer(async (q, s) => {
    const p = decodeURIComponent(new URL(q.url, "http://x").pathname);
    if (p === "/__voice") { s.writeHead(200, { "Content-Type": "text/html" }); return s.end((await readFile(join(ROOT, "index.html"), "utf8")).replace(/<\/body>/, probe + "</body>")) }
    try { const b = await readFile(join(ROOT, p === "/" ? "index.html" : p)); s.writeHead(200, { "Content-Type": types[extname(p)] || "application/octet-stream" }); s.end(b) }
    catch { s.writeHead(404); s.end() }
  });
  await new Promise(r => srv.listen(0, "127.0.0.1", r));
  const prof = await mkdtemp(join(tmpdir(), "bt-chrome-"));
  try {
    const dom = await new Promise((ok, no) => execFile(CHROME, ["--headless=new", "--disable-gpu", `--user-data-dir=${prof}`,
      "--virtual-time-budget=15000", "--dump-dom", `http://127.0.0.1:${srv.address().port}/__voice`],
      { maxBuffer: 1 << 28 }, (e, out) => e ? no(e) : ok(out)));
    const m = dom.match(/<pre id="out">([^<]+)<\/pre>/);
    if (!m) throw new Error("the page did not give its texts: " + ((dom.match(/<pre id="err">([^<]*)/) || [])[1] || "does index.html still load?"));
    return JSON.parse(Buffer.from(m[1], "base64").toString("utf8"));
  } finally { srv.close(); await rm(prof, { recursive: true, force: true }) }
}

// Which voice says each line: key → [voice, text without "A: "]
function assign(entries) {
  const out = new Map(), put = (k, g, l) => { if (!out.has(k)) out.set(k, [V[g], l.replace(/^[A-C]: /, "")]) };
  const roles = {};
  for (const e of entries) if (e.k === "gp") (roles[e.g] = roles[e.g] || []).push(e.t);
  const roleG = {}; for (const r in roles) roleG[r] = roleGender(r, roles[r]) || coin(r);
  for (const e of entries) {
    if (e.k === "ls") {
      const ls = e.L.map(x => x[1]), who = [...new Set(ls.map(l => (l.match(/^([A-C]): /) || [])[1]).filter(Boolean))];
      if (who.length) { // a dialogue: each person their own voice; someone who doesn't say who they are is a man or a
        // woman so that the voices differ; two women or two men get the second voice
        const g = {}, n = { F: 0, M: 0 }, voice = {};
        for (const p of who) g[p] = selfGender(ls.filter(l => l.startsWith(p + ": ")));
        for (const p of who) { if (!g[p]) { const c = { F: 0, M: 0 }; for (const q of who) if (g[q]) c[g[q]]++; g[p] = c.M > c.F ? "F" : c.F > c.M ? "M" : p === "B" ? "F" : "M" }
          voice[p] = g[p] + (n[g[p]]++ % 2 ? "2" : "") }
        for (const [k, l] of e.L) put(k, voice[(l.match(/^([A-C]): /) || [])[1]] || voice[who[0]], l);
      } else { const g = selfGender(ls) || coin(e.t); for (const [k, l] of e.L) put(k, g, l) }
    } else if (e.k === "q" || e.k === "sp") for (const [k, l] of e.L) put(k, NARRATOR, l);
    else if (e.k === "gp") for (const [k, l] of e.L) put(k, roleG[e.g], l);
    else if (e.k === "gpm") for (const [k, l] of e.L) put(k, roleG[e.g] === "F" ? "M" : "F", l);
    else for (const [k, l] of e.L) put(k, "F", l); // words and reading aloud
  }
  return out;
}

async function say(key, voice, text) {
  const body = JSON.stringify({ input: { text }, voice: { languageCode: "nl-NL", name: "nl-NL-Chirp3-HD-" + voice },
    audioConfig: { audioEncoding: "MP3", sampleRateHertz: 24000 } });
  for (let t = 0; ; t++) {
    const r = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", { method: "POST", body,
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key } });
    if (r.ok) return Buffer.from((await r.json()).audioContent, "base64");
    if ((r.status === 429 || r.status >= 500) && t < 6) { await new Promise(s => setTimeout(s, 2000 * 2 ** t)); continue }
    throw new Error(`Google ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }
}

const entries = await pageTexts(), lines = assign(entries);
const old = await readFile(join(OUT, "lines.json"), "utf8").then(JSON.parse).catch(() => ({}));
const files = new Set((await readdir(OUT)).filter(f => f.endsWith(".mp3")).map(f => f.slice(0, -4)));
const todo = [...lines].filter(([k, [v, l]]) => !files.has(k) || !old[k] || old[k][0] !== v || old[k][1] !== l);
const chars = todo.reduce((n, [, [, l]]) => n + l.length, 0), all = [...lines.values()].reduce((n, [, l]) => n + l.length, 0);
const kinds = {}; for (const e of entries) kinds[e.k] = (kinds[e.k] || 0) + e.t.length;
console.log(`${lines.size} lines, ${all} characters (${Object.entries(kinds).map(([k, n]) => k + " " + n).join(", ")}); to record: ${todo.length} lines, ${chars} characters`);
if (process.argv.includes("--who")) { // who says what, to check the voices
  console.log("names not known as a man or a woman:", [...unknown].join(" ") || "none");
  for (const e of entries) if (e.k === "ls" || e.k === "gp") console.log(e.k, e.g || "", "|", e.L.map(([k, l]) => lines.get(k)[0][0] + lines.get(k)[0].slice(-1) + ": " + l.slice(0, 50)).join(" / ").slice(0, 260));
}
if (DRY) process.exit(0);

const { GOOGLE_TTS_KEY: key } = await env();
if (!key) throw new Error("GOOGLE_TTS_KEY missing in ~/.config/bittertalen/tts.env");
const keep = {}; for (const [k, [v, l]] of lines) if (files.has(k) && old[k] && old[k][0] === v && old[k][1] === l) keep[k] = old[k];
let done = 0, failed = 0;
const save = () => writeFile(join(OUT, "lines.json"), JSON.stringify(keep, null, 0).replace(/\],"/g, '],\n"'));
const queue = [...todo];
await Promise.all(Array.from({ length: 8 }, async () => {
  for (let x; (x = queue.shift());) {
    const [k, [v, l]] = x;
    try { await writeFile(join(OUT, k + ".mp3"), await say(key, v, l)); keep[k] = [v, l]; files.add(k) }
    catch (e) { failed++; console.error(`${k}: ${e.message}`) }
    if (++done % 200 === 0) { console.log(`${done}/${todo.length}`); await save() }
  }
}));
// Files no line uses any more
for (const f of files) if (!lines.has(f)) { await unlink(join(OUT, f + ".mp3")).catch(() => {}) }
await save();
await writeFile(join(OUT, "index.json"), JSON.stringify(Object.keys(keep).sort()));
console.log(`recorded ${done - failed}, failed ${failed}; ${Object.keys(keep).length} files in audio/`);
