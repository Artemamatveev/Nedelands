// Latest episodes for "Luisteren en kijken": Dutch YouTube channels and podcasts.
// GET /api/feed?id=jj -> {link, items:[{t, d, s, v} | {t, d, s, a, n}]}
// t title, d date (ms), s short summary in Dutch, v YouTube video id, a audio URL, n length in seconds.
// Only the feeds listed here, so the page can't make the server fetch other URLs. No key needed.
const YT = "https://www.youtube.com/feeds/videos.xml?channel_id=";
const FEEDS = {
  jj: { url: YT + "UC-bbHiTZGWKbsCjpzUfrk6Q", link: "https://www.youtube.com/@jeugdjournaal" },
  ed: { url: YT + "UC1x1Tso1WzjvU7GhcJBVQhg", link: "https://www.youtube.com/@EasyDutch", noSummary: true }, // descriptions are in English
  kh: { url: YT + "UC1rz0CNVZBUAlnk1xrlrjAw", link: "https://www.youtube.com/@hetklokhuis" },
  nos: { url: YT + "UC5xziMuoFAOpX9mwUVhe2Jw", link: "https://www.youtube.com/@NOS" },
  // podcasts: the link to the show's website comes from the feed itself
  jjp: { url: "https://podcast.npo.nl/feed/nos-jeugdjournaal.xml" },
  jojo: { url: "https://anchor.fm/s/10f5fea28/podcast/rss" },
  edp: { url: "https://feeds.fireside.fm/easydutch/rss" },
  dag: { url: "https://podcast.npo.nl/feed/de-dag.xml" },
  eg: { url: "https://www.omnycontent.com/d/playlist/61ee9ca4-a1b2-4660-9651-b2b70035edf5/0c13f220-bf12-49ed-9d47-b2f100f7c60c/c39fca6c-3f36-4b12-a7e8-b2f100f7c61a/podcast.rss" },
};
const MAX = 15;

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e.toLowerCase()] ?? m
  );
// Text of the first <tag>…</tag>, CDATA unwrapped and entities decoded
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  if (!m) return "";
  const raw = m[1].trim(), cd = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cd ? cd[1] : decode(raw);
}
const attr = (xml, name, a) => {
  const m = xml.match(new RegExp(`<${name}\\s[^>]*?${a}="([^"]*)"`));
  return m ? decode(m[1]) : "";
};
// The plain paragraphs of a description: no links, credits or "support the show"
const SKIP = /https?:|www\.|@|support|patreon|abonneer|volg ons|kijkwijzer|privacy|social media|^#|^(redactie|presentatie|productie|montage|zaalopnames|met dank aan)\b/i;
const paragraphs = (html) =>
  decode(html.replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n").replace(/<[^>]+>/g, ""))
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 25 && !SKIP.test(p));
// At most ~450 characters, cut after a sentence
function summary(parts) {
  let out = "";
  for (const p of parts) {
    if (out && out.length + p.length > 450) break;
    out += (out ? "\n" : "") + p;
  }
  if (out.length > 450) out = out.slice(0, 450).replace(/[^.!?]*$/, "") || out.slice(0, 450) + "…";
  return out;
}
// "Wat is slijm? #klokhuis #wetenschap" -> "Wat is slijm?"
const title = (t) => t.replace(/(\s*#[\p{L}\p{N}_]+)+\s*$/u, "").trim();
const seconds = (d) => {
  if (!d) return 0;
  const p = d.split(":").map(Number);
  return p.some(isNaN) ? 0 : p.reduce((a, x) => a * 60 + x, 0);
};

function parse(xml, f) {
  const items = parseItems(xml);
  // A paragraph that many episodes repeat (the show's blurb, a slogan) says nothing about the episode
  const seen = {};
  items.forEach((x) => x.s.forEach((p) => (seen[p] = (seen[p] || 0) + 1)));
  items.forEach((x) => (x.s = f.noSummary ? "" : summary(x.s.filter((p) => seen[p] < 3))));
  return items;
}
function parseItems(xml) {
  if (xml.includes("<yt:videoId>"))
    return xml.split("<entry>").slice(1, MAX + 1).map((e) => ({
      t: title(tag(e, "title")),
      d: Date.parse(tag(e, "published")) || 0,
      s: paragraphs(tag(e, "media:description")),
      v: tag(e, "yt:videoId"),
    }));
  return xml.split(/<item[\s>]/).slice(1)
    .map((e) => ({
      t: title(tag(e, "title")),
      d: Date.parse(tag(e, "pubDate")) || 0,
      s: paragraphs(tag(e, "description") || tag(e, "itunes:summary")),
      a: attr(e, "enclosure", "url"),
      n: seconds(tag(e, "itunes:duration")),
    }))
    .filter((x) => x.a.startsWith("https://") && !(x.n && x.n < 60)) // skip one-minute announcements
    .slice(0, MAX);
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  // Only this site's own pages: a same-origin GET carries Sec-Fetch-Site (older Safari: only Referer), not Origin
  const hostOf = (u) => { try { return new URL(u).host; } catch { return ""; } };
  const own = [req.headers.origin, req.headers.referer].some((u) => u && hostOf(u) === req.headers.host);
  if (req.headers["sec-fetch-site"] !== "same-origin" && !own)
    return res.status(403).json({ error: "forbidden" });
  const f = FEEDS[req.query?.id];
  if (!f) return res.status(404).json({ error: "unknown_feed" });
  try {
    const r = await fetch(f.url, { headers: { "User-Agent": "Mozilla/5.0 (nedelands.vercel.app)" }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error("feed " + r.status);
    const xml = await r.text(), items = parse(xml, f);
    const link = f.link || tag(xml.split(/<item[\s>]/)[0], "link");
    // Public data: let Vercel's CDN keep it for half an hour, so most visits don't reach the feed at all
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
    return res.status(200).json({ link: /^https?:\/\//.test(link) ? link : "", items });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "feed_failed", link: f.link || "" });
  }
}
