// Builds the homepage in every menu language as its own page (/en, /ar, /tr, /hi, /zh, /es, /ru, /uk), so search engines
// can find each one: the text already translated from `copy` in landing.js, with its own title, description,
// canonical link and html lang. index.html stays the source: edit it and landing.js, then run
//   node tools/build-lang.mjs          (writes en.html … uk.html, served without .html by cleanUrls)
//   node tools/build-lang.mjs --check  (fails when a page is out of date; tests/lang-pages.test.mjs runs it)
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = f => fs.readFileSync(new URL(f, root), 'utf8');
export const LANGS = ['en', 'ar', 'tr', 'hi', 'zh', 'es', 'ru', 'uk']; // the order of `languages` in landing.js
export const SITE = 'https://bittertalen.nl';
export const hreflang = l => l === 'zh' ? 'zh-Hans' : l;
export const url = l => l === 'nl' ? SITE + '/' : `${SITE}/${l}`;

// The page's head in each language (the body comes from landing.js)
export const META = {
  title: {
    nl: "Inburgeringsexamen A2 en NT2 B1 gratis oefenen | Bittertalen",
    en: "Free practice for the Dutch inburgering exam A2 and NT2 B1 | Bittertalen",
    ar: "تدريب مجاني على امتحان الاندماج الهولندي A2 وNT2 B1 | Bittertalen",
    tr: "Hollanda uyum sınavı (inburgering) A2 ve NT2 B1 ücretsiz deneme | Bittertalen",
    hi: "डच इंटीग्रेशन परीक्षा (inburgering) A2 और NT2 B1 की मुफ़्त तैयारी | Bittertalen",
    zh: "免费练习荷兰融入考试（inburgering）A2 和 NT2 B1 | Bittertalen",
    es: "Prepara gratis el examen de integración neerlandés A2 y NT2 B1 | Bittertalen",
    ru: "Экзамен inburgering A2 и NT2 B1: бесплатная подготовка | Bittertalen",
    uk: "Іспит inburgering A2 і NT2 B1: безкоштовна підготовка | Bittertalen",
  },
  description: {
    nl: 'Oefen gratis voor het inburgeringsexamen A2 en het Staatsexamen NT2 B1, op weg naar naturalisatie. Proefexamens, geschiedenis, boeken en gesprekken met AI-personages.',
    en: 'Free practice for the Dutch civic integration exam (inburgeringsexamen) A2 and the Staatsexamen NT2 B1, on your way to naturalisation. Mock exams, history, books and conversations with AI characters.',
    ar: 'تدرّب مجانًا لامتحان الاندماج الهولندي (inburgeringsexamen) بمستوى A2 وامتحان Staatsexamen NT2 بمستوى B1، في طريقك إلى التجنّس. امتحانات تجريبية وتاريخ وكتب ومحادثات مع شخصيات بالذكاء الاصطناعي.',
    tr: 'Hollanda uyum sınavı (inburgeringsexamen) A2 ve Staatsexamen NT2 B1 için ücretsiz çalış, vatandaşlık yolunda. Deneme sınavları, tarih, kitaplar ve yapay zekâ karakterleriyle sohbetler.',
    hi: 'नीदरलैंड की इंटीग्रेशन परीक्षा (inburgeringsexamen) A2 और Staatsexamen NT2 B1 की मुफ़्त तैयारी, नागरिकता की राह पर। मॉक परीक्षाएँ, इतिहास, किताबें और AI पात्रों से बातचीत।',
    zh: '免费备考荷兰融入考试（inburgeringsexamen）A2 和 Staatsexamen NT2 B1，迈向入籍。模拟考试、历史、书籍，以及与 AI 角色的对话。',
    es: 'Prepárate gratis para el examen de integración neerlandés (inburgeringsexamen) A2 y el Staatsexamen NT2 B1, camino de la naturalización. Exámenes de prueba, historia, libros y conversaciones con personajes de IA.',
    ru: 'Бесплатная подготовка к экзамену на интеграцию в Нидерландах (inburgeringsexamen) A2 и Staatsexamen NT2 B1 на пути к натурализации. Пробные экзамены, история, книги и разговоры с ИИ-персонажами.',
    uk: 'Безкоштовна підготовка до іспиту з інтеграції в Нідерландах (inburgeringsexamen) A2 і Staatsexamen NT2 B1 на шляху до натуралізації. Пробні іспити, історія, книжки й розмови з персонажами ШІ.',
  },
  og: {
    nl: 'Oefen voor inburgering A2 en Staatsexamen NT2 B1, leer Nederland kennen en durf te spreken.',
    en: 'Practise for inburgering A2 and the Staatsexamen NT2 B1, get to know the Netherlands and dare to speak.',
    ar: 'تدرّب للاندماج A2 وStaatsexamen NT2 B1، وتعرّف على هولندا وتشجّع على الكلام.',
    tr: 'Uyum A2 ve Staatsexamen NT2 B1 için çalış, Hollanda\'yı tanı ve konuşmaya cesaret et.',
    hi: 'इंटीग्रेशन A2 और Staatsexamen NT2 B1 की तैयारी करें, नीदरलैंड को जानें और बोलने की हिम्मत करें।',
    zh: '备考融入考试 A2 和 Staatsexamen NT2 B1，了解荷兰，敢于开口。',
    es: 'Prepárate para la integración A2 y el Staatsexamen NT2 B1, conoce los Países Bajos y atrévete a hablar.',
    ru: 'Готовьтесь к inburgering A2 и Staatsexamen NT2 B1, узнавайте Нидерланды и заговорите.',
    uk: 'Готуйтеся до inburgering A2 і Staatsexamen NT2 B1, пізнавайте Нідерланди й заговоріть.',
  },
  locale: { nl: 'nl_NL', en: 'en_GB', ar: 'ar_AR', tr: 'tr_TR', hi: 'hi_IN', zh: 'zh_CN', es: 'es_ES', ru: 'ru_RU', uk: 'uk_UA' },
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
