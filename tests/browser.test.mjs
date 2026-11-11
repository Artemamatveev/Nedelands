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
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch {}

// state.knm: another version of data/knm.js in the page's address, as after an update
function serve(state = {}) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (state.knm && (p === '/oefenen' || p === '/oefenen.html')) {
      res.writeHead(200, {'content-type': TYPES['.html']});
      return res.end(fs.readFileSync(path.join(ROOT, 'oefenen.html'), 'utf8').replace(/\/data\/knm\.js\?v=[0-9a-f]+/, '/data/knm.js?v=' + state.knm));
    }
    if (p === '/api/config') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify(state.config || {})); }
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
    // axe-core's WCAG checks (names, labels, headings, contrast where it can tell, ARIA) on every kind of screen, light
    // and dark; the white tab names on the oranje lens are measured separately (axe can't read a gradient)
    await t.test('accessibility: axe finds nothing', async () => {
      const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8'), found = [];
      const check = async (name, url, prep, opt = {}) => {
        const s = await page(browser, base, opt); await s.go(url); await s.p.waitForTimeout(300);
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
        res: {knm: {n: 3, pc: 72, at: Date.now()}}, tm: {[day]: 1500, [day - 1]: 600, [day - 30]: 300}, checks: 4, checks7: 2, plus: null},
      {email: 'omar@example.nl', name: null, created: now, login: now, seen: null, lvl: 'B1', items: 0, right: 0, wrong: 0, res: null, tm: null, checks: 0, checks7: 0, plus: 'active'}],
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
    assert.match(text, /KNM ×3 · 72%/); assert.match(text, /Без имени/);
    await s.p.locator('tr.u').first().click(); await s.p.waitForSelector('tr.detail .days');
    assert.equal(await overflow(s.p), 0);
    const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
    await s.p.addScriptTag({content: AXE});
    assert.deepEqual(await s.p.evaluate(() => axe.run(document).then(r => r.violations.map(v => v.id + ': ' + v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(', ')))), []);
    assert.deepEqual(s.errors, []); await s.ctx.close();
    // without a session it asks to log in, and never calls /api/admin
    state.adminAuth = undefined;
    const g = await page(browser, base, {viewport: {width: 1280, height: 800}, isMobile: false, hasTouch: false});
    await g.go('/admin'); await g.p.waitForSelector('.msg a[href="/oefenen?open=login"]');
    assert.equal(state.adminAuth, undefined); await g.ctx.close();
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
