// The dictionary in parts: a word loads only the parts it needs, and gives the same entries as the whole dictionary.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { app, root } from './app-harness.mjs';

const fetched = [];
const fetchDict = async url => {
  const m = /^\/dict\/nl-en\/(.)\.txt\?v=/.exec(url);
  if (m) { fetched.push(m[1]); return new Response(fs.readFileSync(new URL(`dict/nl-en/${m[1]}.txt`, root), 'utf8')); }
  return new Response(JSON.stringify(url === '/api/config' ? {} : []));
};

test('The app and dict/split.py put a word in the same part', async () => {
  const words = ['huis', 'Amsterdam', 'één', 'ĳs', "'s-Hertogenbosch", 'Ångström', '112', 'İstanbul', 'zó'];
  const py = execFileSync('python3', ['-I', '-B', '-c', `import sys,json;sys.path.insert(0,"dict");from split import shard;print(json.dumps([shard(w) for w in json.loads(sys.argv[1])]))`, JSON.stringify(words)],
    {cwd: new URL('.', root)}).toString();
  const a = await app();
  assert.deepEqual(JSON.parse(a.run(`JSON.stringify(${JSON.stringify(words)}.map(dshard))`)), JSON.parse(py));
});

test('A tapped word loads a few parts, not the whole dictionary', async () => {
  fetched.length = 0;
  const a = await app({fetch: fetchDict});
  const E = await a.run('lookUp("ging","Hij ging gisteren naar huis.")');
  assert.ok(E.some(e => e.l === 'gaan'), 'a form leads to its word');
  assert.ok(fetched.length < 10, `loaded ${fetched.length} parts`);
  const sep = await a.run('lookUp("bel","Ik bel je morgen op.")');
  assert.equal(sep[0].l, 'opbellen');
});

test('Looking up in parts gives the same as the whole dictionary', async () => {
  const a = await app({fetch: fetchDict}), b = await app({fetch: fetchDict});
  await b.run('Promise.all(DSH.map(dictPart))');
  // sentences from the built-in books, every word tapped
  const sents = JSON.parse(a.run('JSON.stringify(BOOKS.slice(0,2).flatMap(x=>x.c.slice(0,2)).flatMap(c=>c[1].split(/(?<=[.!?])\\s+/)).slice(0,40))'));
  let n = 0;
  for (const s of sents) for (const w of s.match(/[\p{L}']+/gu) || []) {
    const x = JSON.stringify(await a.run(`lookUp(${JSON.stringify(w)},${JSON.stringify(s)})`));
    const y = JSON.stringify(b.run(`define(${JSON.stringify(w)},${JSON.stringify(s)})`));
    assert.equal(x, y, `${w} in: ${s}`); n++;
  }
  assert.ok(n > 200);
});

test('The page has the current version of the scripts and the dictionary parts', () => {
  execFileSync('node', ['tools/stamp.mjs', '--check'], {cwd: new URL('.', root)});
});
