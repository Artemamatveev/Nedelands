import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
// Supabase from the server, by plain fetch (no SDK): who is calling, the daily check allowance, deleting an account.
// Files starting with _ are not routes on Vercel. The env vars come from the Supabase integration in the Vercel
// Marketplace; without them accounts and paid grading are unavailable.
const URL_ = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const ANON = (process.env.SUPABASE_ANON_KEY || "").trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export const accounts = !!(URL_ && ANON && SERVICE);
// Every call to Supabase and Stripe gives up after FETCH_MS: a hanging database must not keep the function running
// until Vercel kills it, because then a check already taken is never given back.
const FETCH_MS = 8000;
const fetch = (url, init = {}) => globalThis.fetch(url, { signal: AbortSignal.timeout(FETCH_MS), ...init });
export const supaUrl = URL_;
export const anonKey = ANON;
// What one paying learner may cost on top of PLUS_LIMIT a day: PLUS_MONTH checks a month (default 200) and OPUS_MONTH
// proefexamens a month graded by the exam model (default 8; after that the practice model grades them). An Examenpas
// counts over its whole term instead: PASS_TOTAL checks (default 250) and PASS_OPUS exams on the exam model (default 15).
// 25 November 2026: a daily exam-model limit (2) let one learner run 60 exams a month, more than the plan earns.
export const PLUS_MONTH = Math.max(1, parseInt(process.env.PLUS_MONTH, 10) || 200);
// A conversation with Plus (the better model, up to 16 calls) takes TALK_PLUS checks of the day and of the month; a free
// conversation (the cheap model) takes one. The user's choice, 25 November 2026: a Plus conversation cost about EUR 0.25.
export const TALK_PLUS = Math.max(1, parseInt(process.env.TALK_PLUS_CHECKS, 10) || 3);
export const OPUS_MONTH = Math.max(0, parseInt(process.env.OPUS_MONTH ?? "8", 10) || 0);
export const PASS_TOTAL = Math.max(1, parseInt(process.env.PASS_TOTAL, 10) || 250);
export const PASS_OPUS = Math.max(0, parseInt(process.env.PASS_OPUS ?? "15", 10) || 0);
// A counter of table ai_guard (use_guard() in schema.sql): what is left, -1 when over; throws when unavailable
export async function useGuard(k, day, cost, lim) {
  const r = await fetch(`${URL_}/rest/v1/rpc/use_guard`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ g_k: String(k).slice(0, 80), g_day: day, cost, lim }),
  });
  if (!r.ok) throw new Error(`use_guard ${r.status}`);
  const value = await r.json();
  if (!Number.isSafeInteger(value)) throw new Error("Invalid guard counter");
  return value;
}
export const monthOf = (at = new Date()) => amsterdamDay(at).slice(0, 8) + "01";
// Free account checks in all (once, not per week), shared by the levels not covered by Plus.
export const LIMIT = Math.max(1, parseInt(process.env.FREE_ACCOUNT_CHECKS, 10) || 7);
// The lifetime bucket of check_week_usage (see the free_total_checks migration)
export const ONCE_BUCKET = "2000-01-03";
// With Bittertalen Plus (a Stripe subscription, see below) PLUS_LIMIT a day instead
export const PLUS = Math.max(1, parseInt(process.env.PLUS_LIMIT, 10) || 20); // 20 a day spreads PLUS_MONTH over at least ten days
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
export async function useChecks(uid, cost, lim = LIMIT, period = "once", checkedAt = new Date().toISOString()) {
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
// A conversation with Claude (api/_talk.js) is paid once, at its start; the signed ticket it gets then lets the next
// turns through without taking another check. The secret never leaves the server.
export const talkSign = s => createHmac("sha256", SERVICE).update("bittertalen-talk|" + s).digest("base64url");
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
  const [dailyUsed, weeklyUsed, totalUsed] = await Promise.all([read("check_day_usage", "day", day), read("check_week_usage", "week", week), read("check_week_usage", "week", ONCE_BUCKET)]);
  return { dailyUsed, weeklyUsed, totalUsed, day, week };
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
  const [a, b, c] = await Promise.all([
    rest("rpc/admin_overview", { method: "POST", body: "{}" }),
    rest(`usage_counts?select=day,ev,lvl,ui,n&day=gte.${since}&order=day.asc`),
    rest(`ai_spend?select=day,model,calls,input,output,cache_read,cache_write&day=gte.${since}&order=day.desc`),
  ]);
  if (!a.ok) throw new Error(`admin_overview ${a.status}`);
  return { users: await a.json(), counts: b.ok ? await b.json() : null, spend: c.ok ? await c.json() : null };
}
// Claude's tokens for one grading call, added to today's row for that model (table ai_spend, add_ai_spend() in
// supabase/schema.sql). Only totals per day and model: no account, answer or IP.
export async function addSpend(model, usage) {
  if (!accounts || !model || !usage) return false;
  const n = (v) => Math.max(0, Math.round(Number(v) || 0));
  const r = await rest("rpc/add_ai_spend", {
    method: "POST",
    body: JSON.stringify({
      s_model: String(model).slice(0, 80), s_in: n(usage.input_tokens), s_out: n(usage.output_tokens),
      s_cache_read: n(usage.cache_read_input_tokens), s_cache_write: n(usage.cache_creation_input_tokens),
    }),
  });
  return r.ok;
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
// Withdrawal (herroeping, EU consumer law art. 11a since 19 June 2026): what the learner bought in the last 14 days that
// can still be withdrawn; recordWithdrawal() keeps the statement (table withdrawals, migration 20261125200000) and ends a
// pass at once. The owner refunds from Stripe's dashboard within 14 days (docs/server.md).
export const WITHDRAW_DAYS = 14;
export async function recentPasses(uid) {
  const since = new Date(Date.now() - WITHDRAW_DAYS * 864e5).toISOString();
  const r = await rest(`exam_pass?user_id=eq.${encodeURIComponent(uid)}&created_at=gt.${encodeURIComponent(since)}&until=gt.${encodeURIComponent(new Date().toISOString())}&select=session,level,created_at`);
  if (!r.ok) throw new Error(`exam_pass ${r.status}`);
  return r.json();
}
export async function recordWithdrawal(row) {
  const r = await rest("withdrawals", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify(row) });
  if (!r.ok) throw new Error(`withdrawals ${r.status}`);
}
export async function endPass(session) {
  const r = await rest(`exam_pass?session=eq.${encodeURIComponent(session)}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ until: new Date().toISOString() }) });
  if (!r.ok) throw new Error(`exam_pass ${r.status}`);
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
// The Examenpas: one payment (no subscription) for PASS_DAYS of the same checks as Plus at its level. Off unless both
// one-time prices are set (STRIPE_PRICE_PASS_A2, STRIPE_PRICE_PASS_B1). A purchase is a row of `exam_pass`, keyed by
// the Checkout session, so the same webhook twice can't add days twice.
// 91 days (13 weeks), so one pass costs clearly less than three months of Plus and lasts until most learners' exam
export const PASS_DAYS = 91;
// EUR 29,99 / 39,99 since 25 November 2026 (19,99 / 24,99 before: 600 checks for EUR 16 net could cost more than it earned)
export const PASSES = Object.freeze({ A2: { price: "29,99", amount: 2999 }, B1: { price: "39,99", amount: 3999 } });
export const PASS_PRICE = Object.freeze({ A2: (process.env.STRIPE_PRICE_PASS_A2 || "").trim(), B1: (process.env.STRIPE_PRICE_PASS_B1 || "").trim() });
export const passOn = plusOn && !!(PASS_PRICE.A2 && PASS_PRICE.B1);
// The Jaarpas: the same as the Examenpas for YEAR_DAYS, one payment, never renewed (a yearly subscription that renews
// itself for another year can't be sold to consumers in the Netherlands; the user's choice of prices, 25 November 2026).
// Off unless STRIPE_PRICE_YEAR_A2 and STRIPE_PRICE_YEAR_B1 are set. Its rows in `exam_pass` have a session key "y:cs_…".
export const YEAR_DAYS = 365;
export const YEARS = Object.freeze({ A2: { price: "79,99", amount: 7999 }, B1: { price: "119,99", amount: 11999 } });
export const YEAR_PRICE = Object.freeze({ A2: (process.env.STRIPE_PRICE_YEAR_A2 || "").trim(), B1: (process.env.STRIPE_PRICE_YEAR_B1 || "").trim() });
export const yearOn = plusOn && !!(YEAR_PRICE.A2 && YEAR_PRICE.B1);
// kind "pass" (Examenpas) or "year" (Jaarpas): its days, amounts, Stripe prices, whether it is on, and its key prefix
export const PASS_KINDS = Object.freeze({
  pass: { days: PASS_DAYS, plans: PASSES, ids: PASS_PRICE, on: () => passOn, key: "" },
  year: { days: YEAR_DAYS, plans: YEARS, ids: YEAR_PRICE, on: () => yearOn, key: "y:" },
});
// A configured one-time EUR price with exactly the advertised amount, for that level and kind only
export const matchesPass = (p, level, kind = "pass") => { const K = PASS_KINDS[kind];
  return !!p && !!K && Object.hasOwn(K.plans, level) && p.id === K.ids[level] &&
    p.active !== false && p.currency === "eur" && p.unit_amount === K.plans[level].amount && !p.recurring };
export async function passPrice(level, kind = "pass") {
  const K = PASS_KINDS[kind];
  if (!K || !K.on() || !Object.hasOwn(K.plans, level)) throw new Error("invalid_plan");
  const price = await stripe(`prices/${encodeURIComponent(K.ids[level])}`);
  if (!matchesPass(price, level, kind)) throw new Error("stripe pass_price_mismatch");
  return price;
}
// The user's running pass: the highest level still valid, and until when; or null
export async function passOf(uid) {
  const now = new Date().toISOString();
  const r = await rest(`exam_pass?user_id=eq.${encodeURIComponent(uid)}&until=gt.${encodeURIComponent(now)}&select=session,level,until&order=until.desc`);
  if (!r.ok) throw new Error(`exam_pass ${r.status}`);
  const rows = await r.json();
  const level = rows.some((x) => x.level === "B1") ? "B1" : rows.length ? "A2" : null;
  if (!level) return null;
  const row = rows.filter((x) => x.level === level)[0];
  return { level, until: row.until, kind: String(row.session || "").startsWith("y:") ? "year" : "pass" };
}
// One purchase; true when kept (or already kept), "gone" when the account no longer exists
export async function putPass(row) {
  const r = await rest("exam_pass", { method: "POST", headers: { prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(row) });
  if (r.ok) return true;
  const j = await r.json().catch(() => ({}));
  return j.code === "23503" ? "gone" : false;
}
// What the user may use now: the subscription, or a running Examenpas when it covers more
// cached: a check or a conversation may use Stripe's answer of the last few minutes (SUB_MS); the Plus screen never does
export async function plusFor(uid, cached = false) {
  const sub = await subscriptionFor(uid, cached);
  const pass = passOn ? await passOf(uid).catch(() => null) : null;
  const subLevel = isPlus(sub) ? sub.level : null;
  let best = !pass || subLevel === "B1" || subLevel === pass.level ? sub
    : { ...(sub || {}), status: "active", until: pass.until, ends: true, level: pass.level, pass: true, ...(pass.kind === "year" ? { year: true } : {}) };
  // A school's or employer's group (api/group.js) gives the same checks until its end date, when it covers more
  const group = await groupOf(uid).catch(() => null);
  const bestLevel = isPlus(best) ? best.level : null;
  if (group && bestLevel !== "B1" && bestLevel !== group.level)
    best = { ...(best || {}), status: "active", until: `${group.until}T23:59:59+01:00`, ends: true, level: group.level, pass: true, group: group.name };
  return best;
}
// Stripe's answer is kept a few minutes per warm function (SUB_MS), so a check doesn't wait for Stripe every time. If Stripe
// can't be reached, a subscription the webhook stored as running still counts, at A2 (the stored row has no level), so a
// paying learner is never downgraded to the free model by Stripe's outage; logged.
const SUB_MS = 5 * 60e3, subSeen = new Map();
async function subscriptionFor(uid, cached) {
  const p = await plusOf(uid);
  if (!isPlus(p)) return p && { ...p, level: null };
  const seen = cached && subSeen.get(uid);
  if (seen && seen.sub === p.sub && Date.now() - seen.at < SUB_MS) return { ...p, ...seen.v };
  let sub;
  try { sub = await stripe(`subscriptions/${encodeURIComponent(p.sub)}`) }
  catch (e) {
    if (/owner_mismatch/.test(e?.message)) throw e;
    console.error("stripe_unreachable", e?.message);
    return { ...p, level: "A2", stored: true };
  }
  if (sub.metadata?.uid !== uid || (typeof sub.customer === "string" ? sub.customer : sub.customer?.id) !== p.customer)
    throw new Error("stripe subscription_owner_mismatch");
  const end = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
  const v = { status: sub.status, until: end ? new Date(end * 1000).toISOString() : p.until,
    ends: !!(sub.cancel_at_period_end || sub.cancel_at), level: await subscriptionLevel(sub) };
  if (subSeen.size > 500) subSeen.clear();
  subSeen.set(uid, { at: Date.now(), sub: p.sub, v });
  return { ...p, ...v };
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

// Invite a friend (table referrals, schema.sql): 3 extra free checks for both, at most 10 friends per inviter. A code can
// only be claimed by an account made in the last REF_DAYS days, so old accounts can't swap codes.
export const REF_DAYS = 14;
const rpcCall = async (name, body) => {
  const r = await rest(`rpc/${name}`, { method: "POST", body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${name} ${r.status}`);
  return r.json();
};
export async function bonusFor(uid) {
  const rows = await rpcCall("referral_bonus", { uid });
  const n = Array.isArray(rows) ? rows[0]?.bonus : rows?.bonus;
  return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}
export async function referralOf(uid) {
  const [code, rows] = await Promise.all([rpcCall("referral_code", { uid }), rpcCall("referral_bonus", { uid })]);
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (typeof code !== "string") throw new Error("Invalid referral code");
  return { code, invited: row?.invited | 0, bonus: row?.bonus | 0 };
}
export async function claimReferral(user, code) {
  if (!/^[A-HJ-NP-Z2-9]{8}$/i.test(String(code || ""))) return "unknown";
  const made = Date.parse(user.created_at || "");
  if (!(made > Date.now() - REF_DAYS * 864e5)) return "old";
  return rpcCall("claim_referral", { uid: user.id, ref: String(code).toUpperCase() });
}

// Groups for schools and employers (tables groups and group_members, schema.sql): a code gives the Plus checks of the
// group's level until its end date; the teacher sees the members' practice (api/group.js, docent.html).
export async function groupOf(uid) {
  const rows = await rpcCall("group_access", { uid });
  const g = Array.isArray(rows) ? rows[0] : null;
  return g && (g.level === "A2" || g.level === "B1") ? { name: String(g.name), level: g.level, until: String(g.until) } : null;
}
export const GROUP_RE = /^[A-HJ-NP-Z2-9]{8}$/i;
export async function joinGroup(uid, code) {
  if (!GROUP_RE.test(String(code || ""))) return "unknown";
  return rpcCall("join_group", { uid, ref: String(code).toUpperCase() });
}
export const makeGroup = (g) => rpcCall("make_group", { g_name: g.name, g_level: g.level, g_seats: g.seats, g_until: g.until, g_teacher: g.teacher });
export const groupList = () => rpcCall("group_list", {});
export const teacherOverview = (mail) => rpcCall("teacher_overview", { mail });
