// Smoke test in a real browser: the homepage and the app open without errors, fit a phone screen, switch to Arabic
// (right to left), show the sample question and open the KNM theme list; axe-core finds no accessibility problem on any
// kind of screen, light and dark, and the white tab name on the oranje lens has at least 4.5:1. Runs where Playwright and Chromium are
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
try { chromium = createRequire(import.meta.url)('playwright')[process.env.BROWSER_ENGINE || 'chromium']; } catch {}

// state.knm: another version of data/knm.js in the page's address, as after an update
function serve(state = {}) {
  const server = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (state.holdApp && (p === '/oefenen' || p === '/oefenen.html')) await state.holdApp;
    if (state.workerRevision && p === '/sw.js') {
      res.writeHead(200, {'content-type':TYPES['.js']});
      return res.end(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8')+'\n// fixture revision '+state.workerRevision);
    }
    if (state.knm && (p === '/oefenen' || p === '/oefenen.html')) {
      res.writeHead(200, {'content-type': TYPES['.html']});
      return res.end(fs.readFileSync(path.join(ROOT, 'oefenen.html'), 'utf8').replace(/\/data\/knm\.js\?v=[0-9a-f]+/, '/data/knm.js?v=' + state.knm));
    }
    if (p === '/api/config') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify(state.config || {})); }
    if (p === '/api/allowance') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify(state.allowance || {free:2})); }
    if (p === '/api/plus' && Object.hasOwn(state, 'plus')) { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify({plus:state.plus})); }
    if (p === '/api/admin' && state.admin) {
      state.adminAuth = req.headers.authorization || '';
      res.writeHead(200, {'content-type': 'application/json'}); return res.end(JSON.stringify(state.admin));
    }
    if (p === '/api/event' && state.events) {
      let b = ''; req.on('data', d => b += d); req.on('end', () => { state.events.push(JSON.parse(b)); res.writeHead(state.fail ? 502 : 204); res.end(); }); return;
    }
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

test('Bittie welcomes learners during startup and never traps them behind loading', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const server = await serve(), base = `http://127.0.0.1:${server.address().port}`;
  try {
    await t.test('the first mascot frame paints while optional motion styles are still downloading', async () => {
      const s = await page(browser, base);
      let release;
      const held = new Promise(ok => { release=ok; });
      try {
        await s.p.route('**/motion-v1.css', async route => { await held; await route.continue().catch(()=>{}); });
        await s.p.route('**/data/knm.js?*', async route => { await held; await route.continue().catch(()=>{}); });
        await s.p.goto(base+'/oefenen?open=today', {waitUntil:'commit'});
        await s.p.locator('#app-loading').waitFor({state:'visible', timeout:1500});
        await s.p.waitForFunction(() => document.querySelector('#app-loading img').naturalWidth > 0, null, {timeout:1500});
        assert.equal(await s.p.locator('link[href="/motion-v1.css"]').getAttribute('media'), 'print');
        assert.match(await s.p.locator('#app-loading img').evaluate(e=>e.currentSrc), /\/bittie-dance-v1\.webp$/);
      } finally { release(); await s.ctx.close(); }
    });
    await t.test('iPhone launch metadata contains Bittie at the exact device resolution', async () => {
      const s = await page(browser, base);
      try {
        await s.p.addInitScript(() => Object.defineProperty(navigator, 'standalone', {value:true, configurable:true}));
        await s.go('/oefenen?open=today');
        await s.p.waitForFunction(() => document.querySelector('link[rel="apple-touch-startup-image"]')?.href.startsWith('data:image/png'));
        const result = await s.p.evaluate(async () => {
          const image = new Image(); image.src=document.querySelector('#ios-startup-image').href; await image.decode();
          return {width:image.naturalWidth, height:image.naturalHeight, expectedWidth:screen.width*devicePixelRatio, expectedHeight:screen.height*devicePixelRatio};
        });
        assert.equal(result.width, result.expectedWidth); assert.equal(result.height, result.expectedHeight);
        assert.deepEqual(s.errors, []);
      } finally { await s.ctx.close(); }
    });
    await t.test('slow scripts show Bittie, the saved language and accessible reduced motion', async () => {
      for (const opt of [{lang:'ru'}, {lang:'ar', colorScheme:'dark', reducedMotion:'reduce'}]) {
        const s = await page(browser, base, opt);
        let release;
        const held = new Promise(ok => { release=ok; });
        try {
          await s.p.route('**/data/knm.js?*', async route => { await held; await route.continue().catch(()=>{}); });
          await s.p.goto(base+'/oefenen?open=today', {waitUntil:'commit'});
          await s.p.locator('#app-loading').waitFor({state:'visible'});
          const shownAt=await s.p.locator('#app-loading').evaluate(e=>Number(e.dataset.shownAt));
          await s.p.waitForFunction(() => document.querySelector('#app-loading img').naturalWidth > 0);
          assert.match(await s.p.locator('#app-loading img').evaluate(e=>e.currentSrc),
            opt.reducedMotion?/\/bittie-loading-v1\.webp$/:/\/bittie-dance-v1\.webp$/);
          assert.equal(await s.p.locator('#boot-label').textContent(), opt.lang==='ru'?'Загрузка…':'جارٍ التحميل…');
          assert.equal(await s.p.locator('main').isVisible(), false);
          assert.equal(await s.p.locator('#tabs').isVisible(), false);
          assert.equal(await overflow(s.p), 0);
          if (opt.reducedMotion) assert.equal(await s.p.locator('#app-loading img').evaluate(e=>getComputedStyle(e).animationName), 'none');
          else {
            const image = s.p.locator('#app-loading img');
            assert.equal(await image.evaluate(e=>getComputedStyle(e).transform), 'none', 'the complete image is not being wobbled');
            const firstFrame = await image.screenshot();
            await s.p.waitForTimeout(180);
            assert.notDeepEqual(await image.screenshot(), firstFrame, 'the character changes pose inside the image');
          }
          release();
          await s.p.waitForFunction(() => window.__up===1);
          await s.p.locator('#app-loading').waitFor({state:'detached'});
          if(!opt.reducedMotion)assert.ok(await s.p.evaluate(()=>Date.now())-shownAt>=2000, 'the dance remains visible for two seconds');
          assert.equal(await s.p.locator('main').isVisible(), true);
          assert.equal(await s.p.locator('#tabs').isVisible(), true);
          assert.deepEqual(s.errors, []);
        } finally { release(); await s.ctx.close(); }
      }
    });
    await t.test('an unavailable script shows a retry action which can recover', async () => {
      const s = await page(browser, base);
      try {
        await s.p.route('**/data/knm.js?*', route=>route.abort());
        await s.go('/oefenen?open=today');
        await s.p.getByRole('alert').waitFor({state:'visible'});
        assert.equal(await s.p.locator('#app-loading').count(), 0);
        await s.p.unroute('**/data/knm.js?*');
        await s.p.getByRole('button', {name:'Opnieuw laden'}).click();
        await s.p.waitForFunction(() => window.__up===1);
        await s.p.locator('#app-loading').waitFor({state:'detached'});
        assert.equal(await s.p.locator('main').isVisible(), true);
      } finally { await s.ctx.close(); }
    });
    await t.test('a missing dance file falls back to the still mascot', async () => {
      const s=await page(browser,base);
      let release;
      const held=new Promise(ok=>{release=ok});
      try {
        await s.p.route('**/art/bittie-dance-v1.webp',route=>route.abort());
        await s.p.route('**/data/knm.js?*',async route=>{await held;await route.continue().catch(()=>{})});
        await s.p.goto(base+'/oefenen?open=today',{waitUntil:'commit'});
        await s.p.waitForFunction(()=>{
          const image=document.querySelector('#app-loading img');
          return image&&image.currentSrc.endsWith('/bittie-loading-v1.webp')&&image.naturalWidth>0;
        });
        assert.equal(await s.p.locator('#app-loading img').isVisible(),true);
        assert.equal(await s.p.getByRole('alert').count(),0);
        release();
        await s.p.locator('#app-loading').waitFor({state:'detached'});
        assert.equal(await s.p.locator('main').isVisible(),true);
      } finally {release();await s.ctx.close()}
    });
    await t.test('a stalled account request releases the usable local app', async () => {
      const s = await page(browser, base);
      let release;
      const held = new Promise(ok=>{release=ok});
      try {
        await s.p.clock.install();
        await s.p.route('**/api/config?*', async route=>{await held;await route.continue().catch(()=>{})});
        await s.go('/oefenen?open=today');
        await s.p.waitForFunction(()=>typeof restored!=='undefined'&&restored);
        assert.equal(await s.p.locator('#app-loading').isVisible(), true);
        await s.p.clock.runFor(4300);
        await s.p.locator('#app-loading').waitFor({state:'detached'});
        assert.equal(await s.p.locator('#plan button').first().isVisible(), true);
        release();
        await s.p.waitForFunction(()=>window.__up===1);
        assert.deepEqual(s.errors, []);
      } finally { release();await s.ctx.close(); }
    });
    await t.test('startup that never gets its scripts offers retry instead of loading forever', async () => {
      const s = await page(browser, base);
      let release;
      const held = new Promise(ok=>{release=ok});
      try {
        await s.p.clock.install();
        await s.p.route('**/data/knm.js?*', async route=>{await held;await route.continue().catch(()=>{})});
        await s.p.goto(base+'/oefenen', {waitUntil:'commit'});
        await s.p.locator('#app-loading').waitFor({state:'visible'});
        await s.p.clock.runFor(20100);
        await s.p.getByRole('button', {name:'Opnieuw laden'}).waitFor({state:'visible'});
        assert.equal(await s.p.locator('#app-loading').count(), 0);
      } finally { release();await s.ctx.close(); }
    });
  } finally { await browser.close();await new Promise(ok=>server.close(ok)); }
});

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
    await t.test('learning features: compact headings, touch, hover and keyboard', async () => {
      for (const lang of ['en', 'ru', 'ar']) {
        const s = await page(browser, base, {lang, reducedMotion: 'reduce'}); await s.go('/');
        const cards = s.p.locator('.feature-grid details'), descriptions = cards.locator('p');
        assert.equal(await cards.count(), 7);
        assert.equal(await s.p.locator('.feature-grid details[open]').count(), 0);
        for (const description of await descriptions.all()) assert.equal(await description.isHidden(), true);
        assert.equal(await cards.first().evaluate(e => getComputedStyle(e).borderTopWidth), '0px');
        assert.ok((await s.p.locator('.feature-grid').boundingBox()).height < 650, `${lang}: compact list`);
        await cards.nth(0).locator('summary').tap();
        assert.equal(await descriptions.nth(0).isVisible(), true);
        assert.equal(await cards.nth(0).evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(31, 60, 150)');
        await cards.nth(1).locator('summary').tap();
        assert.equal(await descriptions.nth(0).isHidden(), true);
        assert.equal(await descriptions.nth(1).isVisible(), true);
        assert.equal(await s.p.locator('.feature-grid details[open]').count(), 1);
        await cards.nth(1).locator('summary').tap();
        assert.equal(await s.p.locator('.feature-grid details[open]').count(), 0);
        assert.equal(await overflow(s.p), 0);
        assert.deepEqual(s.errors, []); await s.ctx.close();
      }
      const s = await page(browser, base, {lang: 'en', viewport: {width: 1280, height: 900}, isMobile: false, hasTouch: false, reducedMotion: 'reduce'});
      await s.go('/');
      const cards = s.p.locator('.feature-grid details');
      assert.equal(await s.p.locator('.feature-grid details[open]').count(), 0);
      assert.equal(await cards.first().evaluate(e => getComputedStyle(e).borderTopWidth), '1px');
      const documentTop = e => e.getBoundingClientRect().top + scrollY;
      const nextRow = await cards.nth(2).evaluate(documentTop);
      await cards.nth(0).locator('summary').hover();
      assert.equal(await cards.nth(0).locator('p').isVisible(), true);
      assert.equal(await cards.nth(0).evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(31, 60, 150)');
      assert.equal(await cards.nth(2).evaluate(documentTop), nextRow, 'hover keeps the next heading in place');
      // Moving from the heading into its description must keep the card open.
      await cards.nth(0).locator('p').hover();
      assert.equal(await cards.nth(0).locator('p').isVisible(), true);
      await cards.nth(1).locator('summary').hover();
      assert.equal(await cards.nth(0).locator('p').isHidden(), true);
      assert.equal(await cards.nth(1).locator('p').isVisible(), true);
      await s.p.mouse.move(0, 0);
      assert.equal(await s.p.locator('.feature-grid details[open]').count(), 0);
      await cards.nth(0).locator('summary').focus();
      await s.p.keyboard.press('Enter');
      assert.equal(await cards.nth(0).locator('p').isVisible(), true);
      await s.p.keyboard.press('Tab');
      await s.p.keyboard.press('Space');
      assert.equal(await cards.nth(0).locator('p').isHidden(), true);
      assert.equal(await cards.nth(1).locator('p').isVisible(), true);
      assert.equal(await s.p.locator('.feature-grid details[open]').count(), 1);
      await s.p.keyboard.press('Space');
      assert.equal(await s.p.locator('.feature-grid details[open]').count(), 0);
      assert.equal(await overflow(s.p), 0);
      assert.deepEqual(s.errors, []); await s.ctx.close();
      // The disclosure still works with native HTML when scripts are unavailable.
      const native = await page(browser, base, {javaScriptEnabled: false}); await native.go('/');
      await native.p.locator('.feature-grid summary').first().tap();
      assert.equal(await native.p.locator('.feature-grid p').first().isVisible(), true);
      await native.ctx.close();
    });
    await t.test('learning features: smooth reversal, switching and reduced motion', async () => {
      const s = await page(browser, base, {lang: 'en'}); await s.go('/');
      const cards = s.p.locator('.feature-grid details'), first = cards.first(), panel = first.locator('p');
      const settle = () => s.p.waitForFunction(() => [...document.querySelectorAll('.feature-grid p')].every(e => !e.getAnimations().some(a => a.playState === 'running')));
      const collapsed = (await first.boundingBox()).height;
      await first.locator('summary').tap();
      assert.ok(await panel.evaluate(e => e.getAnimations().some(a => a.effect.getKeyframes().some(k => 'height' in k))), 'description animates its height');
      // Reverse before the opening animation ends, then reopen while it is closing.
      await first.locator('summary').tap();
      await first.locator('summary').tap();
      await settle();
      assert.equal(await panel.isVisible(), true);
      assert.ok((await first.boundingBox()).height > collapsed + 24);
      assert.equal(await panel.evaluate(e => e.style.overflow), '', 'settled content is not clipped');
      assert.equal(await first.evaluate(e => getComputedStyle(e).borderTopWidth), '0px');
      await cards.nth(1).locator('summary').tap(); await settle();
      assert.equal(await panel.isHidden(), true);
      assert.equal(await cards.nth(1).locator('p').isVisible(), true);
      assert.equal(await s.p.locator('.feature-grid details[open]').count(), 1);
      await cards.nth(1).locator('summary').tap(); await settle();
      assert.equal(await s.p.locator('.feature-grid details[open]').count(), 0);
      assert.equal((await first.boundingBox()).height, collapsed);
      await first.locator('summary').tap();
      await s.p.emulateMedia({reducedMotion: 'reduce'}); await settle();
      assert.equal(await panel.isVisible(), true);
      await first.locator('summary').tap();
      assert.equal(await panel.isHidden(), true);
      assert.equal(await panel.evaluate(e => e.getAnimations().length), 0);
      assert.equal(await overflow(s.p), 0);
      assert.deepEqual(s.errors, []); await s.ctx.close();
      const d = await page(browser, base, {viewport: {width: 1280, height: 900}, isMobile: false, hasTouch: false}); await d.go('/');
      const heading = d.p.locator('.feature-grid summary').first(), description = d.p.locator('.feature-grid p').first();
      await d.p.evaluate(() => {
        window.featureHoverTrace = [];
        const card = document.querySelector('.feature-grid details');
        for (const type of ['pointerenter', 'pointerleave']) card.addEventListener(type, e => {
          window.featureHoverTrace.push({type, x: e.clientX, y: e.clientY, top: card.getBoundingClientRect().top, scroll: scrollY, open: card.open});
        });
      });
      await heading.hover();
      await d.p.waitForFunction(() => document.querySelector('.feature-grid details').open);
      await d.p.mouse.move(0, 0);
      await heading.hover();
      await d.p.waitForFunction(() => !document.querySelector('.feature-grid p').getAnimations().some(a => a.playState === 'running'));
      assert.equal(await description.isVisible(), true, JSON.stringify(await d.p.evaluate(() => {
        const card = document.querySelector('.feature-grid details'), panel = card.querySelector('p');
        return {events: window.featureHoverTrace, open: card.open, closing: card.className, hover: card.matches(':hover'), height: panel.getBoundingClientRect().height, animations: panel.getAnimations().map(a => ({state: a.playState, time: a.currentTime}))};
      })));
      // Resizing during a close must not leave a fixed height or a stale closing state behind.
      await d.p.mouse.move(0, 0); await d.p.setViewportSize({width: 1100, height: 900});
      await d.p.waitForFunction(() => !document.querySelector('.feature-grid details').open);
      assert.equal(await description.isHidden(), true);
      assert.deepEqual(d.errors, []); await d.ctx.close();
    });
    // the phone's bar: two straight rows in the longest languages too (the name and the main button, then the links with
    // the language and Inloggen), nothing wrapped, overlapping or off the screen
    await t.test('homepage bar on a phone: two rows that fit', async () => {
      for (const [lang, width] of [['ru', 390], ['es', 360], ['ar', 375], ['hi', 320]]) {
        const s = await page(browser, base, {lang, viewport: {width, height: 800}}); await s.go('/'); await s.p.waitForSelector('.hero');
        const r = await s.p.evaluate(() => {
          const seen = [...document.querySelectorAll('.bar .brand,.bar #enter,.nav a,.language,.signin')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect());
          const rows = [...new Set(seen.map(b => Math.round(b.top + b.height / 2)))].sort((a, b) => a - b);
          const gaps = rows.map(y => { const it = seen.filter(b => Math.round(b.top + b.height / 2) === y).sort((a, b) => a.left - b.left);
            return Math.min(99, ...it.slice(1).map((b, i) => b.left - it[i].right)); });
          return {rows: rows.length, gap: Math.min(...gaps), out: seen.filter(b => b.left < 0 || b.right > innerWidth).length,
            wrapped: [...document.querySelectorAll('.bar .brand,.bar #enter,.nav a,.signin')].filter(e => e.getClientRects().length > 1).length};
        });
        assert.deepEqual({rows: r.rows, out: r.out, wrapped: r.wrapped}, {rows: 2, out: 0, wrapped: 0}, `${lang} ${width}`);
        assert.ok(r.gap >= 5, `${lang} ${width}: gap ${r.gap}`);
        assert.equal(await overflow(s.p), 0); await s.ctx.close();
      }
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
      await s.ctx.route('**/api/config*', r => r.fulfill({json: {url: 'https://example.supabase.co', anon: 'x', login: ['google'], limit: 5, free: 2}}));
      await s.p.evaluate(() => localStorage.clear()).catch(() => {});
      await s.go('/'); await s.p.waitForSelector('.hero');
      // the bar's main button: into the app without the login window (the homepage already offers Inloggen); the hero has
      // no buttons of its own (removed at the user's wish)
      assert.equal(await s.p.locator('.hero-copy a').count(), 0);
      await s.p.click('#enter'); await s.p.waitForSelector('#plan .step'); await s.p.waitForTimeout(800);
      assert.equal(await s.p.locator('#welcome').isHidden(), true);
      assert.equal(new URL(s.p.url()).search, '');
      // returning learners on a phone also start with the homepage; saved progress never skips it
      await s.go('/'); await s.p.waitForSelector('.hero');
      assert.equal(new URL(s.p.url()).pathname, '/');
      await s.p.reload(); await s.p.waitForSelector('.hero');
      assert.equal(new URL(s.p.url()).pathname, '/');
      await s.go('/?home'); await s.p.waitForSelector('.hero');
      assert.equal(new URL(s.p.url()).pathname + new URL(s.p.url()).search, '/');
      // on a computer the site always opens with the homepage, also for someone who practises here: the bar's button
      // leads into the app, and the app's menu has Home as its first row (not on a phone)
      assert.match(await s.p.locator('#enter').getAttribute('href'), /^\/oefenen/);
      const d = await s.ctx.browser().newContext({viewport: {width: 1280, height: 800}, serviceWorkers: 'block'}), dp = await d.newPage();
      await dp.goto(base + '/over'); await dp.evaluate(() => { localStorage.setItem('ww-v1', '{}'); localStorage.setItem('ww-welcome', '1'); });
      await dp.goto(base + '/'); await dp.waitForSelector('.hero'); await dp.waitForTimeout(300);
      assert.equal(new URL(dp.url()).pathname, '/');
      await dp.click('#enter'); await dp.waitForSelector('#plan .step');
      assert.equal(await dp.locator('#tabs > a.hm').isVisible(), true);
      assert.equal(await dp.evaluate(() => document.querySelector('#tabs .lens').nextElementSibling.matches('a.hm[href="/"]')), true);
      await dp.click('#tabs a.hm'); await dp.waitForSelector('.hero'); await d.close();
      assert.equal(await s.p.locator('#tabs a.hm').count(), 0); // the phone page is the homepage here: no menu
      // back from a login or a payment: the app takes over
      await s.go('/?plus=stop'); await s.p.waitForSelector('#plan .step');
      assert.equal(new URL(s.p.url()).pathname, '/oefenen');
      // an installed app still enters practice, even when an older home-screen shortcut starts at /
      await s.p.addInitScript(() => Object.defineProperty(navigator, 'standalone', {value:true}));
      await s.go('/'); await s.p.waitForSelector('#plan .step');
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
    // axe-core's WCAG checks (names, labels, headings, contrast where it can tell, ARIA) on every kind of screen, light
    // and dark; the white tab names on the oranje lens are measured separately (axe can't read a gradient)
    await t.test('accessibility: axe finds nothing', async () => {
      const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8'), found = [];
      const check = async (name, url, prep, opt = {}) => {
        const s = await page(browser, base, opt); await s.go(url); await s.p.waitForTimeout(300);
        await s.p.locator('#app-loading').waitFor({state:'detached'});
        if (prep) { await prep(s.p); await s.p.waitForTimeout(200); }
        await s.p.addScriptTag({content: AXE});
        const v = await s.p.evaluate(() => axe.run(document).then(r => r.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(', ')}`)));
        v.forEach(x => found.push(`${name}: ${x}`));
        assert.deepEqual(s.errors, [], name); await s.ctx.close();
      };
      const tab = t => p => p.evaluate(t => setTab(t), t);
      for (const scheme of ['light', 'dark']) {
        await check(`homepage ${scheme}`, '/', null, {colorScheme: scheme});
        for (const t of ['vandaag', 'examen', 'oefenen', 'herhalen', 'profiel']) await check(`${t} ${scheme}`, '/oefenen', tab(t), {colorScheme: scheme});
        await check(`KNM answered ${scheme}`, '/oefenen', async p => { await p.evaluate(() => build('knm')); await p.locator('#play .opts button').first().click(); }, {colorScheme: scheme});
      }
      await check('KNM proefexamen', '/oefenen', p => p.evaluate(() => startExam('knm')));
      await check('login window', '/oefenen?open=login');
      await check('over', '/over'); await check('privacy dark', '/privacy', null, {colorScheme: 'dark'});
      await check('Arabic', '/oefenen', null, {lang: 'ar'});
      await check('desktop', '/oefenen', null, {viewport: {width: 1280, height: 800}, isMobile: false, hasTouch: false});
      assert.deepEqual(found, []);
      // the current tab's name, white on the oranje lens: at least 4.5:1 on every pixel behind it
      const s = await page(browser, base); await s.go('/oefenen'); await s.p.evaluate(() => setTab('examen')); await s.p.waitForTimeout(600);
      await s.p.locator('#app-loading').waitFor({state:'detached'});
      const box = await s.p.locator('.tabs button[data-t="examen"] span:not([aria-hidden])').last().boundingBox();
      await s.p.addStyleTag({content: '.tabs button *{visibility:hidden!important}'});
      const png = (await s.p.screenshot({clip: box})).toString('base64');
      const min = await s.p.evaluate(async png => {
        const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
        const c = Object.assign(document.createElement('canvas'), {width: img.width, height: img.height}), g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data, L = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
        let low = 99;
        for (let i = 0; i < d.length; i += 4) low = Math.min(low, 1.05 / (.2126 * L(d[i]) + .7152 * L(d[i + 1]) + .0722 * L(d[i + 2]) + .05));
        return low;
      }, png);
      assert.ok(min >= 4.5, `white on the lens: ${min.toFixed(2)}:1`);
      await s.ctx.close();
    });
  } finally { await browser.close(); server.close(); }
});

// The anonymous counts: the app counts a device once a day ("new" only without progress), the homepage its own day and
// its buttons; nothing at all with Global Privacy Control, and nothing when the server doesn't offer it (cfg.events)
test('Usage counts: once a day, nothing with Global Privacy Control', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const state = {events: [], config: {url: 'https://supa.example', anon: 'x', login: [], limit: 5, free: 0, events: 1}};
  const server = await serve(state), base = `http://127.0.0.1:${server.address().port}`;
  try {
    const s = await page(browser, base);
    // a cached config from before the counts, and the server not keeping the first one (the table not made yet): sent
    // again at the next start, then once only
    await s.p.addInitScript(() => { if (!sessionStorage.getItem('seen')) { sessionStorage.setItem('seen', 1);
      localStorage.setItem('ww-acc-cfg', JSON.stringify({url: 'https://supa.example', anon: 'x', login: [], limit: 5, free: 0})); } });
    state.fail = true;
    await s.go('/oefenen'); await s.p.waitForTimeout(2200);
    assert.deepEqual(state.events.map(e => e.ev), ['open']);
    assert.equal(await s.p.evaluate(() => localStorage.getItem('ww-day')), null);
    state.fail = false; state.events.length = 0;
    await s.p.reload(); await s.p.waitForTimeout(2200);
    await s.p.reload(); await s.p.waitForTimeout(2200); // the same day again: not counted twice
    assert.deepEqual(state.events.map(e => e.ev), ['open', 'new']);
    assert.deepEqual(Object.keys(state.events[0]).sort(), ['ev', 'lvl', 'ui']);
    await s.p.evaluate(() => startExam('knm', true)); await s.p.waitForTimeout(300);
    assert.equal(state.events.at(-1).ev, 'exam_knm');
    state.events.length = 0;
    await s.go('/?home'); await s.p.waitForTimeout(600);
    await Promise.all([s.p.waitForURL(/oefenen/), s.p.locator('a.button.primary[href="/oefenen?open=today"]').first().click()]);
    await s.p.waitForTimeout(400);
    assert.deepEqual(state.events.map(e => e.ev), ['home', 'begin']);
    await s.ctx.close();
    state.events.length = 0;
    const g = await page(browser, base); await g.p.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', {value: true}));
    await g.go('/oefenen'); await g.p.waitForTimeout(2200); await g.go('/?home'); await g.p.waitForTimeout(600);
    assert.deepEqual(state.events, []);
    await g.ctx.close();
    state.config = {}; const n = await page(browser, base); await n.go('/oefenen'); await n.p.waitForTimeout(2200);
    assert.deepEqual(state.events, []); await n.ctx.close();
  } finally { await browser.close(); server.close(); }
});

// The owner's overview: with a session it asks /api/admin with the access token and shows the accounts, the study time
// and the anonymous counts; a row opens its days; axe finds nothing
test('The owner overview shows accounts and study time', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const d = new Date(), day = Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5), now = new Date().toISOString();
  const state = {config: {url: 'https://supa.example', anon: 'x', login: [], limit: 5, free: 0},
    admin: {users: [
      {email: 'anna@example.nl', name: 'Anna de Vries', created: now, login: now, seen: now, lvl: 'A2', items: 120, right: 90, wrong: 30,
        res: {knm: {n: 3, pc: 72, at: Date.now()}}, tm: {[day]: 1500, [day - 1]: 600, [day - 30]: 300}, qd: {[day]: 12, [day - 2]: 8}, qr: {[day]: 9, [day - 2]: 8}, checks: 4, checks7: 2, plus: null},
      {email: 'omar@example.nl', name: null, created: now, login: now, seen: null, lvl: 'B1', items: 0, right: 0, wrong: 0, res: null, tm: null, qd: null, qr: null, checks: 0, checks7: 0, plus: 'active'}],
    counts: [{day: now.slice(0, 10), ev: 'open', lvl: 'A2', ui: 'nl', n: 5}, {day: now.slice(0, 10), ev: 'exam_knm', lvl: 'A2', ui: 'ru', n: 2}]}};
  const server = await serve(state), base = `http://127.0.0.1:${server.address().port}`;
  try {
    const s = await page(browser, base, {viewport: {width: 1280, height: 800}, isMobile: false, hasTouch: false});
    await s.p.addInitScript(() => localStorage.setItem('sb-supa-auth-token', JSON.stringify({access_token: 'tok-1', refresh_token: 'r', token_type: 'bearer',
      expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 36000, user: {id: 'u1', email: 'eigenaar@example.nl', aud: 'authenticated'}})));
    await s.go('/admin'); await s.p.waitForSelector('tr.u');
    assert.equal(state.adminAuth, 'Bearer tok-1');
    const text = await s.p.textContent('main');
    assert.match(text, /Anna de Vries/); assert.match(text, /anna@example\.nl/); assert.match(text, /35 мин/); // 25 today + 10 yesterday in 7 days
    assert.match(text, /KNM ×3 · 72%/); assert.match(text, /12 \(75%\)/); assert.match(text, /20 \(85%\)/); assert.match(text, /120 \(75%\)/); // today, 7 days, in all assert.match(text, /Без имени/);
    await s.p.locator('tr.u').first().click(); await s.p.waitForSelector('tr.detail .days');
    // two charts of the last 30 days: devices a day and study minutes a day; a column tells its value on hover and focus
    assert.equal(await s.p.locator('figure.chart').count(), 2);
    assert.equal(await s.p.locator('figure.chart .col').count(), 60);
    await s.p.locator('figure.chart').nth(1).locator('.col').last().hover();
    assert.match(await s.p.textContent('.tip'), /25 мин/);
    assert.equal(await s.p.locator('figure.chart').first().locator('.col').last().getAttribute('aria-label').then(a => / 5 устр\.$/.test(a)), true);
    assert.equal(await overflow(s.p), 0);
    const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
    await s.p.addScriptTag({content: AXE});
    assert.deepEqual(await s.p.evaluate(() => axe.run(document).then(r => r.violations.map(v => v.id + ': ' + v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(', ')))), []);
    // an older admin_overview() in the database (no qd): the page says so instead of showing dashes without a reason
    assert.equal(await s.p.locator('.tile.warn').count(), 0);
    state.admin.users.forEach(u => { delete u.qd; delete u.qr; });
    await s.p.locator('#re').click(); await s.p.waitForSelector('.tile.warn');
    assert.deepEqual(s.errors, []); await s.ctx.close();
    // without a session it asks to log in, and never calls /api/admin
    state.adminAuth = undefined;
    const g = await page(browser, base, {viewport: {width: 1280, height: 800}, isMobile: false, hasTouch: false});
    await g.go('/admin'); await g.p.waitForSelector('.msg a[href="/oefenen?open=login"]');
    assert.equal(state.adminAuth, undefined); await g.ctx.close();
  } finally { await browser.close(); server.close(); }
});

test('Bittie gets an update notification when a new worker reuses the existing cache', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const state = {}, server = await serve(state), base = `http://127.0.0.1:${server.address().port}`;
  try {
    const s = await page(browser, base, {serviceWorkers:'allow'});
    try {
      await s.go('/oefenen?open=today');
      await s.p.locator('#app-loading').waitFor({state:'detached'});
      await s.p.waitForFunction(async () => (await caches.open('nl-a2-v12')).match('/oefenen'));
      await s.p.evaluate(() => navigator.serviceWorker.ready);
      await s.p.waitForFunction(() => !!navigator.serviceWorker.controller);
      assert.equal(await s.p.locator('#fresh').count(), 0);
      state.knm='eeeeeeeeee'; state.workerRevision='2';
      await s.p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
      await s.p.locator('#fresh').waitFor({state:'visible', timeout:20000});
      assert.ok(await s.p.evaluate(async () => (await (await caches.open('nl-a2-v12')).match('/oefenen')).text().then(html=>html.includes('/data/knm.js?v=eeeeeeeeee'))));
      await s.p.locator('#fresh button').click();
      await s.p.locator('#app-loading').waitFor({state:'detached'});
      assert.equal(await s.p.locator('#plan .step').count() > 0, true);
    } finally { await s.ctx.close(); }
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
    assert.ok(files.length >= 7);
    assert.equal(files.some(f => f.startsWith('/data/ui.js')), false, 'the translations are not loaded for Dutch');
    let c = await wait(c => c.includes('/oefenen') && c.includes('/art/bittie-loading-v1.webp') && c.includes('/art/bittie-dance-v1.webp') && files.every(f => c.includes(f)));
    assert.ok(files.every(f => c.includes(f)), 'the page\'s files are cached');
    assert.ok(c.includes('/art/bittie-loading-v1.webp'), 'Bittie is available for offline startup');
    assert.ok(c.includes('/art/bittie-dance-v1.webp'), 'the frame animation is available offline');
    // A slow navigation refresh must not keep an installed app on its native blank launch screen.
    await s.p.waitForFunction(() => !!navigator.serviceWorker.controller);
    let release;
    state.holdApp = new Promise(ok => { release=ok; });
    try {
      await s.p.reload({waitUntil:'commit', timeout:1500});
      await s.p.locator('#app-loading').waitFor({state:'visible', timeout:1000});
      await s.p.waitForFunction(() => document.querySelector('#app-loading img')?.naturalWidth > 0, null, {timeout:1000});
      assert.match(await s.p.locator('#app-loading img').evaluate(e=>e.currentSrc), /\/bittie-dance-v1\.webp$/);
    } finally { state.holdApp=null; release(); }
    await s.p.locator('#app-loading').waitFor({state:'detached'});
    await s.ctx.setOffline(true); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    await s.ctx.setOffline(false);
    // an update: the page asks for another version of one file
    state.knm = 'ffffffffff';
    await s.p.reload(); await s.p.waitForSelector('#plan .step');
    c = await wait(c => c.includes('/data/knm.js?v=ffffffffff') && c.filter(x => x.startsWith('/data/knm.js')).length === 1);
    assert.deepEqual(c.filter(x => x.startsWith('/data/knm.js')), ['/data/knm.js?v=ffffffffff'], 'only the version the stored page uses');
    await s.ctx.setOffline(true); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    assert.equal(await s.p.evaluate(() => KNM.length > 400), true);
    // in another language the translations come too, and stay for offline use
    await s.ctx.setOffline(false);
    await s.p.evaluate(() => localStorage.setItem('ww-ui', 'ar')); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    await s.p.waitForFunction(() => document.querySelector('#tabs button[data-t=examen] span').textContent !== 'Examen');
    c = await wait(c => c.some(x => x.startsWith('/data/ui.js')));
    await s.ctx.setOffline(true); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    await s.p.waitForFunction(() => document.querySelector('#tabs button[data-t=examen] span').textContent !== 'Examen');
    assert.deepEqual(s.errors.filter(e => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e)), []);
    await s.ctx.close();
  } finally { await browser.close(); server.close(); }
});

test('Weekly free allowance, browser trial and daily Plus counters remain distinct',async t=>{
  let browser;
  try{browser=chromium&&await chromium.launch()}catch(e){if(process.env.BROWSER_TESTS)throw e}
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const config={url:'https://example.supabase.co',anon:'fixture',login:[],limit:7,period:'week',free:2,freePeriod:'once',plus:{limit:60,price:'9,99',plans:{A2:{price:'9,99'},B1:{price:'14,99'}}}};
  const state={config,allowance:{free:1},plus:null},server=await serve(state),base=`http://127.0.0.1:${server.address().port}`;
  try{
    const s=await page(browser,base,{lang:'en'});await s.go('/');
    await s.p.waitForFunction(()=>document.querySelector('#free-checks').textContent.includes('7 checks a week'));
    assert.match(await s.p.locator('#trial-checks').textContent(),/2 one-time trial checks/);
    await s.go('/oefenen?open=today');await s.p.waitForFunction(()=>acc.free===1);
    await s.p.reload();await s.p.waitForFunction(()=>acc.free===1);
    const now=new Date(),day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam'}).format(now),week=new Date(day+'T12:00:00Z');
    week.setUTCDate(week.getUTCDate()-(week.getUTCDay()+6)%7);
    state.allowance={dailyUsed:12,weeklyUsed:3,day,week:week.toISOString().slice(0,10)};
    await s.p.evaluate(async cfg=>{
      acc.cfg=cfg;acc.user={id:'quota-test',email:'quota@example.test'};
      acc.sb={auth:{getSession:async()=>({data:{session:{access_token:'fixture'}}})}};
      S.lvl='A2';await usage();setTab('profiel');
    },config);
    await s.p.waitForFunction(()=>document.querySelector('#prof').textContent.includes('Checks this week: 4 of 7 left'));
    state.plus={status:'active',level:'A2'};
    await s.p.evaluate(async()=>{await usage();drawProfile()});
    await s.p.waitForFunction(()=>document.querySelector('#prof').textContent.includes('Checks left today: 48 of 60'));
    await s.p.evaluate(()=>{S.lvl='B1';drawProfile()});
    await s.p.waitForFunction(()=>document.querySelector('#prof').textContent.includes('Checks this week: 4 of 7 left'));
    await s.ctx.route('**/api/check',r=>r.fulfill({json:{tasks:[{passed:true}],left:0,limit:7,period:'week',checkedAt:new Date().toISOString()}}));
    await s.p.evaluate(async()=>{await nakijken([{task:'Test',text:'Ik kom morgen.'}],'wb');drawProfile()});
    await s.p.waitForFunction(()=>document.querySelector('#prof').textContent.includes('Checks this week: 0 of 7 left'));
    assert.equal(await s.p.evaluate(()=>checksLeft('wr')),48,'B1 free checks leave A2 paid checks intact');
    await s.p.evaluate(()=>{S.lvl='A2';plusScreen()});
    await s.p.waitForFunction(()=>document.querySelector('#tbody').textContent.includes('60 checks a day. With a free account: 7 a week'));
    assert.equal(await overflow(s.p),0);assert.deepEqual(s.errors,[]);await s.ctx.close();
  }finally{await browser.close();await new Promise(ok=>server.close(ok))}
});

test('Monthly A2 and B1 offers fit the homepage and the app sends the selected level',async t=>{
  let browser;
  try{browser=chromium&&await chromium.launch()}catch(e){if(process.env.BROWSER_TESTS)throw e}
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const config={limit:7,period:'week',free:2,freePeriod:'once',plus:{limit:60,price:'9,99',plans:{A2:{price:'9,99'},B1:{price:'14,99'}}}};
  const server=await serve({config}),base=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const [lang,width] of [['nl',1280],['ru',390],['ar',375],['hi',320]]){
      const s=await page(browser,base,{lang,viewport:{width,height:900}});await s.go('/');
      await s.p.waitForFunction(()=>!document.querySelector('#plus-b1-card').hidden);
      assert.match(await s.p.locator('#plus-price').textContent(),/9,99/);
      assert.match(await s.p.locator('#plus-b1-price').textContent(),/14,99/);
      assert.equal(await overflow(s.p),0);assert.deepEqual(s.errors,[]);await s.ctx.close();
    }
    const s=await page(browser,base);await s.go('/oefenen');await s.p.waitForSelector('#plan .step');
    let chosen;
    await s.ctx.route('**/api/plus',async r=>{chosen=r.request().postDataJSON();await r.fulfill({json:{url:'about:blank'}})});
    await s.p.evaluate(cfg=>{acc.cfg=cfg;acc.user={id:'pricing-test'};acc.sb={auth:{getSession:async()=>({data:{session:{access_token:'test'}}})}};plusScreen()},config);
    assert.match(await s.p.locator('[data-plus-plan="A2"]').textContent(),/9,99/);
    assert.match(await s.p.locator('[data-plus-plan="B1"]').textContent(),/14,99/);
    await s.p.locator('[data-plus-buy="B1"]').click();await s.p.waitForURL('about:blank');
    assert.deepEqual(chosen,{go:'buy',level:'B1'});assert.deepEqual(s.errors,[]);await s.ctx.close();
  }finally{await browser.close();await new Promise(ok=>server.close(ok))}
});
