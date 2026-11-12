// Personal allowance only; the public config describes the plan, never another person's usage.
import { accounts, caller, allowanceOf, visitor, useFree, FREE } from "./_supa.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Cookie, Authorization");
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  try {
    const user = await caller(req);
    if (user) return res.status(200).json(await allowanceOf(user.id));
    if (req.headers.authorization) return res.status(401).json({ error: "login" });
    if (!FREE) return res.status(200).json({ free: 0, period: "once" });
    const free = await useFree(visitor(req, res), 0);
    return res.status(200).json({ free, period: "once" });
  } catch { return res.status(503).json({ error: "quota_unavailable" }); }
}
