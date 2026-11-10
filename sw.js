// Offline: the app keeps working without a connection (on the train, abroad).
// The page itself: from the network first, but never waiting more than FAST ms (a slow connection made people wait);
// then the cached copy, and the network refreshes it in the background: when the new one differs (another ETag), the
// open page is told, and it offers to reload. Cache-first alone left iPhones on an old version: iOS stops a home-screen
// app's background work, so the refresh of the (then 1 MB) page often never finished. With nothing cached yet: the
// network. Other pages (including the landing page) are cached under their own address.
// The page's own files (data/ and study/ scripts as "?v=<hash>", and the dictionary's parts under "?v=" DICTV) never
// change under the same address: they are kept for good, and a new copy of the page is only stored once all its files
// are in the cache, so the cached page always works offline. Versions no page uses any more are then removed.
// Paintings, photos and icons: from the cache, refreshed in the background.
// Recorded voices (audio/): cached on first play. api/ (grading, new texts) always goes to the network.
// CACHE stays the same when sw.js changes: a new name would throw away every painting, photo and voice people have.
const APP = "/oefenen", CACHE = "nl-a2-v12", CORE = [APP, "/", "/landing.css", "/landing.js", "/art/delft.jpg", "/art/bitterbal-white.jpg", "/manifest.json", "/apple-touch-icon.png"];

const assetsOf = html => [...html.matchAll(/src="(\/(?:data|study)\/[^"?]+\.js\?v=[0-9a-f]+)"/g)].map(m => m[1]);
const dictOf = html => (/const DICTV="([0-9a-f]+)"/.exec(html) || [])[1] || "";
// the menus' translations (data/ui.js) are loaded only for other languages than Dutch: kept with the page only for
// someone who already uses them (a version of it is in the cache)
const uiOf = html => { const v = (/const UIV="([0-9a-f]+)"/.exec(html) || [])[1]; return v ? `/data/ui.js?v=${v}` : "" };
const hasUI = async c => c && (await c.keys()).some(r => new URL(r.url).pathname === "/data/ui.js");
// One network request per versioned file, shared by the page that asks for it and the background that stores it
const inflight = new Map();
function fetchAsset(c, url) {
  const u = new URL(url, location.origin).href;
  if (!inflight.has(u)) inflight.set(u, fetch(u).then(async res => { if (res.ok) await c.put(u, res.clone()); return res })
    .finally(() => inflight.delete(u)));
  return inflight.get(u).then(res => res.clone());
}
// Every file the page loads, from the cache, an older cache (from) or the network; true when all are there
async function keepAssets(c, html, from) {
  const list = assetsOf(html), ui = uiOf(html);
  if (ui && (await hasUI(c) || await hasUI(from))) list.push(ui);
  const ok = await Promise.all(list.map(async u => {
    if (await c.match(u)) return true;
    const old = from && await from.match(u);
    if (old) { await c.put(u, old); return true }
    const res = await fetchAsset(c, u).catch(() => null);
    return !!(res && res.ok);
  }));
  return ok.every(Boolean);
}
// Forget the versions the stored page no longer uses (also the unversioned files and the 7 MB dictionary of before)
async function prune(c, html) {
  const keep = new Set(assetsOf(html).concat(uiOf(html) || [])), dv = dictOf(html);
  for (const req of await c.keys()) {
    const u = new URL(req.url);
    if (/^\/(data|study)\//.test(u.pathname) && !keep.has(u.pathname + u.search)) await c.delete(req);
    else if (u.pathname.startsWith("/dict/") && (!dv || u.searchParams.get("v") !== dv)) await c.delete(req);
  }
}
// A new copy of the app page goes into the cache only with all its files
async function storeApp(c, res) {
  const html = await res.clone().text();
  if (!(await keepAssets(c, html))) return false;
  await c.put(APP, res); await prune(c, html); return true;
}

// Install must not fail: on the user's iPhone a new sw.js never took over, most likely because caching the 1 MB page
// at install did not finish. So each file is tried on its own and a miss is fine (the page comes from the network at the
// next start anyway); without a fresh page the one from an old cache is carried over with its files, so the app still
// opens offline.
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async c => {
    await Promise.all(CORE.filter(u => u !== APP).map(u => c.add(new Request(u, { cache: "no-store" })).catch(() => {})));
    const res = await fetch(new Request(APP, { cache: "no-store" })).catch(() => null);
    if (res && res.ok) await storeApp(c, res).catch(() => {});
    if (!(await c.match(APP))) {
      for (const k of await caches.keys()) {
        if (k === CACHE) continue;
        const oc = await caches.open(k), old = (await oc.match(APP)) || (await oc.match("/"));
        if (!old) continue;
        const html = await old.clone().text();
        if (html.includes('id="welcome"') && await keepAssets(c, html, oc)) { await c.put(APP, old); break }
      }
    }
  }).catch(() => {}));
});
// A new sw.js that replaces an older one comes with a new version of the page: the open windows offer to reload. Not on
// the first visit (no older cache), or a new learner would see "nieuwe versie" at once.
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(async ks => {
    const old = ks.filter(k => k !== CACHE);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (!old.length) return;
    (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).forEach(w => w.postMessage({ fresh: true }));
  }));
});
// The page sends the files to keep before they are first needed: paintings and photos, and the dictionary's parts
self.addEventListener("message", e => {
  const urls = e.data && Array.isArray(e.data.warm) ? e.data.warm : [];
  e.waitUntil(caches.open(CACHE).then(async c => {
    for (const u of urls) if (!(await c.match(u))) await c.add(u).catch(() => {}); // one by one: it is background work
  }));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  // When the page last changed (ms): the open page compares it with when it started
  if (u.pathname === "/__changed") {
    e.respondWith(caches.open(CACHE).then(c => c.match("/__changed")).then(h => h || new Response("0")));
    return;
  }
  const app = u.pathname === APP || u.pathname === APP + ".html";
  if (r.mode === "navigate" || app) {
    const key = app ? APP : u.pathname === "/index.html" ? "/" : u.pathname;
    e.respondWith(cacheFirst(e, r, key)); return;
  }
  // Versioned files: the same address always has the same content, so a cached copy is never fetched again
  if (u.searchParams.has("v") && /^\/(data|study|dict)\//.test(u.pathname)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(r).then(hit => hit || fetchAsset(c, r.url))));
    return;
  }
  // Recorded voices: kept after the first play (a file never changes, its name is the hash of its line). The audio
  // element asks for byte ranges (Safari won't play without them), answered from the whole file.
  if (u.pathname.startsWith("/audio/") && u.pathname.endsWith(".mp3")) {
    e.respondWith(caches.open(CACHE).then(c => c.match(u.pathname).then(hit => hit ||
      fetch(u.pathname).then(res => { if (res.ok) c.put(u.pathname, res.clone()); return res })))
      .then(res => ranged(r, res)));
    return;
  }
  // Everything else from the cache. Paintings and photos never change under the same name, so a hit is not fetched
  // again (on a slow connection that used to fill the line at every start); the rest (manifest, icons, lib,
  // audio/index.json) is refreshed in the background.
  e.respondWith(caches.open(CACHE).then(c => c.match(r).then(hit => {
    const net = () => fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res });
    if (hit) { if (!/^\/(dict|art|foto)\//.test(u.pathname)) e.waitUntil(net().catch(() => {})); return hit }
    return net();
  })));
});
// The network if it answers within FAST ms, else the cached page; the network still refreshes the cache in the
// background and, when the page changed, tells the open windows ({fresh: true}) once the new page and its files are
// stored. Nothing cached (the first visit): wait for the network, else the start page.
const FAST = 2500;
async function cacheFirst(e, r, key) {
  const c = await caches.open(CACHE), hit = await c.match(key), old = hit && hit.clone(); // hit may go to the page, old is compared
  // by its address: a navigation request itself can't be fetched with other options
  let stored = Promise.resolve(false);
  const net = fetch(r.url, { cache: "no-store", credentials: "same-origin" }).then(async res => {
    if (res.ok) {
      if (key === APP) stored = storeApp(c, res.clone()).catch(() => false); // in the background: the page doesn't wait for its files
      else { await c.put(key, res.clone()); stored = Promise.resolve(true) }
    }
    return res;
  });
  e.waitUntil(net.then(() => stored, () => {}));
  if (!hit) return net.catch(() => Response.error());
  const quick = net.then(res => res.ok ? res : hit, () => hit);
  const page = Promise.race([quick, new Promise(ok => setTimeout(() => ok(hit), FAST))]);
  e.waitUntil(net.then(async res => {
    // the window got the network's page, so it is already new: nothing to offer
    if ((await page) !== hit || !res.ok || key !== APP || !(await stored)) return;
    const a = old.headers.get("etag"), b = res.headers.get("etag");
    const changed = a && b ? a !== b : (await old.text()) !== (await (await c.match(APP)).text());
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

