// Invite a friend. GET with the user's access token -> {code, invited, bonus}: the share code (made on first use), how many
// friends joined with it and the extra free checks this account has. POST {code} -> {result}: a new account (made in the
// last 14 days) joins with a friend's code: "ok", "unknown", "self", "already" or "old". Both get 3 extra free checks
// (the inviter for at most 10 friends); api/check.js adds them to the free allowance. Never cached.
import { accounts, caller, sameOrigin, referralOf, claimReferral } from "./_supa.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (req.method === "POST" && !sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  const user = await caller(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "login" });
  try {
    if (req.method === "GET") return res.status(200).json(await referralOf(user.id));
    return res.status(200).json({ result: await claimReferral(user, req.body?.code) });
  } catch {
    return res.status(503).json({ error: "unavailable" });
  }
}
