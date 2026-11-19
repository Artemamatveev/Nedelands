// Groups for schools and employers. Every call needs the user's access token; never cached.
// POST {go:"join", code} -> {result}: a learner joins a group ("ok", "unknown", "ended", "full", "already") and from then
//   on gets the Plus checks of the group's level until its end date (plusFor() in _supa.js).
// GET ?teach=1 -> {groups}: the groups whose teacher is this confirmed e-mail, with each member's practice (docent.html).
// GET ?list=1 -> {groups} and POST {go:"make", name, level, seats, until, teacher} -> {code}: only the owner (ADMIN_EMAILS).
import { accounts, caller, sameOrigin, joinGroup, makeGroup, groupList, teacherOverview } from "./_supa.js";
import { admins } from "./admin.js";

const confirmed = (u) => (u && u.email_confirmed_at ? String(u.email || "").toLowerCase() : "");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (req.method === "POST" && !sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  const user = await caller(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "login" });
  const mail = confirmed(user), owner = !!mail && admins().includes(mail);
  try {
    if (req.method === "GET") {
      if (req.query?.list) return owner ? res.status(200).json({ groups: await groupList() }) : res.status(403).json({ error: "forbidden" });
      if (!mail) return res.status(403).json({ error: "forbidden" });
      return res.status(200).json({ groups: await teacherOverview(mail) });
    }
    const b = req.body || {};
    if (b.go === "join") return res.status(200).json({ result: await joinGroup(user.id, b.code) });
    if (b.go === "make") {
      if (!owner) return res.status(403).json({ error: "forbidden" });
      const g = {
        name: String(b.name || "").trim().slice(0, 80), level: b.level === "B1" ? "B1" : "A2",
        seats: Math.max(1, Math.min(500, parseInt(b.seats, 10) || 0)), until: String(b.until || ""),
        teacher: String(b.teacher || "").trim().toLowerCase(),
      };
      if (!g.name || !/^\d{4}-\d{2}-\d{2}$/.test(g.until) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(g.teacher)) return res.status(400).json({ error: "invalid" });
      return res.status(200).json({ code: await makeGroup(g) });
    }
    return res.status(400).json({ error: "invalid" });
  } catch {
    return res.status(503).json({ error: "unavailable" });
  }
}
