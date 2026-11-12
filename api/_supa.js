import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
// Supabase from the server, by plain fetch (no SDK): who is calling, the daily check allowance, deleting an account.
// Files starting with _ are not routes on Vercel. The env vars come from the Supabase integration in the Vercel
// Marketplace; without them accounts and paid grading are unavailable.
const URL_ = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const ANON = (process.env.SUPABASE_ANON_KEY || "").trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export const accounts = !!(URL_ && ANON && SERVICE);
export const supaUrl = URL_;
export const anonKey = ANON;
// Free account checks per Amsterdam calendar week, shared by the levels not covered by Plus.
export const LIMIT = Math.max(1, parseInt(process.env.FREE_WEEKLY_CHECKS, 10) || 7);
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

// Reserve/refund in the same period, including when grading crosses midnight or Monday.
export async function useChecks(uid, cost, lim = LIMIT, period = "week", checkedAt = new Date().toISOString()) {
  const r = await fetch(`${URL_}/rest/v1/rpc/use_plan_checks`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ uid, cost, lim, window_kind: period, checked_at: checkedAt }),
  });
  if (!r.ok) throw new Error(`use_plan_checks ${r.status}`);
  const value = await r.json();
  if (!Number.isSafeInteger(value)) throw new Error("Invalid quota counter");
  return value;
}

// Two one-time trial checks in this browser. The daily cap for all guests remains in place.
export const FREE = Math.max(0, parseInt(process.env.FREE_CHECKS ?? "2", 10) || 0);
const FREE_CAP = Math.max(1, parseInt(process.env.FREE_CAP, 10) || 50);
const TRIAL_COOKIE = "bt_trial";
const trialSign = id => createHmac("sha256", SERVICE).update("bittertalen-trial|" + id).digest("hex");
export const visitor = (req, res) => {
  const cookie = String(req.headers.cookie || "").split(";").map(s => s.trim()).find(s => s.startsWith(TRIAL_COOKIE + "="))?.slice(TRIAL_COOKIE.length + 1) || "";
  const match = /^([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(cookie);
  let id = match?.[1];
  if (!id || !timingSafeEqual(Buffer.from(match[2], "hex"), Buffer.from(trialSign(id), "hex"))) {
    id = randomBytes(16).toString("hex");
    // Only for the trial allowance, never for analytics. Nothing identifying is in the cookie.
    res.setHeader("Set-Cookie", `${TRIAL_COOKIE}=${id}.${trialSign(id)}; Path=/; Max-Age=34560000; HttpOnly; Secure; SameSite=Lax`);
  }
  return createHash("sha256").update(id).digest("hex");
};
// A zero-cost lookup does not create a usage row. No new allowance on the next day.
export async function useFree(who, cost, checkedAt = new Date().toISOString()) {
  const r = await fetch(`${URL_}/rest/v1/rpc/use_trial_checks`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ who, cost, lim: FREE, cap: FREE_CAP, checked_at: checkedAt }),
  });
  if (!r.ok) throw new Error(`use_trial_checks ${r.status}`);
  const value = await r.json();
  if (!Number.isSafeInteger(value)) throw new Error("Invalid quota counter");
  return value;
}

export const amsterdamDay = (at = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(at);
export const amsterdamWeek = (at = new Date()) => {
  const date = new Date(amsterdamDay(at) + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
};
export async function allowanceOf(uid) {
  const day = amsterdamDay(), week = amsterdamWeek();
  const read = async (table, field, value) => {
    const r = await rest(`${table}?user_id=eq.${encodeURIComponent(uid)}&${field}=eq.${value}&select=n`);
    if (!r.ok) throw new Error("allowance_unavailable");
    const rows = await r.json();
    if (!Array.isArray(rows)) throw new Error("Invalid quota counter");
    const n = rows[0]?.n ?? 0;
    if (!Number.isSafeInteger(n) || n < 0) throw new Error("Invalid quota counter");
    return n;
  };
  const [dailyUsed, weeklyUsed] = await Promise.all([read("check_day_usage", "day", day), read("check_week_usage", "week", week)]);
  return { dailyUsed, weeklyUsed, day, week };
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
// The owner's overview (api/admin.js): every account's summary (admin_overview() in schema.sql) and the anonymous counts
// of the last `days` days. Throws when the database can't answer.
export async function adminData(days = 30) {
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const [a, b] = await Promise.all([
    rest("rpc/admin_overview", { method: "POST", body: "{}" }),
    rest(`usage_counts?select=day,ev,lvl,ui,n&day=gte.${since}&order=day.asc`),
  ]);
  if (!a.ok) throw new Error(`admin_overview ${a.status}`);
  return { users: await a.json(), counts: b.ok ? await b.json() : null };
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
// STRIPE_WEBHOOK_SECRET are set. Prices are fixed in cents so the offer and Checkout agree.
const SK = (process.env.STRIPE_SECRET_KEY || "").trim();
export const PRICE = (process.env.STRIPE_PRICE || "").trim();
export const HOOK = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
export const PRICE_B1 = (process.env.STRIPE_PRICE_B1 || "").trim();
export const PORTAL = (process.env.STRIPE_PORTAL_CONFIG || "").trim();
export const plusOn = !!(accounts && SK && PRICE && PRICE_B1 && HOOK);
export const PLANS = Object.freeze({ A2: { price: "9,99", amount: 999 }, B1: { price: "14,99", amount: 1499 } });
export const PLUS_PRICE = PLANS.A2.price; // compatibility with an older page's config
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

const productId = p => typeof p?.product === "string" ? p.product : p?.product?.id;
const matchesPrice = (p, level) => !!p && p.currency === "eur" && p.unit_amount === PLANS[level]?.amount &&
  p.recurring?.interval === "month" && p.recurring.interval_count === 1 && p.recurring.usage_type !== "metered";
let basePricePromise;
async function basePrice() {
  if (!basePricePromise) basePricePromise = stripe(`prices/${encodeURIComponent(PRICE)}`).then(p => {
    if (!matchesPrice(p, "A2") || !productId(p)) throw new Error("stripe a2_price_mismatch");
    return p;
  }).catch(e => { basePricePromise = null; throw e; });
  return basePricePromise;
}
// Configured Stripe prices are verified before Checkout: monthly EUR and the exact advertised amount.
// A2 and B1 are separate products: the portal requires unique billing intervals within a product.
export async function priceFor(level) {
  if (!Object.hasOwn(PLANS, level)) throw new Error("invalid_plan");
  const a2 = await basePrice();
  if (level === "B1" && !PRICE_B1) throw new Error("stripe b1_not_configured");
  const price = level === "A2" ? a2 : await stripe(`prices/${encodeURIComponent(PRICE_B1)}`);
  if (price.active === false || !matchesPrice(price, level) || !productId(price)) throw new Error("stripe price_mismatch");
  return price;
}
// Entitlements follow the actual recurring price, including changes made in Stripe's portal. Never trust a level
// posted by the browser or stale subscription metadata. No billing fields are added to client-writable progress.
export async function subscriptionLevel(sub) {
  const items = sub.items?.data || [];
  if (items.length !== 1 || items[0].quantity !== 1) return null;
  let price = items[0].price;
  if (typeof price === "string") price = await stripe(`prices/${encodeURIComponent(price)}`);
  return ["A2", "B1"].find(level => price?.id === (level === "A2" ? PRICE : PRICE_B1) && matchesPrice(price, level)) || null;
}
export const coversLevel = (p, level) => isPlus(p) && (p.level === "B1" || p.level === "A2" && level === "A2");
export async function plusFor(uid) {
  const p = await plusOf(uid);
  if (!isPlus(p)) return p && { ...p, level: null };
  const sub = await stripe(`subscriptions/${encodeURIComponent(p.sub)}`);
  if (sub.metadata?.uid !== uid || (typeof sub.customer === "string" ? sub.customer : sub.customer?.id) !== p.customer)
    throw new Error("stripe subscription_owner_mismatch");
  const end = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
  return { ...p, status: sub.status, until: end ? new Date(end * 1000).toISOString() : p.until,
    ends: !!(sub.cancel_at_period_end || sub.cancel_at), level: await subscriptionLevel(sub) };
}
// Only the preconfigured portal may confirm plan changes. Opening a session never changes a subscription itself.
export async function tierPortal() {
  if (!PORTAL) throw new Error("stripe portal_not_configured");
  const config = await stripe(`billing_portal/configurations/${encodeURIComponent(PORTAL)}?expand%5B%5D=features.subscription_update.products`);
  const update = config.features?.subscription_update;
  if (!config.active || !update?.enabled || !update.default_allowed_updates?.includes("price") ||
      ![PRICE, PRICE_B1].every(id => update.products?.some(p => p.prices.includes(id))))
    throw new Error("stripe portal_price_mismatch");
  return config.id;
}
// Keeps the row: true, "gone" when the user no longer exists (the account was deleted), false when it failed
export async function putPlus(row) {
  const r = await rest("plus", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row) });
  if (r.ok) return true;
  const j = await r.json().catch(() => ({}));
  return j.code === "23503" ? "gone" : false;
}
