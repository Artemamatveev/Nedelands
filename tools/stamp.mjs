// Versions in oefenen.html. Every local script (data/, study/) is loaded as "?v=<hash of its content>", and DICTV is
// the hash of the dictionary's parts (dict/nl-en/). The service worker keeps such a file for good under that address, so
// a changed file must get a new address: run `node tools/stamp.mjs` after editing data/, study/ or the dictionary.
// `node tools/stamp.mjs --check` changes nothing and fails when a version is out of date (the tests run it).
import fs from "node:fs";
import crypto from "node:crypto";

const ROOT = new URL("../", import.meta.url);
const read = p => fs.readFileSync(new URL(p, ROOT));
const hash = buf => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 10);

export function dictVersion() {
  const dir = new URL("dict/nl-en/", ROOT);
  if (!fs.existsSync(dir)) return "";
  const h = crypto.createHash("sha256");
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".txt")).sort()) h.update(f).update(read("dict/nl-en/" + f));
  return h.digest("hex").slice(0, 10);
}

export function stamped(html) {
  let out = html.replace(/src="(\/(?:data|study)\/[^"?]+\.js)(?:\?v=[0-9a-f]*)?"/g, (m, p) => `src="${p}?v=${hash(read(p.slice(1)))}"`);
  const dv = dictVersion();
  if (dv) out = out.replace(/const DICTV="[0-9a-f]*"/, `const DICTV="${dv}"`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const page = read("oefenen.html").toString(), next = stamped(page);
  if (process.argv.includes("--check")) {
    if (next !== page) { console.error("oefenen.html has old versions: run node tools/stamp.mjs"); process.exit(1); }
  } else if (next !== page) { fs.writeFileSync(new URL("oefenen.html", ROOT), next); console.log("oefenen.html: versions updated"); }
  else console.log("oefenen.html: versions are up to date");
}
