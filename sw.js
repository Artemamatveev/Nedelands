// Offline: the app keeps working without a connection (on the train, abroad).
// The page itself: network first, so a push to main is live at once; the cached copy only when offline.
// Paintings, photos and icons: from the cache, refreshed in the background. The dictionary (7 MB): cache only.
// api/ (grading, new texts) always goes to the network.
const CACHE = "nl-a2-v1", CORE = ["/", "/manifest.json", "/apple-touch-icon.png"];

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
  if (r.mode === "navigate" || u.pathname === "/" || u.pathname === "/index.html") {
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("/", copy)) }
      return res;
    }).catch(() => caches.match("/")));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res });
    if (hit) { if (!u.pathname.startsWith("/dict/")) e.waitUntil(net.catch(() => {})); return hit }
    return net;
  })));
});
