// The owner's overview (admin.html): GET with the owner's Supabase access token → {users, counts}. users: what every
// account did (admin_overview() in supabase/schema.sql: name, e-mail, when created, last login, last practice, level,
// questions and answers, proefexamens, study time per day, Claude checks, Plus); counts: the anonymous usage counts of the
// last 30 days (api/event.js). With ?me=1 only {admin: true}, so the app knows to show the row in Profiel. Only for a confirmed e-mail in ADMIN_EMAILS (comma-separated, set in Vercel; without it
// nobody gets in). Never cached.
import { accounts, caller, adminData } from "./_supa.js";

export const admins = () => String(process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
// ADMIN_IDS (optional, comma-separated Supabase user ids): when set, the owner must also be one of these accounts, so a
// sign-in method that reports someone else's e-mail as confirmed can never open the overview.
const adminIds = () => String(process.env.ADMIN_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
// Sign-in methods whose e-mail is verified by the provider itself (the app offers only these)
const VERIFIED = new Set(["email", "google", "apple"]);
export const verifiedMail = (u) => {
  if (!u || !u.email_confirmed_at) return "";
  const p = u.app_metadata?.provider;
  if (p && !VERIFIED.has(p)) return "";
  return String(u.email || "").toLowerCase();
};
export const isOwner = (u) => {
  const mail = verifiedMail(u), ids = adminIds();
  return !!mail && admins().includes(mail) && (!ids.length || ids.includes(u.id));
};

import compare from "./_compare.js";

// POST is the model comparison (/api/compare is rewritten here, vercel.json; _compare.js checks the owner itself)
export default async function handler(req, res) {
  if (req.method === "POST") return compare(req, res);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  const u = await caller(req).catch(() => null);
  if (!u) return res.status(401).json({ error: "login" });
  if (!isOwner(u)) return res.status(403).json({ error: "forbidden" });
  // ?me=1: only whether this account may open the overview (the app shows its row in Profiel), without reading the data
  if (req.query && req.query.me) return res.status(200).json({ admin: true });
  try {
    return res.status(200).json(await adminData(30));
  } catch {
    return res.status(502).json({ error: "failed" });
  }
}
