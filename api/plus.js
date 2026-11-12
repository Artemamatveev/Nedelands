// Bittertalen Plus, a monthly subscription: more Claude checks a day (PLUS_LIMIT). Needs a logged-in user.
// POST {go:"buy",level:"A2"|"B1"} -> {url}: Checkout, or a confirmed upgrade of the existing subscription.
// GET -> {plus:{status,until,ends,level}|null}: current entitlement, checked against Stripe's actual monthly price.
// POST {go:"manage"} -> {url}: Stripe's customer portal (cancel, payment method, invoices)
// Both pages are Stripe's own; the page only goes there and back (/?plus=ok, stop or back). Stripe tells api/stripe.js
// when the subscription starts, renews or ends, and the page reads its own row of `plus`.
import { caller, sameOrigin, plusOn, plusOf, plusFor, isPlus, stripe, priceFor, tierPortal, PORTAL, PLANS } from "./_supa.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (req.method === "POST" && !sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!plusOn) return res.status(503).json({ error: "not_configured" });
  const user = await caller(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "login" });
  if (req.method === "GET") {
    try {
      const p = await plusFor(user.id);
      return res.status(200).json({ plus: p ? { status: p.status, until: p.until, ends: p.ends, level: p.level } : null });
    } catch { return res.status(502).json({ error: "failed" }); }
  }
  const go = req.body && req.body.go;
  if (go !== "buy" && go !== "manage") return res.status(400).json({ error: "bad_request" });
  const level = req.body.level ?? "A2"; // old pages buy A2, never the more expensive plan implicitly
  if (!Object.hasOwn(PLANS, level)) return res.status(400).json({ error: "invalid_plan" });
  const site = `https://${req.headers.host}`;
  const p = await plusOf(user.id).catch(() => undefined);
  if (p === undefined) return res.status(502).json({ error: "failed" });
  try {
    if (go === "manage" || p && p.status !== "canceled") {
      if (!p || !p.customer) return res.status(404).json({ error: "none" });
      const extra = {};
      // The user confirms this on Stripe's page. No subscription update/charge occurs in this endpoint.
      if (go === "buy" && level === "B1" && isPlus(p)) {
        const current = await plusFor(user.id);
        if (current.level === "A2") {
          const sub = await stripe(`subscriptions/${encodeURIComponent(p.sub)}`), price = await priceFor("B1");
          extra.configuration = await tierPortal();
          extra.flow_data = { type: "subscription_update_confirm", subscription_update_confirm: {
            subscription: p.sub, items: [{ id: sub.items.data[0].id, price: price.id, quantity: 1 }] },
            after_completion: { type: "redirect", redirect: { return_url: `${site}/?plus=ok&plan=${level}` } } };
        }
      }
      const s = await stripe("billing_portal/sessions", { customer: p.customer, return_url: `${site}/?plus=back`, locale: "auto", ...(PORTAL ? { configuration: PORTAL } : {}), ...extra });
      return res.status(200).json({ url: s.url });
    }
    const price = await priceFor(level);
    const s = await stripe("checkout/sessions", {
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      // the same Stripe customer again after a cancelled subscription, so their invoices stay together
      ...(p && p.customer ? { customer: p.customer } : user.email ? { customer_email: user.email } : {}),
      client_reference_id: user.id,
      subscription_data: { metadata: { uid: user.id, level } }, // ownership only; entitlement follows the actual price
      locale: "auto",
      success_url: `${site}/?plus=ok&plan=${level}`,
      cancel_url: `${site}/?plus=stop`,
      // the terms must be ticked; needs the terms URL in Stripe (Settings → Public details), so only with STRIPE_TERMS=1
      ...(process.env.STRIPE_TERMS === "1" ? { consent_collection: { terms_of_service: "required" } } : {}),
    });
    return res.status(200).json({ url: s.url });
  } catch (e) {
    console.error(e.message);
    return res.status(502).json({ error: "failed" });
  }
}
