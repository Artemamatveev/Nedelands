// Video thumbnails for "Luisteren en kijken", through our own server: GET /api/thumb?v=<YouTube video id>.
// So a visitor's browser only talks to Google once they open a video, not already when the list shows.
// Only the fixed thumbnail address on i.ytimg.com, only for this site's own pages; cached by Vercel's CDN for a week.
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  const hostOf = (u) => { try { return new URL(u).host; } catch { return ""; } };
  const own = [req.headers.origin, req.headers.referer].some((u) => u && hostOf(u) === req.headers.host);
  if (req.headers["sec-fetch-site"] !== "same-origin" && !own) return res.status(403).json({ error: "forbidden" });
  const v = String(req.query?.v || "");
  if (!/^[A-Za-z0-9_-]{11}$/.test(v)) return res.status(400).json({ error: "bad_id" });
  try {
    const r = await fetch(`https://i.ytimg.com/vi/${v}/mqdefault.jpg`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return res.status(r.status === 404 ? 404 : 502).json({ error: "thumb_failed" });
    const type = r.headers.get("content-type") || "";
    if (!/^image\//.test(type)) return res.status(502).json({ error: "thumb_failed" });
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 500000) return res.status(502).json({ error: "thumb_failed" });
    res.setHeader("Content-Type", type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "thumb_failed" });
  }
}
