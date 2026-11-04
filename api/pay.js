// Bittertalen Plus: POST /api/pay with "Authorization: Bearer <access token>"
//   {action:"checkout", period:"month"|"year", tier:"A2"|"B1"} -> {url}: Stripe Checkout, 7 days free the first time
//   {action:"portal"}                          -> {url}: Stripe's customer portal (card or bank, invoices, cancel)
//   checkout while already Plus at another level -> {url}: the portal's own page to switch to that level's price
//   (Stripe settles the difference); at the same level -> the portal
// The page sends the learner to the url; Stripe sends them back to /?plus=ok (or /?plus=terug when they stopped).
// What they bought reaches us through the webhook (api/stripe.js), never through this return.
import { accounts, caller, sameOrigin, getPlan, plusRow } from "./_supa.js";
import { pay, stripe, priceFor, b1Priced, TRIAL_DAYS } from "./_stripe.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!accounts || !pay) return res.status(503).json({ error: "not_configured" });
  const user = await caller(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "login" });
  const base = `https://${req.headers.host}`;
  let plan;
  try { plan = await getPlan(user.id); } catch { return res.status(502).json({ error: "failed" }); }
  const action = req.body?.action;
  const period = req.body?.period === "year" ? "year" : "month";
  const tier = req.body?.tier === "B1" && b1Priced ? "B1" : "A2";
  try {
    // Already Plus, or asked for the portal: manage it there (never a second subscription)
    if (action === "portal" || (action === "checkout" && plusRow(plan))) {
      if (!plan?.customer) return res.status(409).json({ error: "no_customer" });
      const params = { customer: plan.customer, return_url: `${base}/?plus=terug` };
      // another level: straight to the portal's confirmation of the new price
      if (action === "checkout" && plan.sub && (plan.tier || "A2") !== tier) {
        const sub = await stripe(`subscriptions/${encodeURIComponent(plan.sub)}`);
        const item = sub.items?.data?.[0]?.id;
        if (item) params.flow_data = { type: "subscription_update_confirm", after_completion: { type: "redirect", redirect: { return_url: `${base}/?plus=ok` } },
          subscription_update_confirm: { subscription: plan.sub, items: [{ id: item, price: priceFor(tier, period), quantity: 1 }] } };
      }
      const s = await stripe("billing_portal/sessions", params);
      return res.status(200).json({ url: s.url });
    }
    if (action !== "checkout") return res.status(400).json({ error: "bad_action" });
    const s = await stripe("checkout/sessions", {
      mode: "subscription",
      line_items: [{ price: priceFor(tier, period), quantity: 1 }],
      client_reference_id: user.id,
      ...(plan?.customer ? { customer: plan.customer } : user.email ? { customer_email: user.email } : {}),
      subscription_data: { metadata: { user_id: user.id }, ...(plan?.trial_used ? {} : { trial_period_days: TRIAL_DAYS }) },
      metadata: { user_id: user.id },
      allow_promotion_codes: "true",
      locale: "nl",
      success_url: `${base}/?plus=ok`,
      cancel_url: `${base}/?plus=terug`,
    });
    return res.status(200).json({ url: s.url });
  } catch (e) {
    console.error(JSON.stringify({ event: "pay_failed", action, status: e.status, type: e.type }));
    return res.status(502).json({ error: "failed" });
  }
}
