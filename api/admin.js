// The owner's overview (admin.html): GET with the owner's Supabase access token → {users, counts}. users: what every
// account did (admin_overview() in supabase/schema.sql: name, e-mail, when created, last login, last practice, level,
// questions and answers, proefexamens, study time per day, Claude checks, Plus); counts: the anonymous usage counts of the
// last 30 days (api/event.js). Only for a confirmed e-mail in ADMIN_EMAILS (comma-separated, set in Vercel; without it
// nobody gets in). Never cached.
import { accounts, caller, adminData } from "./_supa.js";

export const admins = () => String(process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  const u = await caller(req).catch(() => null);
  if (!u) return res.status(401).json({ error: "login" });
  const mail = String(u.email || "").toLowerCase();
  if (!mail || !u.email_confirmed_at || !admins().includes(mail)) return res.status(403).json({ error: "forbidden" });
  try {
    return res.status(200).json(await adminData(30));
  } catch {
    return res.status(502).json({ error: "failed" });
  }
}
