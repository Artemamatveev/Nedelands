// Public practice pages for search (oefenen-*.html, served at /knm-oefenen, /a2-lezen-oefenen, …): what the exam part
// is, a few real questions from the app's own bank that anyone can try without an account (the answer opens under
// each question), and a way into the app at that part. The study app itself is JavaScript and invisible to search
// engines; these pages are plain HTML. Run `node tools/build-seo.mjs` after changing the texts here or the data files
// the samples come from; tests/seo-pages.test.mjs fails when a page is out of date. Dutch only for now: the exam is Dutch.
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (f) => fs.readFileSync(new URL(f, root), 'utf8');
const SITE = 'https://bittertalen.nl';

export function data() {
  const ctx = vm.createContext({});
  for (const f of ['data/knm.js', 'data/a2.js', 'data/b1.js'])
    vm.runInContext(read(f) + '\n;globalThis.__=Object.assign(globalThis.__||{},{' +
      ['KNM', 'WR', 'SP', 'LZ', 'LS', 'LSM', 'LZ1', 'LSB', 'WRB', 'SPB'].map((k) => `${k}:typeof ${k}!=="undefined"?${k}:undefined`).join(',') + '})', ctx);
  return ctx.__;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const para = (t) => esc(t).split('\n').filter(Boolean).map((l) => `<p>${l}</p>`).join('');
// the options in a fixed order that doesn't put the right one always first (the same on every build)
const order = (q, i) => { const o = [q.right, ...q.wrong]; const s = i % 3; return [...o.slice(s), ...o.slice(0, s)]; };
const mc = (q, i) => `<li class="q"><p class="qq">${esc(q.q)}</p><ol class="opts" type="A">${order(q, i).map((o) => `<li>${esc(o)}</li>`).join('')}</ol>
<details><summary>Bekijk het antwoord</summary><p><b>${esc(q.right)}</b>${q.why ? ` · ${esc(q.why)}` : ''}</p></details></li>`;

export function pages(D = data()) {
  // KNM: one question from each of the first themes, so the sample shows the spread of the exam
  const seen = new Set(), knm = [];
  for (const r of D.KNM.slice(0, 235)) if (!seen.has(r[0]) && knm.length < 6) { seen.add(r[0]); knm.push({ q: r[1], right: r[2], wrong: [r[3], r[4]], why: r[5], theme: r[0] }); }
  const lz = D.LZ.slice(0, 2), lz1 = D.LZ1.slice(0, 1);
  const ls = D.LS.slice(0, 5).map((r) => ({ q: r[1], right: r[2], wrong: [r[3], r[4]], say: r[0] }));
  const reading = (T) => T.map((r) => `<section class="tekst"><div class="doc">${para(r[0])}</div><ol class="qs">${r[1].map((x, i) => mc({ q: x[0], right: x[1], wrong: [x[2], x[3]] }, i)).join('')}</ol></section>`).join('');
  const listen = ls.map((x, i) => `<li class="q"><details class="say"><summary>Lees wat je hoort</summary><p>${esc(typeof x.say === 'string' ? x.say : '')}</p></details><p class="qq">${esc(x.q)}</p><ol class="opts" type="A">${order(x, i).map((o) => `<li>${esc(o)}</li>`).join('')}</ol><details><summary>Bekijk het antwoord</summary><p><b>${esc(x.right)}</b></p></details></li>`).join('');
  const writing = D.WR.slice(0, 4).map((r) => `<li class="q"><p class="qq">${esc(r[0])}</p><details><summary>Bekijk een voorbeeldantwoord</summary><div class="doc">${para(r[1])}</div></details></li>`).join('');
  const speaking = D.SP.slice(0, 6).map((r) => `<li class="q"><p class="qq">${esc(r[0])}</p><details><summary>Bekijk een voorbeeldantwoord</summary><p>${esc(r[2])}</p></details></li>`).join('');
  return [
    { slug: 'knm-oefenen', open: 'a2', title: 'KNM oefenen: gratis oefenvragen Kennis van de Nederlandse Maatschappij | Bittertalen',
      desc: 'Oefen gratis voor het KNM-examen van de inburgering: echte oefenvragen over de 8 thema’s, met uitleg. Meer dan 400 KNM-vragen in de app.',
      h1: 'KNM oefenen', lead: 'Kennis van de Nederlandse Maatschappij (KNM) is een deel van het inburgeringsexamen. Je krijgt vragen over wonen, werk, zorg, onderwijs, geld, de overheid, geschiedenis en omgangsvormen in Nederland. Hieronder staan zes oefenvragen, één per thema. Probeer ze, open dan het antwoord.',
      body: `<ol class="qs">${knm.map(mc).join('')}</ol>`, more: 'In de app oefen je meer dan 400 KNM-vragen en doe je een proefexamen KNM met een timer.' },
    { slug: 'a2-lezen-oefenen', open: 'a2', title: 'Lezen A2 oefenen voor het inburgeringsexamen, gratis | Bittertalen',
      desc: 'Gratis oefenen voor Lezen A2 van het inburgeringsexamen: korte teksten zoals op het examen, met vragen en antwoorden.',
      h1: 'Lezen A2 oefenen', lead: 'Bij Lezen A2 lees je korte teksten uit het dagelijks leven: een advertentie, een brief van de gemeente, een bericht van school. Bij elke tekst beantwoord je vragen. Hieronder twee teksten om te proberen.',
      body: reading(lz), more: 'In de app staan veel meer leesteksten, en proefexamens Lezen met een timer.' },
    { slug: 'a2-luisteren-oefenen', open: 'a2', title: 'Luisteren A2 oefenen voor het inburgeringsexamen, gratis | Bittertalen',
      desc: 'Gratis oefenen voor Luisteren A2: korte gesprekken en berichten met vragen, zoals op het inburgeringsexamen.',
      h1: 'Luisteren A2 oefenen', lead: 'Bij Luisteren A2 hoor je korte gesprekken en berichten en beantwoord je een vraag. In de app hoor je de fragmenten; hier kun je ze lezen.',
      body: `<ol class="qs">${listen}</ol>`, more: 'In de app luister je naar alle fragmenten en doe je proefexamens Luisteren.' },
    { slug: 'a2-schrijven-oefenen', open: 'sample', title: 'Schrijven A2 oefenen: opdrachten met voorbeeldantwoord en AI-feedback | Bittertalen',
      desc: 'Oefen Schrijven A2 voor het inburgeringsexamen: echte schrijfopdrachten met een voorbeeldantwoord. In de app kijkt AI je tekst na met de criteria van DUO.',
      h1: 'Schrijven A2 oefenen', lead: 'Bij Schrijven A2 schrijf je korte berichten en e-mails en vul je een formulier in. Je moet alle punten van de opdracht noemen, in begrijpelijke zinnen. Op het echte examen schrijf je met de hand. Probeer eerst zelf een antwoord, open dan het voorbeeld.',
      body: `<ol class="qs">${writing}</ol>`, more: 'In de app kijkt AI je tekst na met de criteria van DUO (inhoud, woorden, grammatica, spelling, samenhang) en zie je je fouten met uitleg. Twee keer gratis, zonder account.' },
    { slug: 'a2-spreken-oefenen', open: 'a2', title: 'Spreken A2 oefenen voor het inburgeringsexamen | Bittertalen',
      desc: 'Oefen Spreken A2: echte vragen zoals op het inburgeringsexamen, met voorbeeldantwoorden. In de app spreek je je antwoord in en krijg je feedback.',
      h1: 'Spreken A2 oefenen', lead: 'Bij Spreken A2 beantwoord je vragen over jezelf en over foto’s. Een goed antwoord is twee of drie zinnen, met een reden als dat gevraagd wordt. Zeg je antwoord hardop, open dan het voorbeeld.',
      body: `<ol class="qs">${speaking}</ol>`, more: 'In de app spreek je je antwoord in, en AI zegt wat goed is en wat beter kan. Uitspraak en vloeiendheid beoordeelt de app niet: oefen die ook met mensen.' },
    { slug: 'staatsexamen-b1-oefenen', open: 'b1', title: 'Staatsexamen NT2 B1 oefenen (programma I), gratis | Bittertalen',
      desc: 'Oefen voor het Staatsexamen NT2 B1: lezen, luisteren, schrijven en spreken op B1-niveau, met proefexamens en AI-feedback.',
      h1: 'Staatsexamen NT2 B1 oefenen', lead: 'Het Staatsexamen NT2 programma I is op niveau B1. Je hebt het nodig voor sommige opleidingen en werk, en waarschijnlijk straks ook voor naturalisatie. Hieronder een leestekst op B1-niveau om te proberen.',
      body: reading(lz1), more: 'In de app oefen je alle vier onderdelen van B1, met proefexamens en AI-feedback op je schrijven en spreken.' },
    { slug: 'inburgeringsexamen-oefenen', open: 'today', title: 'Inburgeringsexamen oefenen: gratis proefexamens A2 en KNM | Bittertalen',
      desc: 'Gratis oefenen voor het inburgeringsexamen A2: Lezen, Luisteren, Schrijven, Spreken en KNM. Proefexamens met timer en AI-feedback op je teksten.',
      h1: 'Inburgeringsexamen oefenen', lead: 'Het inburgeringsexamen (Wet inburgering 2021) heeft voor de meeste mensen de onderdelen Lezen, Luisteren, Schrijven en Spreken op A2-niveau, plus KNM. Bittertalen helpt je elke dag een beetje, met een plan tot je examendatum.',
      body: `<ul class="links">${['knm-oefenen', 'a2-lezen-oefenen', 'a2-luisteren-oefenen', 'a2-schrijven-oefenen', 'a2-spreken-oefenen'].map((s) => `<li><a href="/${s}">${{ 'knm-oefenen': 'KNM oefenen', 'a2-lezen-oefenen': 'Lezen A2', 'a2-luisteren-oefenen': 'Luisteren A2', 'a2-schrijven-oefenen': 'Schrijven A2', 'a2-spreken-oefenen': 'Spreken A2' }[s]}</a></li>`).join('')}</ul><ol class="qs">${knm.slice(0, 3).map(mc).join('')}</ol>`,
      more: 'In de app zet je je examendatum, en elke dag krijg je een korte les met het onderdeel dat het meeste oefening nodig heeft.' },
  ];
}

const STYLE = `:root{--surface:#EEF2FA;--ink:#14213D;--soft:#56617C;--line:#D6DDEB;--blue:#1F3C96;--card:#FFFFFF}
*{box-sizing:border-box}body{margin:0;background:var(--surface);color:var(--ink);font:17px/1.55 -apple-system,BlinkMacSystemFont,system-ui,"Segoe UI",Roboto,sans-serif}
header,main,footer{max-width:760px;margin:0 auto;padding:16px 20px}header a.brand{font-weight:700;color:var(--blue);text-decoration:none;font-size:20px}
h1{font-size:clamp(28px,5vw,40px);line-height:1.15;margin:12px 0}.lead{color:var(--ink);opacity:.85}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:20px;margin:20px 0}
.qs{padding-left:0;list-style:none;counter-reset:q}.q{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;margin:12px 0}
.qq{font-weight:600;margin:0 0 8px}.opts{margin:0 0 8px}.doc{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:12px 16px;margin:12px 0}
details summary{cursor:pointer;color:var(--blue);font-weight:600}.tekst{margin:24px 0}
.go{display:inline-block;background:var(--blue);color:#fff;border-radius:12px;padding:14px 22px;font-weight:700;text-decoration:none;margin:8px 0}
.links{display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;list-style:none}.links a{color:var(--blue)}
footer{color:var(--soft);font-size:15px}footer a{color:var(--blue)}`;

export function html(p, all) {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${SITE}/${p.slug}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Bittertalen">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${SITE}/${p.slug}">
<meta property="og:image" content="${SITE}/art/og-delft.jpg">
<meta name="theme-color" content="#1F3C96">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=bittie1">
<style>${STYLE}</style>
</head>
<body>
<header><a class="brand" href="/">Bittertalen</a></header>
<main>
<h1>${esc(p.h1)}</h1>
<p class="lead">${esc(p.lead)}</p>
${p.body}
<section class="card"><p>${esc(p.more)}</p><a class="go" href="/oefenen?open=${p.open}">Oefen gratis in de app</a>
<p>Bittertalen is geen DUO. De vragen zijn eigen oefenvragen, geen echte examenvragen.</p></section>
<nav aria-label="Meer oefenen"><ul class="links">${all.filter((x) => x.slug !== p.slug).map((x) => `<li><a href="/${x.slug}">${esc(x.h1)}</a></li>`).join('')}</ul></nav>
</main>
<footer><a href="/">Bittertalen</a> · <a href="/over">Over</a> · <a href="/privacy">Privacy</a> · <a href="/voorwaarden">Voorwaarden</a> · <a href="/contact">Contact</a></footer>
</body>
</html>
`;
}

export function build() {
  const P = pages();
  return Object.fromEntries(P.map((p) => [`${p.slug}.html`, html(p, P)]));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [f, h] of Object.entries(build())) { fs.writeFileSync(new URL(f, root), h); console.log('wrote', f); }
}
