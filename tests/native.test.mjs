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
test('Inside the store apps there are no purchases or prices', () => {
  const page = read('oefenen.html');
  assert.match(page, /const canOffer=\(\)=>!NATIVE&&/);
  assert.match(page, /\$\{NATIVE\?"":row\("prices","Prijzen"\)/);
  assert.match(page, /if\(NATIVE\)\{\$\("tbody"\)\.innerHTML=`<h2 id="plusS">/);
});

test('The iPhone app opens offline: the site and its service worker are an App-Bound Domain', () => {
  const cfg = JSON.parse(fs.readFileSync(new URL('../native/capacitor.config.json', import.meta.url), 'utf8'));
  assert.equal(cfg.ios.limitsNavigationsToAppBoundDomains, true);
  const plist = fs.readFileSync(new URL('../native/ios/App/App/Info.plist', import.meta.url), 'utf8');
  const domains = (plist.match(/<key>WKAppBoundDomains<\/key>\s*<array>([\s\S]*?)<\/array>/) || [])[1] || '';
  for (const d of ['bittertalen.nl', 'localhost', 'www.youtube-nocookie.com']) assert.ok(domains.includes(`<string>${d}</string>`), d);
  assert.ok((domains.match(/<string>/g) || []).length <= 10, 'iOS allows at most 10');
});
