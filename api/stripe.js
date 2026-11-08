// Stripe's webhook: Dashboard → Developers → Webhooks → endpoint https://bittertalen.nl/api/stripe with the events
// customer.subscription.created, .updated and .deleted; its signing secret is STRIPE_WEBHOOK_SECRET.
// Keeps the user's row of `plus` (schema.sql) up to date. The subscription is read again from Stripe every time, so an
// event that comes late or twice can't leave an old state behind.
import { createHmac, timingSafeEqual } from "node:crypto";
import { plusOn, HOOK, stripe, plusOf, putPlus, isPlus, LIVE } from "./_supa.js";

// The signature is over the exact bytes Stripe sent, so Vercel must not parse the body
export const config = { api: { bodyParser: false } };

// Stripe-Signature: t=<seconds>,v1=<hex hmac-sha256 of "t.body">; at most 5 minutes old
const signed = (raw, head) => {
  const parts = String(head || "").split(","), t = (parts.find((p) => p.startsWith("t=")) || "").slice(2);
  if (!t || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const want = createHmac("sha256", HOOK).update(`${t}.${raw}`).digest();
  return parts.filter((p) => p.startsWith("v1=")).some((p) => {
    const got = Buffer.from(p.slice(3), "hex");
    return got.length === want.length && timingSafeEqual(got, want);
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!plusOn) return res.status(503).json({ error: "not_configured" });
  const chunks = [];
  let n = 0;
  for await (const c of req) {
    if ((n += c.length) > 1e6) return res.status(413).json({ error: "too_large" });
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!signed(raw, req.headers["stripe-signature"])) return res.status(400).json({ error: "signature" });
  let ev;
  try { ev = JSON.parse(raw); } catch { return res.status(400).json({ error: "bad_request" }); }
  if (!/^customer\.subscription\./.test(ev.type || "")) return res.status(200).json({ ok: true });
  try {
    const sub = await stripe(`subscriptions/${encodeURIComponent(ev.data.object.id)}`);
    const uid = sub.metadata && sub.metadata.uid;
    if (!uid) return res.status(200).json({ ok: true }); // not made by api/plus.js
    // An old subscription that ends must not hide a newer one that runs
    const old = await plusOf(uid);
    if (old && old.sub !== sub.id && isPlus(old) && !LIVE.has(sub.status)) return res.status(200).json({ ok: true });
    // Since Stripe's API of 2025 the period's end is on the item
    const end = sub.current_period_end || (sub.items && sub.items.data && sub.items.data[0] && sub.items.data[0].current_period_end);
    const kept = await putPlus({
      user_id: uid,
      customer: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      sub: sub.id,
      status: sub.status,
      until: end ? new Date(end * 1000).toISOString() : null,
      ends: !!(sub.cancel_at_period_end || sub.cancel_at),
      updated_at: new Date().toISOString(),
    });
    // The account was deleted in between: stop the subscription too
    if (kept === "gone") {
      if (sub.status !== "canceled") await stripe(`subscriptions/${encodeURIComponent(sub.id)}`, null, "DELETE");
      return res.status(200).json({ ok: true });
    }
    if (!kept) return res.status(500).json({ error: "failed" }); // Stripe tries again later
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ error: "failed" });
  }
}
