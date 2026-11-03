// Offline: the app keeps working without a connection (on the train, abroad).
// The page itself: from the cache at once (a slow connection made people wait), and fetched again in the background;
// when the new one differs (another ETag), the open page is told, and it offers to reload. With nothing cached yet:
// the network. Other pages (privacy, over) the same, cached under their own address, never as "/".
// Paintings, photos and icons: from the cache, refreshed in the background. The dictionary (7 MB): cache only.
// Recorded voices (audio/): cached on first play. api/ (grading, new texts) always goes to the network.
const CACHE = "nl-a2-v2", CORE = ["/", "/manifest.json", "/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// The page sends the list of paintings and photos, so they are there offline before they are first shown
self.addEventListener("message", e => {
  const urls = e.data && Array.isArray(e.data.warm) ? e.data.warm : [];
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(urls.map(u =>
    c.match(u).then(hit => hit || c.add(u).catch(() => {}))))));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  // When the page last changed (ms): the open page compares it with when it started
  if (u.pathname === "/__changed") {
    e.respondWith(caches.open(CACHE).then(c => c.match("/__changed")).then(h => h || new Response("0")));
    return;
  }
  const app = u.pathname === "/" || u.pathname === "/index.html";
  // Another page of the site (privacy, over): network first, kept under its own address for offline
  if (r.mode === "navigate" && !app) { e.respondWith(cacheFirst(e, r, r)); return }
  if (r.mode === "navigate" || app) { e.respondWith(cacheFirst(e, r, "/")); return }
  // Recorded voices: kept after the first play (a file never changes, its name is the hash of its line). The audio
  // element asks for byte ranges (Safari won't play without them), answered from the whole file.
  if (u.pathname.startsWith("/audio/") && u.pathname.endsWith(".mp3")) {
    e.respondWith(caches.open(CACHE).then(c => c.match(u.pathname).then(hit => hit ||
      fetch(u.pathname).then(res => { if (res.ok) c.put(u.pathname, res.clone()); return res })))
      .then(res => ranged(r, res)));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res });
    if (hit) { if (!u.pathname.startsWith("/dict/")) e.waitUntil(net.catch(() => {})); return hit }
    return net;
  })));
});
// The cached page at once; the network refreshes the cache in the background and, when the page changed, tells the
// open windows ({fresh: true}). Nothing cached (the first visit): wait for the network, else the start page.
async function cacheFirst(e, r, key) {
  const c = await caches.open(CACHE), hit = await c.match(key), old = hit && hit.clone(); // hit goes to the page, old is compared
  // by its address: a navigation request itself can't be fetched with other options
  const net = fetch(r.url, { cache: "no-store", credentials: "same-origin" }).then(async res => {
    if (!res.ok) return res;
    await c.put(key, res.clone());
    if (hit) {
      const a = old.headers.get("etag"), b = res.headers.get("etag");
      const changed = a && b ? a !== b : (await old.text()) !== (await res.clone().text());
      if (changed) {
        // remembered too (the page that is still starting may miss the message, so it asks /__changed)
        await c.put("/__changed", new Response(String(Date.now())));
        (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).forEach(w => w.postMessage({ fresh: true }));
      }
    }
    return res;
  });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit }
  return net.catch(() => caches.match("/").then(h => h || Response.error()));
}
async function ranged(r, res) {
  const m = /^bytes=(\d+)-(\d*)$/.exec(r.headers.get("range") || "");
  if (!m || res.status !== 200) return res;
  const b = await res.arrayBuffer(), s = +m[1], end = m[2] ? Math.min(+m[2], b.byteLength - 1) : b.byteLength - 1;
  if (s >= b.byteLength) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${b.byteLength}` } });
  return new Response(b.slice(s, end + 1), { status: 206, headers: { "Content-Type": "audio/mpeg",
    "Content-Range": `bytes ${s}-${end}/${b.byteLength}`, "Content-Length": String(end - s + 1), "Accept-Ranges": "bytes" } });
}
