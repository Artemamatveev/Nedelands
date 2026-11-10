// The public homepage and the menu translations: every string has all seven translations, and the numbers on the
// homepage stay true when content changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { app, root } from './app-harness.mjs';

const read = f => fs.readFileSync(new URL(f, root), 'utf8');
const decode = s => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

function landingCopy() {
  const js = read('landing.js');
  const block = js.slice(js.indexOf('const copy = {'), js.indexOf('};', js.indexOf('const copy = {')) + 2);
  return vm.runInNewContext(block.replace('const copy =', 'copy =') + ';copy', {});
}

test('Every homepage text has all seven translations', () => {
  const html = read('index.html'), copy = landingCopy();
  const texts = [...html.matchAll(/<(\w+)[^>]*\sdata-t(?:\s[^>]*)?>([^<]*)</g)].map(m => decode(m[2]))
    .concat([...html.matchAll(/data-alt="([^"]*)"/g)].map(m => decode(m[1])));
  assert.ok(texts.length > 40);
  const missing = texts.filter(t => !(copy[t] && copy[t].length === 7 && copy[t].every(Boolean)));
  assert.deepEqual(missing, []);
});

test('Every app menu string has all seven translations', async () => {
  const a = await app();
  const bad = a.run('Object.entries(UI).filter(([k,v])=>!Array.isArray(v)||v.length!==7||v.some(x=>typeof x!=="string"||!x)).map(([k])=>k)');
  assert.deepEqual([...bad], []);
});

test('The numbers on the homepage are true', async () => {
  const a = await app(), html = read('index.html');
  const n = s => Number(html.match(new RegExp(`<b dir="ltr">(\\d+)\\+?</b><span data-t>${s}`))[1]);
  assert.ok(a.run('ITEMS.length') >= n('oefenvragen'));
  assert.ok(a.run('ITEMS.filter(x=>x.sec==="knm").length') >= n('KNM-vragen'));
  assert.equal(a.run('S.lvl="A2";parts().length'), n('proefexamens per niveau'));
  assert.equal(a.run('S.lvl="B1";parts().length'), n('proefexamens per niveau'));
  assert.ok(a.run('GP.length') >= n('gesprekken'));
});

test('The manifest has installable icons that exist', () => {
  const m = JSON.parse(read('manifest.json'));
  for (const size of ['192x192', '512x512']) assert.ok(m.icons.some(i => i.sizes === size && i.purpose !== 'maskable'), size);
  assert.ok(m.icons.some(i => i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(fs.existsSync(new URL(i.src.slice(1), root)), i.src);
});
