// Smoke test in a real browser: the homepage and the app open without errors, fit a phone screen, switch to Arabic
// (right to left), show the sample question and open the KNM theme list. Runs where Playwright and Chromium are
// installed (the "browser" job in CI sets BROWSER_TESTS=1, so there a missing browser fails instead of skipping).
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const TYPES = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json','.mp3':'audio/mpeg','.txt':'text/plain'};
let chromium = null;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch {}

// state.knm: another version of data/knm.js in the page's address, as after an update
function serve(state = {}) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (state.knm && (p === '/oefenen' || p === '/oefenen.html')) {
      res.writeHead(200, {'content-type': TYPES['.html']});
      return res.end(fs.readFileSync(path.join(ROOT, 'oefenen.html'), 'utf8').replace(/\/data\/knm\.js\?v=[0-9a-f]+/, '/data/knm.js?v=' + state.knm));
    }
    if (p === '/api/config') { res.writeHead(200, {'content-type':'application/json'}); return res.end('{}'); }
    if (p.startsWith('/api/')) { res.writeHead(404); return res.end(); }
    if (p === '/') p = '/index.html';
    let f = path.join(ROOT, path.normalize(p));
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html'; // cleanUrls, as on Vercel
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'content-type': TYPES[path.extname(f)] || 'application/octet-stream'});
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function page(browser, base, {lang, ...opt} = {}) {
  const ctx = await browser.newContext({viewport:{width:390, height:844}, isMobile:true, hasTouch:true, serviceWorkers:'block', ...opt});
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(l => { localStorage.setItem('ww-welcome', '1'); if (l) localStorage.setItem('ww-ui', l); }, lang || null);
  return {p, errors, ctx, go: u => p.goto(base + u)};
}
const overflow = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test('The homepage and the app work in a real browser', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const server = await serve(), base = `http://127.0.0.1:${server.address().port}`;
  try {
    await t.test('homepage', async () => {
      const s = await page(browser, base); await s.go('/'); await s.p.waitForLoadState('load');
      assert.equal(await overflow(s.p), 0);
      assert.equal(await s.p.locator('#plus-card').isHidden(), true); // Plus is off without configuration
      // Vraag 2: the KNM question on the homepage marks the answer like the app does
      await s.p.locator('.quiz .choice').first().click();
      assert.equal(await s.p.locator('.quiz .choice.ok').count(), 1);
      assert.equal(await s.p.locator('#qfb').isVisible(), true);
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    await t.test('homepage in Arabic', async () => {
      const s = await page(browser, base, {lang:'ar'}); await s.go('/'); await s.p.waitForLoadState('load');
      assert.equal(await s.p.getAttribute('html', 'dir'), 'rtl');
      assert.equal(await overflow(s.p), 0);
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    await t.test('app: today, Arabic menus, KNM themes', async () => {
      const s = await page(browser, base, {lang:'ar'}); await s.go('/oefenen'); await s.p.waitForSelector('#plan .step');
      assert.equal(await s.p.getAttribute('html', 'dir'), 'rtl');
      assert.equal(await overflow(s.p), 0);
      await s.p.evaluate(() => setTab('oefenen'));
      await s.p.click('#parts [data-knm]');
      assert.equal(await s.p.locator('#knmsub [data-kt]').count(), 9);
      await s.p.click('#knmsub [data-kt="0"]');
      await s.p.waitForSelector('#play:not([hidden]) .opt');
      // the dictionary: a word loads its part over the network
      const e = await s.p.evaluate(() => lookUp('huizen', 'De huizen zijn oud.').then(E => [E.map(x => x.l), dictHave.size]));
      assert.ok(e[0].includes('huis')); assert.ok(e[1] < 5);
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    await t.test('homepage and app: who goes where', async () => {
      const s = await page(browser, base);
      await s.ctx.route('**/api/config', r => r.fulfill({json: {url: 'https://example.supabase.co', anon: 'x', login: ['google'], limit: 5, free: 2}}));
      await s.p.evaluate(() => localStorage.clear()).catch(() => {});
      await s.go('/'); await s.p.waitForSelector('.hero');
      // Begin gratis: into the app without the login window (the homepage already offers Inloggen)
      await s.p.click('.hero .button.primary'); await s.p.waitForSelector('#plan .step'); await s.p.waitForTimeout(800);
      assert.equal(await s.p.locator('#welcome').isHidden(), true);
      assert.equal(new URL(s.p.url()).search, '');
      // someone who practises here goes from / straight to the app; ?home shows the homepage all the same
      await s.go('/'); await s.p.waitForSelector('#plan .step');
      assert.equal(new URL(s.p.url()).pathname, '/oefenen');
      await s.go('/?home'); await s.p.waitForSelector('.hero');
      assert.equal(new URL(s.p.url()).pathname + new URL(s.p.url()).search, '/');
      // back from a login or a payment: the app takes over
      await s.go('/?plus=stop'); await s.p.waitForSelector('#plan .step');
      assert.equal(new URL(s.p.url()).pathname, '/oefenen');
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    await t.test('app: the sample question from the homepage', async () => {
      const s = await page(browser, base); await s.go('/oefenen?open=sample');
      await s.p.waitForSelector('#play:not([hidden]) .doc');
      await s.p.locator('#play .opt').first().click();
      await s.p.waitForSelector('.fb');
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
  } finally { await browser.close(); server.close(); }
});

test('Offline the app opens with its own files, also after an update', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const state = {}, server = await serve(state), base = `http://127.0.0.1:${server.address().port}`;
  try {
    const s = await page(browser, base, {serviceWorkers: 'allow'});
    await s.go('/oefenen'); await s.p.waitForSelector('#plan .step');
    await s.p.evaluate(() => navigator.serviceWorker.ready);
    const cached = () => s.p.evaluate(async () => (await (await caches.open('nl-a2-v12')).keys()).map(r => new URL(r.url)).map(u => u.pathname + u.search));
    const wait = async ok => { for (let i = 0; i < 100 && !ok(await cached()); i++) await s.p.waitForTimeout(100); return cached(); };
    const files = await s.p.evaluate(() => [...document.scripts].map(x => x.getAttribute('src')).filter(x => x && x.includes('?v=')));
    assert.ok(files.length >= 8);
    let c = await wait(c => c.includes('/oefenen') && files.every(f => c.includes(f)));
    assert.ok(files.every(f => c.includes(f)), 'the page\'s files are cached');
    await s.ctx.setOffline(true); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    await s.ctx.setOffline(false);
    // an update: the page asks for another version of one file
    state.knm = 'ffffffffff';
    await s.p.reload(); await s.p.waitForSelector('#plan .step');
    c = await wait(c => c.includes('/data/knm.js?v=ffffffffff') && c.filter(x => x.startsWith('/data/knm.js')).length === 1);
    assert.deepEqual(c.filter(x => x.startsWith('/data/knm.js')), ['/data/knm.js?v=ffffffffff'], 'only the version the stored page uses');
    await s.ctx.setOffline(true); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    assert.equal(await s.p.evaluate(() => KNM.length > 400), true);
    assert.deepEqual(s.errors.filter(e => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e)), []);
    await s.ctx.close();
  } finally { await browser.close(); server.close(); }
});
