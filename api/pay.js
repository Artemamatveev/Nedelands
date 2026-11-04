// Bittertalen Plus: POST /api/pay with "Authorization: Bearer <access token>"
//   {action:"checkout", period:"month"|"year"} -> {url}: Stripe Checkout, 7 days free the first time
//   {action:"portal"}                          -> {url}: Stripe's customer portal (card or bank, invoices, cancel)
// The page sends the learner to the url; Stripe sends them back to /?plus=ok (or /?plus=terug when they stopped).
// What they bought reaches us through the webhook (api/stripe.js), never through this return.
import { accounts, caller, sameOrigin, getPlan, plusRow } from "./_supa.js";
import { pay, stripe, PRICES, TRIAL_DAYS } from "./_stripe.js";

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
  try {
    // Already Plus, or asked for the portal: manage it there (never a second subscription)
    if (action === "portal" || (action === "checkout" && plusRow(plan))) {
      if (!plan?.customer) return res.status(409).json({ error: "no_customer" });
      const s = await stripe("billing_portal/sessions", { customer: plan.customer, return_url: `${base}/?plus=terug` });
      return res.status(200).json({ url: s.url });
    }
    if (action !== "checkout") return res.status(400).json({ error: "bad_action" });
    const period = req.body?.period === "year" ? "year" : "month";
    const s = await stripe("checkout/sessions", {
      mode: "subscription",
      line_items: [{ price: PRICES[period], quantity: 1 }],
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
