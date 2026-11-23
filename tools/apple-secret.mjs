// Sign in with Apple: make the client secret Supabase needs (Authentication → Sign In / Providers → Apple → Secret Key).
// Apple accepts at most six months, so run this again before it runs out (the expiry date is printed).
//   node tools/apple-secret.mjs [path/to/AuthKey_XXXXXXXXXX.p8]
// The key stays on this computer (default ~/.config/bittertalen/AuthKey_6GMQ7P9JL6.p8); the secret goes to the
// clipboard (macOS pbcopy) and is never printed.
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename } from "node:path";
import { execFileSync } from "node:child_process";

const TEAM = "GW742K94US", CLIENT = "nl.bittertalen.web";
const file = process.argv[2] || `${homedir()}/.config/bittertalen/AuthKey_6GMQ7P9JL6.p8`;
const kid = basename(file).match(/AuthKey_([A-Z0-9]{10})\.p8$/)?.[1];
if (!kid) throw new Error("expected a file named AuthKey_<KEYID>.p8");

const b64 = (x) => Buffer.from(typeof x === "string" ? x : JSON.stringify(x)).toString("base64url");
const now = Math.floor(Date.now() / 1000), exp = now + 180 * 24 * 3600 - 3600; // just under Apple's six months
const head = b64({ alg: "ES256", kid, typ: "JWT" });
const body = b64({ iss: TEAM, iat: now, exp, aud: "https://appleid.apple.com", sub: CLIENT });
const key = createPrivateKey(readFileSync(file));
const sig = sign("sha256", Buffer.from(`${head}.${body}`), { key, dsaEncoding: "ieee-p1363" }).toString("base64url");

execFileSync("pbcopy", { input: `${head}.${body}.${sig}` });
console.log(`Copied the Apple client secret for ${CLIENT} (key ${kid}) to the clipboard.`);
console.log(`It expires on ${new Date(exp * 1000).toISOString().slice(0, 10)}: run this again before then.`);
