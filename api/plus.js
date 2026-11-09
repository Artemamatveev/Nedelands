// Bittertalen Plus, a monthly subscription: more Claude checks a day (PLUS_LIMIT). Needs a logged-in user.
// POST {go:"buy"} -> {url}: a Stripe Checkout page for STRIPE_PRICE (or the portal, when Plus already runs)
// POST {go:"manage"} -> {url}: Stripe's customer portal (cancel, payment method, invoices)
// Both pages are Stripe's own; the page only goes there and back (/?plus=ok, stop or back). Stripe tells api/stripe.js
// when the subscription starts, renews or ends, and the page reads its own row of `plus`.
import { caller, sameOrigin, plusOn, plusOf, isPlus, stripe, PRICE } from "./_supa.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!plusOn) return res.status(503).json({ error: "not_configured" });
  const user = await caller(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "login" });
  const go = req.body && req.body.go;
  if (go !== "buy" && go !== "manage") return res.status(400).json({ error: "bad_request" });
  const site = `https://${req.headers.host}`;
  const p = await plusOf(user.id).catch(() => undefined);
  if (p === undefined) return res.status(502).json({ error: "failed" });
  try {
    if (go === "manage" || isPlus(p)) {
      if (!p || !p.customer) return res.status(404).json({ error: "none" });
      const s = await stripe("billing_portal/sessions", { customer: p.customer, return_url: `${site}/?plus=back`, locale: "nl" });
      return res.status(200).json({ url: s.url });
    }
    const s = await stripe("checkout/sessions", {
      mode: "subscription",
      line_items: [{ price: PRICE, quantity: 1 }],
      // the same Stripe customer again after a cancelled subscription, so their invoices stay together
      ...(p && p.customer ? { customer: p.customer } : user.email ? { customer_email: user.email } : {}),
      client_reference_id: user.id,
      subscription_data: { metadata: { uid: user.id } }, // how api/stripe.js knows whose subscription it is
      locale: "nl",
      success_url: `${site}/?plus=ok`,
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
