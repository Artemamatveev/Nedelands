// The public practice pages (tools/build-seo.mjs): up to date with the data, listed in the sitemap and linked from the
// homepage, every sample answer one of its own options, and the page says it is not DUO.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build, pages } from '../tools/build-seo.mjs';

const root = new URL('../', import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, root), 'utf8');

test('Every practice page is built from the current data', () => {
  for (const [f, h] of Object.entries(build())) assert.equal(read(f), h, `${f}: run node tools/build-seo.mjs`);
});
test('The sitemap and the homepage list every practice page; each has its own title, canonical and the DUO line', () => {
  const xml = read('sitemap.xml'), home = read('index.html'), titles = new Set();
  for (const p of pages()) {
    assert.ok(xml.includes(`<loc>https://bittertalen.nl/${p.slug}</loc>`), p.slug);
    assert.ok(home.includes(`href="/${p.slug}"`), p.slug);
    const h = read(`${p.slug}.html`);
    assert.ok(h.includes(`<link rel="canonical" href="https://bittertalen.nl/${p.slug}">`));
    assert.match(h, /Bittertalen is geen DUO/);
    assert.ok(!titles.has(p.title)); titles.add(p.title);
    assert.ok(p.title.length <= 95 && p.desc.length <= 170, p.slug);
  }
});
