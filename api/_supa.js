import { createHash } from "node:crypto";
// Supabase from the server, by plain fetch (no SDK): who is calling, the daily check allowance, deleting an account.
// Files starting with _ are not routes on Vercel. The env vars come from the Supabase integration in the Vercel
// Marketplace; without them accounts and paid grading are unavailable.
const URL_ = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const ANON = (process.env.SUPABASE_ANON_KEY || "").trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export const accounts = !!(URL_ && ANON && SERVICE);
export const supaUrl = URL_;
export const anonKey = ANON;
// Claude checks per person per day; a proefexamen costs more than one task (see checkCost). Default 5 once Plus can be
// bought (the Stripe env vars below), 20 until then
const STRIPE_SET = ["STRIPE_SECRET_KEY", "STRIPE_PRICE", "STRIPE_WEBHOOK_SECRET"].every((k) => (process.env[k] || "").trim());
export const LIMIT = Math.max(1, parseInt(process.env.CHECK_LIMIT, 10) || (STRIPE_SET ? 5 : 20));
// With Bittertalen Plus (a Stripe subscription, see below) PLUS_LIMIT a day instead
export const PLUS = Math.max(1, parseInt(process.env.PLUS_LIMIT, 10) || 60);
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
export async function useChecks(uid, cost, lim = LIMIT) {
  const r = await fetch(`${URL_}/rest/v1/rpc/use_checks`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ uid, cost, lim }),
  });
  if (!r.ok) throw new Error(`use_checks ${r.status}`);
  const value = await r.json();
  if (!Number.isSafeInteger(value)) throw new Error("Invalid quota counter");
  return value;
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
  const value = await r.json();
  if (!Number.isSafeInteger(value)) throw new Error("Invalid quota counter");
  return value;
}

// All checks of a day together, logged-in and free (default 400, CHECK_CAP): a ceiling on what Claude can cost in a
// day, even if someone makes many accounts. Takes `cost` (negative gives back); what is left, -1 when the day is full;
// null when the counter is unavailable; the caller must refuse paid grading.
const CAP = Math.max(1, parseInt(process.env.CHECK_CAP, 10) || 400);
export async function useTotal(cost) {
  const r = await fetch(`${URL_}/rest/v1/rpc/use_total`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ cost, cap: CAP }),
  }).catch(() => null);
  if (!r || !r.ok) return null;
  const value = await r.json();
  if (!Number.isSafeInteger(value)) throw new Error("Invalid quota counter");
  return value;
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

// Logging in with Google or Apple from an iPhone home-screen app may come back in a separate Safari window. That window
// leaves the one-time code here under the random `h` the app made, and the app takes it (and exchanges it itself: the
// code is useless without the PKCE secret only the app holds). Rows live at most 10 minutes (table handoff, schema.sql).
const rest = (path, init = {}) =>
  fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json", ...(init.headers || {}) },
  });
const HAND_MS = 10 * 60 * 1000;
export async function putHand(h, code) {
  const old = encodeURIComponent(new Date(Date.now() - HAND_MS).toISOString());
  await rest(`handoff?at=lt.${old}`, { method: "DELETE" }).catch(() => {});
  const r = await rest("handoff", {
    method: "POST",
    headers: { prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ nonce: h, code, at: new Date().toISOString() }),
  });
  return r.ok;
}
// Real exam results for our figures (api/outcome.js, table exam_outcomes). OUTCOME_CAP new rows a month (default 2000), so a
// stranger can't fill the table: true when kept, false when the month is full; throws when it failed.
const OUTCOME_CAP = Math.max(1, parseInt(process.env.OUTCOME_CAP, 10) || 2000);
export async function putOutcome({ id, part, ok, pc, rd }) {
  const r = await rest("rpc/put_outcome", {
    method: "POST",
    body: JSON.stringify({ o_id: id, o_part: part, o_ok: ok, o_pc: pc, o_rd: rd, cap: OUTCOME_CAP }),
  });
  if (!r.ok) throw new Error(`put_outcome ${r.status}`);
  return (await r.json()) === true;
}
// Anonymous usage counts (api/event.js, table usage_counts): one more for today's event, level and menu language.
// EVENT_CAP a day per count (default 50000), so a stranger can't run it up: true when added, false when full; throws on failure.
const EVENT_CAP = Math.max(1, parseInt(process.env.EVENT_CAP, 10) || 50000);
export async function bumpEvent({ ev, lvl, ui }) {
  const r = await rest("rpc/bump_event", {
    method: "POST",
    body: JSON.stringify({ e_ev: ev, e_lvl: lvl, e_ui: ui, cap: EVENT_CAP }),
  });
  if (!r.ok) throw new Error(`bump_event ${r.status}`);
  return (await r.json()) === true;
}
export async function dropOutcome(id) {
  const r = await rest(`exam_outcomes?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return r.ok;
}
// Takes the code once: the row is deleted as it is read
export async function takeHand(h) {
  const r = await rest(`handoff?nonce=eq.${encodeURIComponent(h)}`, { method: "DELETE", headers: { prefer: "return=representation" } });
  if (!r.ok) return null;
  const row = (await r.json().catch(() => []))[0];
  return row && Date.now() - Date.parse(row.at) < HAND_MS ? row.code : null;
}

// Bittertalen Plus: a monthly Stripe subscription (api/plus.js starts it, api/stripe.js hears from Stripe). Plain fetch
// to Stripe's API, no SDK. Off unless STRIPE_SECRET_KEY, STRIPE_PRICE (the price id of the monthly price) and
// STRIPE_WEBHOOK_SECRET are set; PLUS_PRICE is only what the page shows (default "9,99").
const SK = (process.env.STRIPE_SECRET_KEY || "").trim();
export const PRICE = (process.env.STRIPE_PRICE || "").trim();
export const HOOK = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
export const plusOn = !!(accounts && SK && PRICE && HOOK);
export const PLUS_PRICE = (process.env.PLUS_PRICE || "9,99").trim();
// Stripe's form encoding: {a:{b:1}, c:[{d:2}]} -> a[b]=1&c[0][d]=2
const form = (o, pre = "", out = new URLSearchParams()) => {
  for (const [k, v] of Object.entries(o)) {
    if (v == null) continue;
    const key = pre ? `${pre}[${k}]` : k;
    if (typeof v === "object") form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
};
export async function stripe(path, params, method = params ? "POST" : "GET") {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { authorization: `Bearer ${SK}`, ...(params ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: params ? form(params) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  // Only the path's first part and Stripe's error code: never the key or the request
  if (!r.ok) throw new Error(`stripe ${path.split("/")[0]} ${r.status} ${(j.error && j.error.code) || ""}`);
  return j;
}
// The user's row of `plus` (schema.sql), or null
export async function plusOf(uid) {
  const r = await rest(`plus?user_id=eq.${encodeURIComponent(uid)}&select=customer,sub,status,until,ends`);
  if (!r.ok) throw new Error(`plus ${r.status}`);
  return (await r.json())[0] || null;
}
// Statuses that still give Plus (past_due: Stripe is still trying to charge); a day's grace after the period's end,
// in case the renewal reaches us a little late
export const LIVE = new Set(["active", "trialing", "past_due"]);
export const isPlus = (p) => !!p && LIVE.has(p.status) && (!p.until || Date.parse(p.until) + 864e5 > Date.now());
// Keeps the row: true, "gone" when the user no longer exists (the account was deleted), false when it failed
export async function putPlus(row) {
  const r = await rest("plus", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
  if (r.ok) return true;
  const j = await r.json().catch(() => ({}));
  return j.code === "23503" ? "gone" : false;
}
