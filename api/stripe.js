// Stripe's webhook for Bittertalen Plus: POST /api/stripe, signed with STRIPE_WEBHOOK_SECRET.
// In Stripe: Developers → Webhooks → endpoint https://bittertalen.nl/api/stripe with the events
// checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted.
// Every event fetches the subscription again from Stripe, so events that arrive late or twice still leave the latest state.
import { accounts, putPlan, getPlan, planByCustomer } from "./_supa.js";
import { pay, stripe, verify, periodOf } from "./_stripe.js";

// The signature is over the raw body, so Vercel must not parse it first
export const config = { api: { bodyParser: false } };
const rawBody = (req) =>
  typeof req.body === "string" ? Promise.resolve(req.body)
    : Buffer.isBuffer(req.body) ? Promise.resolve(req.body.toString("utf8"))
    : new Promise((ok, no) => { const c = []; req.on("data", (d) => c.push(d)); req.on("end", () => ok(Buffer.concat(c).toString("utf8"))); req.on("error", no); });

const iso = (s) => (s ? new Date(s * 1000).toISOString() : null);

// Saves the subscription's current state on its user's row
export async function save(subId, hint = {}) {
  const sub = await stripe(`subscriptions/${encodeURIComponent(subId)}`);
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  let uid = sub.metadata?.user_id || hint.uid;
  const known = uid ? await getPlan(uid) : customer ? await planByCustomer(customer) : null;
  uid = uid || known?.user_id;
  if (!uid) return false;
  const end = sub.status === "trialing" && sub.trial_end ? sub.trial_end
    : sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  await putPlan({
    user_id: uid,
    customer,
    sub: sub.id,
    status: sub.status,
    period: periodOf(sub),
    ends_at: iso(end),
    cancel_at_end: !!(sub.cancel_at_period_end || sub.cancel_at),
    trial_used: !!(known?.trial_used || sub.trial_start),
  });
  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!accounts || !pay) return res.status(503).json({ error: "not_configured" });
  const raw = await rawBody(req).catch(() => "");
  if (!verify(raw, req.headers["stripe-signature"])) return res.status(400).json({ error: "bad_signature" });
  let ev;
  try { ev = JSON.parse(raw); } catch { return res.status(400).json({ error: "bad_json" }); }
  const o = ev.data?.object || {};
  try {
    if (ev.type === "checkout.session.completed" && o.mode === "subscription" && o.subscription) {
      await save(o.subscription, { uid: o.client_reference_id || o.metadata?.user_id });
    } else if (/^customer\.subscription\.(created|updated|deleted)$/.test(ev.type) && o.id) {
      await save(o.id);
    }
    return res.status(200).json({ received: true });
  } catch (e) {
    // a 500 makes Stripe send the event again later
    console.error(JSON.stringify({ event: "stripe_webhook_failed", type: ev.type, status: e.status, message: String(e.message).slice(0, 200) }));
    return res.status(500).json({ error: "failed" });
  }
}
