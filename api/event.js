// Anonymous usage counts: POST {ev, lvl, ui} adds one to today's count of that event (table usage_counts). The page sends
// a few: open and new (a device opens the app, once a day; new the first time), home and begin (the homepage, once a day,
// and its buttons into the app), quiz (the sample question on the homepage answered), test (the starttest finished), day
// (today's lesson finished), exam_<part> and done_<part> (a proefexamen started and handed in). Nothing about the person
// is sent or kept: no id, cookie, account or IP address, only the count per day. The page sends nothing with Global
// Privacy Control or Do Not Track. Off with EVENTS=0 (then /api/config doesn't offer it).
import { accounts, sameOrigin, bumpEvent } from "./_supa.js";

const PARTS = ["lz", "ls", "wr", "sp", "knm", "l1", "lb", "wb", "sb"];
// The way to paying: plus (the Plus screen opened), buy and pass (Checkout started for a subscription or an Examenpas),
// paid and stop (back from Stripe, paid or stopped). err: an error on the page; its technical message (m, f, l: message,
// file and line, never the learner's text) is only written to the server's log, never to the table.
export const EVENTS = new Set(["open", "new", "home", "begin", "quiz", "test", "day", "ai", "plus", "buy", "pass", "paid", "stop", "err", "won", "remind",
  ...["wr","sp"].flatMap(part => ["visit","check","start","paid"].map(stage => `ads_${part}_${stage}`)),
  ...PARTS.map(p => "exam_" + p), ...PARTS.map(p => "done_" + p)]);
const LVLS = new Set(["", "A2", "B1"]), UIS = new Set(["nl", "en", "ar", "tr", "hi", "zh", "es", "ru"]);
export const eventsOn = () => accounts && process.env.EVENTS !== "0";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!eventsOn()) return res.status(503).json({ error: "not_configured" });
  if (Number(req.headers["content-length"]) > 500) return res.status(413).json({ error: "too_large" });
  const { ev, lvl = "", ui = "nl" } = req.body || {};
  if (!EVENTS.has(ev) || !LVLS.has(lvl) || !UIS.has(ui)) return res.status(400).json({ error: "bad_request" });
  if (ev === "err") {
    const clean = (v, n) => String(v ?? "").replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "@").replace(/\d{6,}/g, "#").replace(/[^\P{C}]/gu, " ").slice(0, n);
    console.error(JSON.stringify({ event: "client_error", m: clean(req.body.m, 160), f: clean(req.body.f, 40), l: Number(req.body.l) | 0, lvl, ui }));
  }
  const ok = await bumpEvent({ ev, lvl, ui }).catch(() => null);
  if (ok === null) return res.status(502).json({ error: "failed" });
  return ok ? res.status(204).end() : res.status(429).json({ error: "busy" });
}
