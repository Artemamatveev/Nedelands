// Bittertalen Plus, a monthly subscription: more Claude checks a day (PLUS_LIMIT). Needs a logged-in user.
// POST {go:"buy",level:"A2"|"B1"} -> {url}: Checkout, or a confirmed upgrade of the existing subscription.
// GET -> {plus:{status,until,ends,level}|null}: current entitlement, checked against Stripe's actual monthly price.
// POST {go:"manage"} -> {url}: Stripe's customer portal (cancel, payment method, invoices)
// POST {go:"store"} -> {plus}: after a purchase or a restore in the store apps, reads RevenueCat's record now (the
//   webhook may come later) and answers like GET (api/_store.js). Purchases in the stores are managed there, not here.
// POST {go:"withdraw"} -> {withdrawn:[…], at}: the withdrawal button (herroeping, art. 11a of the consumer rights
//   directive): within 14 days of buying, ends the subscription and the pass at once, keeps the statement and shows its
//   confirmation; the money comes back within 14 days (the owner refunds in Stripe). GET also says what can be withdrawn.
// Buying (buy, pass) needs {start:true}: the learner ticked that access may start at once (needed before the 14 days end).
// Both pages are Stripe's own; the page only goes there and back (/?plus=ok, stop or back). Stripe tells api/stripe.js
// when the subscription starts, renews or ends, and the page reads its own row of `plus`.
import { syncStore } from "./_store.js";
import { storeOn, useGuard, amsterdamDay, caller, sameOrigin, plusOn, plusOf, plusFor, isPlus, stripe, priceFor, tierPortal, PORTAL, PLANS, PASS_KINDS, passPrice, coversLevel, WITHDRAW_DAYS, recentPasses, recordWithdrawal, endPass } from "./_supa.js";

// Shown on Stripe's page above the pay button: access starts at once, so the right of withdrawal ends (EU rules for
// digital content need this consent before payment). Dutch and English, as Stripe shows one text for every language.
const PASS_CONSENT = "Je krijgt meteen toegang. Binnen 14 dagen kun je in de app herroepen en krijg je je geld terug. / You get access immediately. Within 14 days you can withdraw in the app and get your money back.";
const SUB_CONSENT = "Plus begint meteen. Binnen 14 dagen kun je in de app herroepen (Profiel → Plus) en krijg je je geld terug. / Plus starts at once. Within 14 days you can withdraw in the app and get your money back.";
// A subscription that started in the last WITHDRAW_DAYS days and still runs
const recentSub = async (p) => {
  if (!p || !p.sub || p.status === "canceled") return null;
  const sub = await stripe(`subscriptions/${encodeURIComponent(p.sub)}`);
  const start = (sub.start_date || sub.created || 0) * 1000;
  return sub.status !== "canceled" && Date.now() - start < WITHDRAW_DAYS * 864e5 ? sub : null;
};

// What the page sees of the access: never Stripe's ids. store: "app_store" or "play_store" for a purchase in the apps.
const shown = (p) => p ? { status: p.status, until: p.until, ends: p.ends, level: p.level, ...(p.pass ? { pass: true } : {}),
  ...(p.year ? { year: true } : {}), ...(p.store ? { store: p.store } : {}) } : null;
// After buying or restoring in the app: at most STORE_SYNC a day per learner, each a read of RevenueCat's record
const STORE_SYNC = 40;
async function store(res, user) {
  if (!storeOn) return res.status(503).json({ error: "not_configured" });
  const left = await useGuard("rc:" + user.id, amsterdamDay(), 1, STORE_SYNC).catch(() => null);
  if (left != null && left < 0) return res.status(429).json({ error: "limit" });
  try {
    await syncStore(user.id);
    return res.status(200).json({ plus: shown(await plusFor(user.id)) });
  } catch (e) {
    console.error("store_sync", e?.message);
    return res.status(502).json({ error: "failed" });
  }
}

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
      // whether the withdrawal button applies (best effort: a lookup that fails only hides the button's hint)
      const [sub, passes] = await Promise.all([recentSub(await plusOf(user.id)).catch(() => null), recentPasses(user.id).catch(() => [])]);
      const withdraw = !!sub || passes.length > 0;
      return res.status(200).json({ plus: shown(p), withdraw });
    } catch { return res.status(502).json({ error: "failed" }); }
  }
  const go = req.body && req.body.go;
  if (go === "store") return store(res, user);
  if (go !== "buy" && go !== "manage" && go !== "pass" && go !== "withdraw") return res.status(400).json({ error: "bad_request" });
  if (go === "withdraw") return withdraw(res, user);
  // The learner must have asked for access to start at once (a ticked box on the page), else no Checkout
  // An app page cached before 26 November 2026 doesn't send it yet: let that buy (Stripe's page still shows the start-now
  // text above the pay button) and log it; remove this exception once every installed app has updated.
  if ((go === "pass" || go === "buy") && req.body.start !== true) console.info(JSON.stringify({ event: "buy_without_start" }));
  if (go === "pass") return pass(req, res, user);
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
      subscription_data: { metadata: { uid: user.id, level, start_now: new Date().toISOString() } }, // ownership and the ticked box; entitlement follows the actual price
      locale: "auto",
      success_url: `${site}/?plus=ok&plan=${level}`,
      cancel_url: `${site}/?plus=stop`,
      custom_text: { submit: { message: SUB_CONSENT } },
      // the terms must be ticked; needs the terms URL in Stripe (Settings → Public details), so only with STRIPE_TERMS=1
      ...(process.env.STRIPE_TERMS === "1" ? { consent_collection: { terms_of_service: "required" } } : {}),
    });
    return res.status(200).json({ url: s.url });
  } catch (e) {
    console.error(e.message);
    return res.status(502).json({ error: "failed" });
  }
}

// POST {go:"pass", level, kind?} -> {url}: Checkout for the one-time Examenpas (kind "pass", the default) or Jaarpas (kind "year"). Not while a subscription already covers that
// level (it would pay twice for the same checks). The webhook (api/stripe.js) records it once Stripe says it is paid.
async function pass(req, res, user) {
  const kind = req.body.kind === "year" ? "year" : "pass";
  if (!PASS_KINDS[kind].on()) return res.status(503).json({ error: "not_configured" });
  const level = req.body.level;
  if (level !== "A2" && level !== "B1") return res.status(400).json({ error: "invalid_plan" });
  try {
    const now = await plusFor(user.id);
    if (now && !now.pass && coversLevel(now, level)) return res.status(409).json({ error: "already" });
    const p = await plusOf(user.id);
    const price = await passPrice(level, kind);
    const site = `https://${req.headers.host}`;
    const s = await stripe("checkout/sessions", {
      mode: "payment",
      line_items: [{ price: price.id, quantity: 1 }],
      ...(p && p.customer ? { customer: p.customer } : user.email ? { customer_email: user.email } : {}),
      client_reference_id: user.id,
      metadata: { uid: user.id, level, kind, start_now: new Date().toISOString() },
      payment_intent_data: { metadata: { uid: user.id, level, kind } },
      locale: "auto",
      success_url: `${site}/?plus=ok&plan=${level}`,
      cancel_url: `${site}/?plus=stop`,
      custom_text: { submit: { message: PASS_CONSENT } },
      ...(process.env.STRIPE_TERMS === "1" ? { consent_collection: { terms_of_service: "required" } } : {}),
    });
    return res.status(200).json({ url: s.url });
  } catch (e) {
    console.error(e.message);
    return res.status(502).json({ error: "failed" });
  }
}

// The withdrawal button: everything bought in the last 14 days ends now; the statement is kept with its time and
// shown back as the confirmation. Nothing to withdraw: {withdrawn:[]} (the page says so).
async function withdraw(res, user) {
  const at = new Date().toISOString(), done = [];
  try {
    // First find everything that can be withdrawn and keep the statements (a failed record stops here, before anything
    // is cancelled: the learner sees an error and the owner's table never misses a withdrawal). Same ref twice: one row.
    const sub = await recentSub(await plusOf(user.id));
    const passes = await recentPasses(user.id);
    if (sub) done.push({ kind: "sub", ref: sub.id });
    for (const p of passes) done.push({ kind: "pass", ref: p.session, level: p.level });
    for (const d of done) await recordWithdrawal({ user_id: user.id, kind: d.kind, ref: d.ref, at });
    // Then end them
    if (sub) {
      await stripe(`subscriptions/${encodeURIComponent(sub.id)}`, { metadata: { withdrawn_at: at } });
      await stripe(`subscriptions/${encodeURIComponent(sub.id)}`, undefined, "DELETE");
    }
    for (const p of passes) await endPass(p.session);
    if (done.length) console.info(JSON.stringify({ event: "withdrawal", n: done.length }));
    return res.status(200).json({ withdrawn: done.map(({ kind, level }) => ({ kind, ...(level ? { level } : {}) })), at });
  } catch (e) {
    console.error("withdrawal", e.message);
    return res.status(502).json({ error: "failed" });
  }
}
