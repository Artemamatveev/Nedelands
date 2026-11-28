// The themed word list (WT in data/a2.js) and its meanings in the menu languages (dict/wt/<lang>.txt): every word has
// one line in every language, nothing extra, and the words are unique (their keys wn|, wt|, wl| are stored progress).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const LANGS = ['en', 'ar', 'tr', 'hi', 'zh', 'es', 'ru', 'uk'];
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('data/a2.js', root), 'utf8') + '\n;globalThis.__=WT', ctx);
const words = ctx.__.flatMap(([, list]) => list.split('|').map(x => x.split('=')));

test('Every themed word is unique and has a Dutch description', () => {
  const seen = new Set();
  for (const [w, d, extra] of words) {
    assert.ok(w && d && extra === undefined, `bad entry ${w}=${d}`);
    assert.ok(!seen.has(w), `twice: ${w}`); seen.add(w);
  }
  assert.ok(words.length >= 1900, `${words.length} words`);
});

test('Every themed word has its meaning in every menu language, and nothing else is listed', () => {
  const nl = new Set(words.map(x => x[0]));
  for (const l of LANGS) {
    const m = new Map(fs.readFileSync(new URL(`dict/wt/${l}.txt`, root), 'utf8').split('\n').filter(Boolean).map(x => {
      const i = x.indexOf('\t'); return [x.slice(0, i), x.slice(i + 1)];
    }));
    for (const w of nl) assert.ok((m.get(w) || '').trim(), `${l}: no meaning for ${w}`);
    for (const w of m.keys()) assert.ok(nl.has(w), `${l}: ${w} is not in WT`);
  }
});

test('Corrected glossary terms retain the original progress keys in all three practice modes', async () => {
  const { app } = await import('./app-harness.mjs');
  const a = await app();
  for (const [oldLabel, label] of [
    ['de gips', 'het gips'],
    ['het tijdelijk contract', 'het tijdelijke contract'],
    ['het vast contract', 'het vaste contract'],
  ]) {
    for (const prefix of ['wn', 'wt', 'wl']) {
      const key = JSON.stringify(prefix + '|' + oldLabel);
      assert.equal(a.run(`ITEMS.find(q=>q.k===${key})?.tts || ITEMS.find(q=>q.k===${key})?.hear`), label);
    }
  }
});
