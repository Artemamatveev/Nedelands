// Schrijven A2: a spelling check without AI, so the spelling points of a text don't depend on how Claude counts that day.
// 1. unknownWords(): the words of a text that are not in Dutch, by the app's own dictionary (dict/nl-en.txt, every
//    headword and inflected form, about 180 000), with compounds (boodschappen+lijst, with a linking s, e or en),
//    diminutives (huis+je) and the words of the task itself allowed. Names (a capital not at the start of a sentence),
//    numbers, e-mail addresses and links are skipped. Claude gets them as hints: "possibly a spelling mistake".
// 2. spellingPoints(): DUO's rule for A2 (spelling 0–2): at most 2 spelling mistakes 2, 3 to 5 1, 6 or more 0, from the
//    mistakes Claude lists with kind "spelling". The final points are the lower of this and Claude's own, so Claude can
//    still take a point for unreadable words or a misspelled name of the learner, but never give 2 points while it lists
//    four spelling mistakes.
import { readFileSync } from "node:fs";

let WORDS = null;
function words() {
  if (WORDS) return WORDS;
  WORDS = new Set();
  try {
    const text = readFileSync(new URL("../dict/nl-en.txt", import.meta.url), "utf8");
    // Headwords all count. A form (a line "form\tlemma:pos|…") counts as a form of a verb, noun, adjective or name, or
    // of a pronoun, article or numeral when it only adds an ending: Wiktionary also lists misspellings and spoken forms of words that don't inflect as their "forms"
    // (mischien → misschien:d, tog → toch:d, nie → niet:d), and those must stay mistakes.
    for (const line of text.split("\n")) {
      const cols = line.split("\t"), w = (cols[0] || "").trim().toLowerCase();
      if (!w || w.includes(" ")) continue;
      if (cols.length >= 3) WORDS.add(w);
      else if (cols.length === 2 && cols[1].split("|").some((x) => { const [l, p] = x.split(":");
        // a pronoun, article or numeral form that adds an ending to its word (elk → elke, mijn → mijne), not my → mij
        return /^[vnam]$/.test(p) || (/^[rtu]$/.test(p) && l && w.startsWith(l.toLowerCase())); })) WORDS.add(w);
    }
  } catch (e) { console.error("spell words", e.message); }
  // Small words a learner uses all the time that a dictionary of lemmas may lack as forms
  for (const w of "ik je jij u hij zij ze wij we jullie het de een en of maar want dus omdat als dan niet geen wel ook nog al er hier daar mijn jouw uw zijn haar ons onze hun me mij hem jou ben bent is zijn was waren heb hebt heeft hebben had hadden kan kun kunt kunnen wil wilt willen moet moeten mag mogen ga gaat gaan doe doet doen kom komt komen".split(" ")) WORDS.add(w);
  return WORDS;
}
const known = (w) => words().has(w);
// a compound of two known parts (the second at least 3 letters), with an optional linking s, e or en
function compound(w) {
  for (let i = 3; i <= w.length - 3; i++) {
    const a = w.slice(0, i), b = w.slice(i);
    if (!known(b) && !word(b, false)) continue;
    if (known(a) || (a.endsWith("s") && known(a.slice(0, -1))) || (a.endsWith("en") && known(a.slice(0, -2))) || (a.endsWith("e") && known(a.slice(0, -1)))) return true;
  }
  return false;
}
function word(w, deep = true) {
  if (known(w)) return true;
  const dim = /^(.{2,}?)(etje|tje|pje|kje|je)$/.exec(w); // huisje, kopje, broodje, mannetje
  if (dim && (known(dim[1]) || known(dim[1].replace(/(.)\1$/, "$1")))) return true;
  if (/(.{3,})s$/.test(w) && known(w.slice(0, -1))) return true; // a plural or genitive in -s
  return deep && w.length >= 7 && compound(w);
}
const TOKEN = /[\p{L}][\p{L}'’-]*/gu;
const GREETING = /^(beste|hallo|hoi|hey|lieve|dag|geachte|groeten|groet|groetjes|met|vriendelijke|meneer|mevrouw|juf|meester)$/i;
export function unknownWords(text, task = "", max = 15) {
  if (words().size < 1000) return []; // no dictionary (not bundled?): no hints rather than every word
  const s = String(text || "").replace(/\S+@\S+|https?:\/\/\S+|www\.\S+/g, " ");
  const allowed = new Set((String(task).toLowerCase().match(TOKEN) || []));
  const out = [], toks = [...s.matchAll(/[\p{L}][\p{L}'’-]*|[.!?\n]/gu)].map((m) => m[0]);
  let start = true;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i].replace(/['’-]+$/, "");
    if (/^[.!?\n]$/.test(t)) { start = true; continue; }
    const first = start; start = false;
    if (/^\p{Lu}/u.test(t)) {
      if (!first) continue; // a name inside a sentence
      // at the start of a line: a name when it closes the line (Groeten,\nSamira) or follows a greeting (Beste Anna)
      const next = toks[i + 1], prev = toks[i - 1] || "";
      if (!word(t.toLowerCase()) && (next === undefined || next === "\n" || /^\p{Lu}/u.test(next || "") && [undefined, "\n"].includes(toks[i + 2]))) continue;
      if (GREETING.test(prev)) continue;
    }
    if (t.length < 2) continue;
    for (const part of t.split("-")) {
      const w = part.toLowerCase().replace(/[’]/g, "'").replace(/'s$/, "");
      if (w.length < 2 || allowed.has(w) || word(w) || out.includes(part)) continue;
      out.push(part);
      if (out.length >= max) return out;
    }
  }
  return out;
}
// A2 spelling points (0–2) from the number of spelling mistakes listed
export const spellingByCount = (n) => (n <= 2 ? 2 : n <= 5 ? 1 : 0);
// n: the spelling mistakes Claude lists, or its own count of all of them (spelfouten) when that is higher
export function spellingPoints(errors, claude, counted) {
  const listed = (Array.isArray(errors) ? errors : []).filter((e) => e?.kind === "spelling").length;
  const n = Math.max(listed, Number.isInteger(counted) && counted >= 0 && counted < 100 ? counted : 0);
  return Math.min(Number.isInteger(claude) ? claude : 2, spellingByCount(n));
}
