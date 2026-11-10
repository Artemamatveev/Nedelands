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

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
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
      assert.equal(await s.p.locator('.shots img').count(), 3);
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
