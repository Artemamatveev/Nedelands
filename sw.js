// Offline: the app keeps working without a connection (on the train, abroad).
// The page itself: from the network first, but never waiting more than FAST ms (a slow connection made people wait);
// then the cached copy, and the network refreshes it in the background: when the new one differs (another ETag), the
// open page is told, and it offers to reload. Cache-first alone left iPhones on an old version: iOS stops a home-screen
// app's background work, so the refresh of the 1 MB page often never finished. With nothing cached yet: the network. Other pages (privacy, over) the same, cached under their own address, never as "/".
// Paintings, photos and icons: from the cache, refreshed in the background. The dictionary (7 MB): cache only.
// Recorded voices (audio/): cached on first play. api/ (grading, new texts) always goes to the network.
const CACHE = "nl-a2-v7", CORE = ["/", "/manifest.json", "/apple-touch-icon.png", "/study/language-v1.js", "/study/progress-v1.js", "/study/writing-v1.js"];

// Install must not fail: on the user's iPhone a new sw.js never took over, most likely because caching the 1 MB page
// at install did not finish. So each file is tried on its own and a miss is fine (the page comes from the network at the
// next start anyway); without a fresh page the one from the old cache is carried over, so the app still opens offline.
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async c => {
    await Promise.all(CORE.map(u => c.add(new Request(u, { cache: "no-store" })).catch(() => {})));
    if (!(await c.match("/"))) {
      for (const k of await caches.keys()) {
        if (k === CACHE) continue;
        const old = await (await caches.open(k)).match("/");
        if (old) { await c.put("/", old); break }
      }
    }
  }).catch(() => {}));
});
// A new sw.js comes with a new version of the page (its cache was filled at install): the open windows offer to reload.
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
    .then(ws => ws.forEach(w => w.postMessage({ fresh: true }))));
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
  // Everything else from the cache. Paintings, photos and the dictionary never change under the same name, so a hit is
  // not fetched again (on a slow connection that used to fill the line at every start); the rest (manifest, icons,
  // lib, audio/index.json) is refreshed in the background.
  e.respondWith(caches.open(CACHE).then(c => c.match(r).then(hit => {
    const net = () => fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res });
    if (hit) { if (!/^\/(dict|art|foto)\//.test(u.pathname)) e.waitUntil(net().catch(() => {})); return hit }
    return net();
  })));
});
// The network if it answers within FAST ms, else the cached page; the network still refreshes the cache in the
// background and, when the page changed, tells the open windows ({fresh: true}). Nothing cached (the first visit):
// wait for the network, else the start page.
const FAST = 2500;
async function cacheFirst(e, r, key) {
  const c = await caches.open(CACHE), hit = await c.match(key), old = hit && hit.clone(); // hit may go to the page, old is compared
  // by its address: a navigation request itself can't be fetched with other options
  const net = fetch(r.url, { cache: "no-store", credentials: "same-origin" }).then(async res => {
    if (res.ok) await c.put(key, res.clone());
    return res;
  });
  if (!hit) return net.catch(() => caches.match("/").then(h => h || Response.error()));
  const quick = net.then(res => res.ok ? res : hit, () => hit);
  const page = Promise.race([quick, new Promise(ok => setTimeout(() => ok(hit), FAST))]);
  e.waitUntil(net.then(async res => {
    // the window got the network's page, so it is already new: nothing to offer
    if ((await page) !== hit || !res.ok) return;
    const a = old.headers.get("etag"), b = res.headers.get("etag");
    const changed = a && b ? a !== b : (await old.text()) !== (await res.clone().text());
    if (!changed) return;
    // remembered too (the page that is still starting may miss the message, so it asks /__changed)
    await c.put("/__changed", new Response(String(Date.now())));
    (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).forEach(w => w.postMessage({ fresh: true }));
  }).catch(() => {}));
  return page;
}
async function ranged(r, res) {
  const m = /^bytes=(\d+)-(\d*)$/.exec(r.headers.get("range") || "");
  if (!m || res.status !== 200) return res;
  const b = await res.arrayBuffer(), s = +m[1], end = m[2] ? Math.min(+m[2], b.byteLength - 1) : b.byteLength - 1;
  if (s >= b.byteLength) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${b.byteLength}` } });
  return new Response(b.slice(s, end + 1), { status: 206, headers: { "Content-Type": "audio/mpeg",
    "Content-Range": `bytes ${s}-${end}/${b.byteLength}`, "Content-Length": String(end - s + 1), "Accept-Ranges": "bytes" } });
}

