// Builds the homepage in every menu language as its own page (/en, /ar, /tr, /hi, /zh, /es, /ru), so search engines
// can find each one: the text already translated from `copy` in landing.js, with its own title, description,
// canonical link and html lang. index.html stays the source: edit it and landing.js, then run
//   node tools/build-lang.mjs          (writes en.html … ru.html, served without .html by cleanUrls)
//   node tools/build-lang.mjs --check  (fails when a page is out of date; tests/lang-pages.test.mjs runs it)
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = f => fs.readFileSync(new URL(f, root), 'utf8');
export const LANGS = ['en', 'ar', 'tr', 'hi', 'zh', 'es', 'ru']; // the order of `languages` in landing.js
export const SITE = 'https://bittertalen.nl';
export const hreflang = l => l === 'zh' ? 'zh-Hans' : l;
export const url = l => l === 'nl' ? SITE + '/' : `${SITE}/${l}`;

// The page's head in each language (the body comes from landing.js)
export const META = {
  title: {
    nl: 'Bittertalen — Nederlands oefenen voor A2 en B1',
    en: 'Bittertalen — Practise Dutch for the A2 and B1 exams',
    ar: 'Bittertalen — تدرّب على الهولندية لامتحانات A2 وB1',
    tr: 'Bittertalen — A2 ve B1 sınavları için Flemenkçe çalış',
    hi: 'Bittertalen — A2 और B1 परीक्षा के लिए डच का अभ्यास करें',
    zh: 'Bittertalen — 备考荷兰语 A2 和 B1 考试',
    es: 'Bittertalen — Practica neerlandés para los exámenes A2 y B1',
    ru: 'Bittertalen — подготовка к экзаменам по нидерландскому A2 и B1',
  },
  description: {
    nl: 'Oefen gratis voor het inburgeringsexamen A2 en het Staatsexamen NT2 B1. Daglessen, proefexamens en feedback op schrijven en spreken.',
    en: 'Free practice for the Dutch civic integration exam (inburgeringsexamen) A2 and the Staatsexamen NT2 B1. Daily lessons, mock exams and feedback on writing and speaking.',
    ar: 'تدرّب مجانًا لامتحان الاندماج الهولندي (inburgeringsexamen) بمستوى A2 وامتحان Staatsexamen NT2 بمستوى B1. دروس يومية وامتحانات تجريبية وتصحيح للكتابة والتحدث.',
    tr: 'Hollanda uyum sınavı (inburgeringsexamen) A2 ve Staatsexamen NT2 B1 için ücretsiz çalış. Günlük dersler, deneme sınavları ve yazma ile konuşmaya geri bildirim.',
    hi: 'नीदरलैंड की इंटीग्रेशन परीक्षा (inburgeringsexamen) A2 और Staatsexamen NT2 B1 की मुफ़्त तैयारी। रोज़ के पाठ, मॉक परीक्षाएँ और लिखने व बोलने पर फ़ीडबैक।',
    zh: '免费备考荷兰融入考试（inburgeringsexamen）A2 和 Staatsexamen NT2 B1。每日课程、模拟考试，以及写作和口语反馈。',
    es: 'Prepárate gratis para el examen de integración neerlandés (inburgeringsexamen) A2 y el Staatsexamen NT2 B1. Lecciones diarias, exámenes de prueba y correcciones de escritura y expresión oral.',
    ru: 'Бесплатная подготовка к экзамену на интеграцию в Нидерландах (inburgeringsexamen) A2 и Staatsexamen NT2 B1. Ежедневные уроки, пробные экзамены и проверка письма и устной речи.',
  },
  og: {
    nl: 'Gratis oefeningen en proefexamens voor inburgering A2 en Staatsexamen NT2 B1.',
    en: 'Free exercises and mock exams for inburgering A2 and the Staatsexamen NT2 B1.',
    ar: 'تمارين وامتحانات تجريبية مجانية لامتحان الاندماج A2 وStaatsexamen NT2 B1.',
    tr: 'Uyum sınavı A2 ve Staatsexamen NT2 B1 için ücretsiz alıştırmalar ve deneme sınavları.',
    hi: 'इंटीग्रेशन परीक्षा A2 और Staatsexamen NT2 B1 के लिए मुफ़्त अभ्यास और मॉक परीक्षाएँ।',
    zh: '融入考试 A2 和 Staatsexamen NT2 B1 的免费练习和模拟考试。',
    es: 'Ejercicios y exámenes de prueba gratis para la integración A2 y el Staatsexamen NT2 B1.',
    ru: 'Бесплатные упражнения и пробные экзамены для inburgering A2 и Staatsexamen NT2 B1.',
  },
  locale: { nl: 'nl_NL', en: 'en_GB', ar: 'ar_AR', tr: 'tr_TR', hi: 'hi_IN', zh: 'zh_CN', es: 'es_ES', ru: 'ru_RU' },
};

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attr = s => esc(s).replace(/"/g, '&quot;');
const decode = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

export function landingCopy() {
  const js = read('landing.js');
  const start = js.indexOf('const copy = {');
  const block = js.slice(start, js.indexOf('};', start) + 2);
  return vm.runInNewContext(block.replace('const copy =', 'copy =') + ';copy', {});
}

// one exact replacement, or the build stops: a silent miss would publish a half-Dutch page
function swap(html, from, to, what) {
  if (!html.includes(from)) throw new Error(`index.html: ${what} not found`);
  return html.replace(from, () => to);
}

export function build(lang, html = read('index.html'), copy = landingCopy()) {
  const i = LANGS.indexOf(lang), t = nl => {
    const v = copy[nl]?.[i];
    if (!v) throw new Error(`landing.js: no ${lang} translation for "${nl}"`);
    return v;
  };
  html = swap(html, '<!doctype html>\n<html lang="nl">',
    `<!doctype html>\n<!-- Made by tools/build-lang.mjs from index.html and landing.js: edit those, then run it again. -->\n` +
    `<html lang="${hreflang(lang)}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" data-page="${lang}">`, 'html tag');
  html = swap(html, `<title>${esc(META.title.nl)}</title>`, `<title>${esc(META.title[lang])}</title>`, 'title');
  html = swap(html, `<meta name="description" content="${attr(META.description.nl)}">`,
    `<meta name="description" content="${attr(META.description[lang])}">`, 'description');
  html = swap(html, `<meta property="og:title" content="${attr(META.title.nl)}">`,
    `<meta property="og:title" content="${attr(META.title[lang])}">`, 'og:title');
  html = swap(html, `<meta property="og:description" content="${attr(META.og.nl)}">`,
    `<meta property="og:description" content="${attr(META.og[lang])}">`, 'og:description');
  html = swap(html, '<meta property="og:locale" content="nl_NL">', `<meta property="og:locale" content="${META.locale[lang]}">`, 'og:locale');
  html = swap(html, `<link rel="canonical" href="${SITE}/">`, `<link rel="canonical" href="${url(lang)}">`, 'canonical');
  html = swap(html, `<meta property="og:url" content="${SITE}/">`, `<meta property="og:url" content="${url(lang)}">`, 'og:url');
  html = swap(html, `"url":"${SITE}/","applicationCategory"`, `"url":"${url(lang)}","applicationCategory"`, 'JSON-LD url');
  html = swap(html, '"inLanguage":"nl"', `"inLanguage":"${hreflang(lang)}"`, 'JSON-LD inLanguage');
  html = swap(html, '<a class="brand" href="/"', `<a class="brand" href="/${lang}"`, 'logo link');
  html = swap(html, '<span id="language-code" aria-hidden="true">NL</span>',
    `<span id="language-code" aria-hidden="true">${{ar: 'عربي', hi: 'हिं', zh: '中文'}[lang] || lang.toUpperCase()}</span>`, 'language code');
  html = swap(html, `<option value="${lang}">`, `<option value="${lang}" selected>`, 'language option');
  // every data-t text, with the Dutch original kept in the attribute for landing.js
  let n = 0;
  html = html.replace(/<(\w+)([^>]*?)\sdata-t((?:\s[^>]*)?)>([^<]*)</g, (m, tag, before, after, text) => {
    n++;
    const nl = decode(text);
    return `<${tag}${before} data-t="${attr(nl)}"${after}>${esc(t(nl))}<`;
  });
  if (n < 40) throw new Error(`index.html: only ${n} data-t texts found`);
  html = html.replace(/<img\b[^>]*\sdata-alt="([^"]*)"[^>]*>/g, (tag, nl) => {
    if (!/\salt="[^"]*"/.test(tag)) throw new Error(`index.html: data-alt without alt: ${tag}`);
    return tag.replace(/\salt="[^"]*"/, ` alt="${attr(t(decode(nl)))}"`);
  });
  return html;
}

export const file = lang => `${lang}.html`;

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const check = process.argv.includes('--check'), html = read('index.html'), copy = landingCopy(), stale = [];
  for (const lang of LANGS) {
    const out = build(lang, html, copy), f = new URL(file(lang), root);
    const old = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    if (old === out) continue;
    if (check) stale.push(file(lang)); else { fs.writeFileSync(f, out); console.log('wrote', file(lang)); }
  }
  if (stale.length) { console.error('Out of date, run node tools/build-lang.mjs:', stale.join(', ')); process.exit(1); }
}
