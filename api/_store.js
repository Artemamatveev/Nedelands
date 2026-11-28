// Purchases in the App Store and Google Play, through RevenueCat (https://www.revenuecat.com): the store apps buy with
// the RevenueCat plugin under the learner's account id (Purchases.logIn), and this server works out what those
// purchases give from RevenueCat's own record of the customer, never from what the app or a webhook says.
// - REVENUECAT_SECRET: RevenueCat's secret API key (v1, sk_…), server only. REVENUECAT_WEBHOOK_AUTH: the value set as the
//   webhook's authorization header in RevenueCat (the webhook: https://bittertalen.nl/api/store, a rewrite to
//   api/stripe.js). REVENUECAT_IOS_KEY / REVENUECAT_ANDROID_KEY: the public app keys (appl_… / goog_…), sent to the app.
// - STORE_SANDBOX=0 ignores sandbox purchases (TestFlight, App Review, Play's test track); on by default, because Apple's
//   reviewer buys in the sandbox and must see Plus.
// The products, the same identifiers in both stores (Google's subscriptions come back as "plus_a2:<base plan>").
import { createHash, timingSafeEqual } from "node:crypto";
import { storeOn, putStore, dropStore, PASS_DAYS, YEAR_DAYS } from "./_supa.js";

export const STORE_PRODUCTS = Object.freeze({
  plus_a2: { level: "A2", kind: "sub" }, plus_b1: { level: "B1", kind: "sub" },
  pass_a2: { level: "A2", kind: "pass" }, pass_b1: { level: "B1", kind: "pass" },
  year_a2: { level: "A2", kind: "year" }, year_b1: { level: "B1", kind: "year" },
});
const SECRET = (process.env.REVENUECAT_SECRET || "").trim();
const HOOK = (process.env.REVENUECAT_WEBHOOK_AUTH || "").trim();
export const STORE_KEYS = Object.freeze({ ios: (process.env.REVENUECAT_IOS_KEY || "").trim(), android: (process.env.REVENUECAT_ANDROID_KEY || "").trim() });
const SANDBOX = process.env.STORE_SANDBOX !== "0";
const RC_MS = 8000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const productOf = (id) => STORE_PRODUCTS[String(id || "").split(":")[0].toLowerCase()] || null;
const RANK = { A2: 1, B1: 2 };

// RevenueCat's customer record (GET /v1/subscribers/{id}): its `subscriber`, or throws
export async function rcCustomer(uid) {
  const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    headers: { authorization: `Bearer ${SECRET}`, accept: "application/json" }, signal: AbortSignal.timeout(RC_MS) });
  if (!r.ok) throw new Error(`revenuecat ${r.status}`);
  return (await r.json()).subscriber || {};
}
// After the account is deleted: RevenueCat forgets the customer too (best effort; Apple and Google keep their records)
export async function rcDelete(uid) {
  if (!storeOn || !UUID.test(uid)) return;
  await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(uid)}`, {
    method: "DELETE", headers: { authorization: `Bearer ${SECRET}` }, signal: AbortSignal.timeout(RC_MS) }).catch(() => null);
}

// The best access a customer's purchases give at `now`: {level, kind, store, until, ends} or null.
// A subscription runs until its expiry (or the end of the store's grace period) unless refunded. A pass gives PASS_DAYS
// (a Jaarpas YEAR_DAYS) from its purchase; a pass bought while one of the same level runs follows on from it, as on the
// website. Refunded one-time purchases are no longer in RevenueCat's list. B1 wins over A2, then the longest.
export function storeAccess(sub, now = Date.now(), sandbox = SANDBOX) {
  const out = [];
  for (const [id, s] of Object.entries(sub?.subscriptions || {})) {
    const P = productOf(id);
    if (!P || P.kind !== "sub" || !s || s.refunded_at || (!sandbox && s.is_sandbox)) continue;
    const end = Math.max(Date.parse(s.expires_date || "") || 0, Date.parse(s.grace_period_expires_date || "") || 0);
    if (end > now) out.push({ level: P.level, kind: "sub", store: String(s.store || ""), until: new Date(end).toISOString(), ends: !!s.unsubscribe_detected_at });
  }
  const chains = {};
  for (const [id, list] of Object.entries(sub?.non_subscriptions || {})) {
    const P = productOf(id);
    if (!P || P.kind === "sub" || !Array.isArray(list)) continue;
    for (const b of list) {
      const at = Date.parse(b?.purchase_date || "");
      if (!at || b.refunded_at || (!sandbox && b.is_sandbox)) continue;
      (chains[P.level] ||= []).push({ at, kind: P.kind, store: String(b.store || "") });
    }
  }
  for (const [level, list] of Object.entries(chains)) {
    let until = 0, last = null;
    for (const b of list.sort((x, y) => x.at - y.at)) {
      until = Math.max(b.at, until) + (b.kind === "year" ? YEAR_DAYS : PASS_DAYS) * 864e5;
      last = b;
    }
    if (until > now) out.push({ level, kind: last.kind, store: last.store, until: new Date(until).toISOString(), ends: true });
  }
  out.sort((a, b) => RANK[b.level] - RANK[a.level] || Date.parse(b.until) - Date.parse(a.until));
  return out[0] || null;
}

// Reads RevenueCat's record again and keeps the user's row of `store_plus`: the access, or null when there is none
export async function syncStore(uid) {
  if (!storeOn || !UUID.test(uid)) return null;
  const access = storeAccess(await rcCustomer(uid));
  if (!access) { await dropStore(uid); return null; }
  const kept = await putStore({ user_id: uid, ...access });
  if (kept === false) throw new Error("store_plus_write");
  return kept === "gone" ? null : access;
}

// RevenueCat's webhook: POST /api/store with the authorization header set in RevenueCat. Any event (a purchase, renewal,
// cancellation, refund, expiry or transfer) makes the server read the customer again, so a late or repeated event can't
// leave an old state behind. Answers 500 when the record can't be read, so RevenueCat sends it again.
const digest = (s) => createHash("sha256").update(String(s)).digest();
export const hookAuthorized = (head) => !!HOOK && timingSafeEqual(digest(head || ""), digest(HOOK));
export async function storeHook(raw, head, res) {
  if (!storeOn) return res.status(503).json({ error: "not_configured" });
  if (!hookAuthorized(head)) return res.status(401).json({ error: "unauthorized" });
  let ev;
  try { ev = JSON.parse(raw).event || {}; } catch { return res.status(400).json({ error: "bad_request" }); }
  if (ev.type === "TEST") return res.status(200).json({ ok: true });
  const ids = [...new Set([ev.app_user_id, ev.original_app_user_id, ...(ev.aliases || []), ...(ev.transferred_from || []), ...(ev.transferred_to || [])]
    .filter((x) => UUID.test(String(x || ""))))].slice(0, 6);
  try {
    for (const uid of ids) await syncStore(uid);
  } catch (e) {
    console.error("store_hook", e?.message);
    return res.status(500).json({ error: "failed" });
  }
  return res.status(200).json({ ok: true });
}
