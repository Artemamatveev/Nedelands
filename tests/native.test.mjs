// The store apps (native/): a Capacitor shell around bittertalen.nl/oefenen. The page's native parts must use plugins the
// shell installs, and the shell must load the live site, never a copy of it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = f => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
test('The shell loads the live practice page and installs every plugin the page uses', () => {
  const cfg = JSON.parse(read('native/capacitor.config.json')), pkg = JSON.parse(read('native/package.json')), page = read('oefenen.html');
  assert.match(cfg.server.url, /^https:\/\/bittertalen\.nl\/oefenen/);
  assert.equal(cfg.appId, 'nl.bittertalen.app');
  for (const [plugin, name] of [['Browser', '@capacitor/browser'], ['LocalNotifications', '@capacitor/local-notifications']]) {
    assert.ok(page.includes(`Capacitor.Plugins?.${plugin}`), plugin);
    assert.ok(pkg.dependencies[name], name);
  }
  assert.ok(fs.existsSync(new URL('../native/www/offline.html', import.meta.url)));
  assert.match(read('.vercelignore'), /^native$/m, 'the shell is not deployed with the site');
});
test('Inside the store apps only the store sells: no website prices, Stripe or links to buying', () => {
  const page = read('oefenen.html'), pkg = JSON.parse(read('native/package.json'));
  assert.match(page, /const canOffer=\(\)=>!NATIVE&&/);
  assert.match(page, /\$\{NATIVE\?"":row\("prices","Prijzen"\)/);
  // the store's own purchase (RevenueCat's plugin) when the build has it; older builds keep the screen without prices
  assert.match(page, /if\(NATIVE&&storeOK\(\)\)return storeScreen\(choice\);\n  if\(NATIVE\)\{\$\("tbody"\)\.innerHTML=`<h2 id="plusS">/);
  assert.ok(pkg.dependencies['@revenuecat/purchases-capacitor']);
  const store = page.slice(page.indexOf('async function storeScreen('), page.indexOf('function plusScreen('));
  assert.ok(store.length > 1000);
  for (const bad of ['Stripe', '€', 'acc.cfg.pass.plans', 'acc.cfg.year.plans', 'location.href', '/?home', 'go:"buy"', 'go:"pass"'])
    assert.ok(!store.includes(bad), bad);
  assert.match(store, /priceString/, 'prices come from the store');
  assert.match(store, /Aankopen herstellen/, 'Apple requires a restore button');
  assert.match(store, /href="\/voorwaarden"/);assert.match(store, /href="\/privacy"/);
  assert.equal((store.match(/class="\$\{x\.id===first\?"btn":"ghost"\}/g) || []).length, 1, 'one filled button: the recommended plan');
});

test('The iPhone app opens offline: the site and its service worker are an App-Bound Domain', () => {
  const cfg = JSON.parse(fs.readFileSync(new URL('../native/capacitor.config.json', import.meta.url), 'utf8'));
  assert.equal(cfg.ios.limitsNavigationsToAppBoundDomains, true);
  const plist = fs.readFileSync(new URL('../native/ios/App/App/Info.plist', import.meta.url), 'utf8');
  const domains = (plist.match(/<key>WKAppBoundDomains<\/key>\s*<array>([\s\S]*?)<\/array>/) || [])[1] || '';
  for (const d of ['bittertalen.nl', 'localhost', 'www.youtube-nocookie.com']) assert.ok(domains.includes(`<string>${d}</string>`), d);
  assert.ok((domains.match(/<string>/g) || []).length <= 10, 'iOS allows at most 10');
});
