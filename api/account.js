// Delete my account: DELETE /api/account with "Authorization: Bearer <access token>".
// Removes the user in Supabase; their progress and check counts go with them. The page keeps what is on the device.
// A Plus subscription is cancelled at Stripe first, or Stripe would go on charging for an account that is gone.
// A subscription bought in the App Store or Google Play can only be cancelled there; the app says so before deleting.
import { rcDelete } from "./_store.js";
import { accounts, caller, deleteUser, sameOrigin, plusOn, plusOf, stripe } from "./_supa.js";

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "method_not_allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  const user = await caller(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "login" });
  if (plusOn) {
    const p = await plusOf(user.id).catch(() => undefined);
    if (p === undefined) return res.status(502).json({ error: "failed" });
    if (p && p.status !== "canceled") {
      const sub = `subscriptions/${encodeURIComponent(p.sub)}`;
      const s = await stripe(sub, null, "DELETE").catch(() => stripe(sub)).catch(() => null); // already cancelled: read it
      if (!s || s.status !== "canceled") return res.status(502).json({ error: "failed" });
    }
  }
  if (!(await deleteUser(user.id).catch(() => false))) return res.status(502).json({ error: "failed" });
  await rcDelete(user.id); // RevenueCat's record of store purchases (a subscription in the store is cancelled there by the learner)
  return res.status(200).json({ deleted: true });
}
