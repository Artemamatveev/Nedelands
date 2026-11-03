import { createHash } from "node:crypto";
// Supabase from the server, by plain fetch (no SDK): who is calling, the daily check allowance, deleting an account.
// Files starting with _ are not routes on Vercel. The env vars come from the Supabase integration in the Vercel
// Marketplace; without them accounts are off and everything works as before (no login needed for grading).
const URL_ = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const ANON = (process.env.SUPABASE_ANON_KEY || "").trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export const accounts = !!(URL_ && ANON && SERVICE);
export const supaUrl = URL_;
export const anonKey = ANON;
// Claude checks per person per day; a proefexamen costs more than one task (see checkCost)
export const LIMIT = Math.max(1, parseInt(process.env.CHECK_LIMIT, 10) || 20);
// One task is 1; a proefexamen Schrijven (4 tasks) 2, Schrijven B1 (12) 4, Spreken A2 or B1 (16 answers) 6: roughly what they cost in tokens
export const checkCost = (tasks) => Math.max(1, Math.ceil(tasks / 3));

// The user behind "Authorization: Bearer <access token>", or null
export async function caller(req) {
  const m = String(req.headers.authorization || "").match(/^Bearer\s+(\S+)$/);
  if (!accounts || !m) return null;
  const r = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: ANON, authorization: `Bearer ${m[1]}` } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  return u && u.id ? u : null;
}

// Takes `cost` checks from today's allowance (negative gives them back); returns what is left, -1 when not enough
export async function useChecks(uid, cost) {
  const r = await fetch(`${URL_}/rest/v1/rpc/use_checks`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ uid, cost, lim: LIMIT }),
  });
  if (!r.ok) throw new Error(`use_checks ${r.status}`);
  return Number(await r.json());
}

// Free checks without an account: FREE_CHECKS a day per visitor (default 2, 0 turns it off) and FREE_CAP a day for
// all visitors together (default 50), so a stranger can try it but it can't cost much. The visitor is a hash of the
// IP address with a secret, never the address itself; the rows are deleted after a day (use_free_checks in schema.sql).
export const FREE = Math.max(0, parseInt(process.env.FREE_CHECKS ?? "2", 10) || 0);
const FREE_CAP = Math.max(1, parseInt(process.env.FREE_CAP, 10) || 50);
export const visitor = (req) => {
  const ip = String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return ip ? createHash("sha256").update(ip + "|" + SERVICE).digest("hex").slice(0, 32) : "";
};
// Takes `cost` free checks for this visitor (negative gives back): what is left, -1 (visitor's day used up) or -2
// (everyone's day used up); throws when the function is not in the database yet
export async function useFree(who, cost) {
  const r = await fetch(`${URL_}/rest/v1/rpc/use_free_checks`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ who, cost, lim: FREE, cap: FREE_CAP }),
  });
  if (!r.ok) throw new Error(`use_free_checks ${r.status}`);
  return Number(await r.json());
}

// Deletes the user; their progress and usage rows go with them (on delete cascade)
export async function deleteUser(uid) {
  const r = await fetch(`${URL_}/auth/v1/admin/users/${encodeURIComponent(uid)}`, {
    method: "DELETE",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` },
  });
  return r.ok;
}

// Only this site's own pages may call the api
export const sameOrigin = (req) => {
  let host = "";
  try { host = new URL(req.headers.origin).host; } catch {}
  return host === req.headers.host;
};
