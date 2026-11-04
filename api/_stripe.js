import { createHmac, timingSafeEqual } from "node:crypto";
// Stripe by plain fetch (no SDK, so no new dependency): Checkout for Bittertalen Plus, the customer portal, and the
// webhook's signature. Files starting with _ are not routes on Vercel.
// Env vars (Vercel project settings; never in the repository or the chat):
//   STRIPE_SECRET_KEY      sk_test_… or sk_live_…
//   STRIPE_WEBHOOK_SECRET  whsec_… of the endpoint https://bittertalen.nl/api/stripe
//   STRIPE_PRICE_MONTH     price_… €9,99 a month
//   STRIPE_PRICE_YEAR      price_… €99,90 a year
// Without all four, payments are off and the app behaves as before (everything free within the daily limits).
const KEY = (process.env.STRIPE_SECRET_KEY || "").trim();
const HOOK = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
export const PRICES = {
  month: (process.env.STRIPE_PRICE_MONTH || "").trim(),
  year: (process.env.STRIPE_PRICE_YEAR || "").trim(),
};
export const pay = !!(KEY && HOOK && PRICES.month && PRICES.year);
export const TRIAL_DAYS = 7;
// What counts as Plus: paying, in the trial, or a failed renewal that Stripe is still retrying
export const PLUS = ["active", "trialing", "past_due"];

// Stripe's form encoding: {a:{b:[1]}} -> a[b][0]=1
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
    headers: { authorization: `Bearer ${KEY}`, ...(params ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: params ? form(params) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(`stripe ${path} ${r.status}`), { status: r.status, type: j.error?.type });
  return j;
}

// Checks the Stripe-Signature header (t=…,v1=…) against the raw body; events older than 5 minutes are refused
export function verify(raw, header, secret = HOOK, now = Date.now()) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(String(header).split(",").map((p) => p.split("=")).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v.trim()]));
  const t = Number(parts.t);
  const sigs = String(header).split(",").filter((p) => p.trim().startsWith("v1=")).map((p) => p.trim().slice(3));
  if (!Number.isFinite(t) || !sigs.length || Math.abs(now / 1000 - t) > 300) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex"));
  return sigs.some((s) => { const b = Buffer.from(s); return b.length === want.length && timingSafeEqual(b, want); });
}

// The period of a subscription from its price
export const periodOf = (sub) => {
  const price = sub?.items?.data?.[0]?.price;
  return price?.id === PRICES.year || price?.recurring?.interval === "year" ? "year" : "month";
};
