// The result of a real exam, as the learner tells it in Mijn examen (uitScreen in oefenen.html), to see whether the
// proefexamens predict it. POST {id, part, ok, pc, rd}: id is a random uuid that stays on the learner's device, pc the last
// proefexamen score (0-100 or null), rd the status then (0 nog niet, 1 bijna, 2 klaar, or null). ok null takes it back.
// sc: the grade or score from DUO's letter, or null: 1 to 10 in steps of 0.1 for an A2 part or KNM, a whole number up
// to 1000 for a Staatsexamen NT2 part (500 or more is a pass).
// Nothing about the person is stored: no name, e-mail, account or IP address.
import { accounts, sameOrigin, putOutcome, dropOutcome } from "./_supa.js";

const PARTS = new Set(["lz", "ls", "wr", "sp", "knm", "l1", "lb", "wb", "sb"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NT2 = new Set(["l1", "lb", "wb", "sb"]);
const scoreOK = (part, sc) => sc === null || (typeof sc === "number" && (NT2.has(part) ? Number.isInteger(sc) && sc >= 0 && sc <= 1000
  : sc >= 1 && sc <= 10 && Math.abs(sc * 10 - Math.round(sc * 10)) < 1e-9));
const inRange = (x, top) => x === null || (Number.isInteger(x) && x >= 0 && x <= top);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  if (Number(req.headers["content-length"]) > 500) return res.status(413).json({ error: "too_large" });
  const { id, part, ok, pc = null, rd = null, sc = null } = req.body || {};
  if (!UUID.test(String(id)) || !PARTS.has(part) || !(ok === true || ok === false || ok === null) || !inRange(pc, 100) || !inRange(rd, 2) || !scoreOK(part, sc))
    return res.status(400).json({ error: "bad_request" });
  if (ok === null) {
    const gone = await dropOutcome(id).catch(() => false);
    return gone ? res.status(200).json({ ok: true }) : res.status(502).json({ error: "failed" });
  }
  const put = await putOutcome({ id, part, ok, pc, rd, sc }).catch(() => null);
  if (put === null) return res.status(502).json({ error: "failed" });
  return put ? res.status(200).json({ ok: true }) : res.status(429).json({ error: "busy" });
}
