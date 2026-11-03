// Hands a login from a separate Safari window back to the iPhone home-screen app (see putHand in _supa.js).
// POST {h, code} leaves the one-time code; POST {h} takes it -> {code} (or {code:null} while it isn't there yet).
import { accounts, sameOrigin, putHand, takeHand } from "./_supa.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "forbidden" });
  if (!accounts) return res.status(503).json({ error: "not_configured" });
  if (Number(req.headers["content-length"]) > 2000) return res.status(413).json({ error: "too_large" });
  const h = String(req.body?.h || ""), code = req.body?.code;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(h)) return res.status(400).json({ error: "bad_request" });
  if (code != null) {
    if (!/^[A-Za-z0-9_-]{8,200}$/.test(String(code))) return res.status(400).json({ error: "bad_request" });
    const ok = await putHand(h, String(code)).catch(() => false);
    return ok ? res.status(200).json({ ok: true }) : res.status(502).json({ error: "failed" });
  }
  const c = await takeHand(h).catch(() => null);
  return res.status(200).json({ code: c || null });
}
