// The homepage in every menu language at its own address (/en … /ru, tools/build-lang.mjs), linked to each other with
// hreflang so search engines show the right one.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LANGS, build, file, url, hreflang } from '../tools/build-lang.mjs';

const root = new URL('../', import.meta.url);
const read = f => fs.readFileSync(new URL(f, root), 'utf8');
const ALL = ['nl', ...LANGS];
const page = l => read(l === 'nl' ? 'index.html' : file(l));

test('Every language page is up to date with index.html and landing.js', () => {
  for (const l of LANGS) assert.equal(page(l), build(l), `${file(l)}: run node tools/build-lang.mjs`);
});

test('Every homepage links all languages and itself as canonical', () => {
  for (const l of ALL) {
    const html = page(l);
    assert.ok(html.includes(`<link rel="canonical" href="${url(l)}">`), `${l} canonical`);
    assert.match(html, new RegExp(`<html lang="${hreflang(l)}"`), `${l} html lang`);
    for (const o of ALL) assert.ok(html.includes(`<link rel="alternate" hreflang="${hreflang(o)}" href="${url(o)}">`), `${l} → ${o}`);
    assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${url('nl')}">`), `${l} x-default`);
  }
});

test('A language page carries no Dutch interface text and keeps the original for landing.js', () => {
  for (const l of LANGS) {
    const html = page(l);
    assert.equal((html.match(/\sdata-t>/g) || []).length, 0, l);
    assert.ok((html.match(/\sdata-t="/g) || []).length > 40, l);
    assert.ok(html.includes(`data-page="${l}"`), l);
  }
});

test('The sitemap lists every language with its alternates', () => {
  const xml = read('sitemap.xml');
  for (const l of ALL) {
    assert.ok(xml.includes(`<loc>${url(l)}</loc>`), l);
    assert.equal(xml.split(`hreflang="${hreflang(l)}" href="${url(l)}"`).length - 1, ALL.length, l);
  }
});

test('The book excerpt exposes just one copy of the dictionary word before scripts run', () => {
  for (const l of ALL) {
    const paragraph = page(l).match(/<p>Maar Lena[^<]*(?:<[^>]+>[^<]*)*?<\/p>/)?.[0];
    assert.ok(paragraph, l);
    assert.equal(paragraph.replace(/<[^>]*>/g, '').match(/woordenboek/g)?.length, 1, l);
    assert.match(paragraph, /data-book-word disabled>woordenboek<\/button>/, l);
  }
});
