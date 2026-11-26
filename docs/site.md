# Homepage, public pages, languages, deploy and search
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

## Homepage and public pages
Bittertalen (a pun on bitterballen: "bitter languages", self-irony about learning Dutch) is a single-page study app for the Dutch A2 integration exam (inburgeringsexamen).
Positioning (the user's choice, 25 November 2026): exams on the way to naturalisation, with history, culture and
conversations to feel at home and dare to speak. The hero says "Word thuis in Nederland"; Vraag 1 is "Oefen voor je
examen", Vraag 2 "Leer het land kennen en durf te spreken" (books, history and art, media, Saskia and the other
characters), and the FAQ answers "Helpt Bittertalen ook bij naturalisatie?" from ind.nl (an inburgeringsdiploma,
usually at least A2; the IND decides). Never promise a passport, a pass or that B1 is required for naturalisation.
The public homepage is `index.html` (`landing.js` translates it: every `data-t` text and `data-alt` alt text needs all
eight translations in `copy`, which `tests/site.test.mjs` checks) and reads Plus pricing from `/api/config`. Its main
button, "Begin met oefenen" in the bar (`#enter`), opens `/oefenen?open=today`; the hero has the heading (no
full stop), one paragraph, a Download de app button and the app in a phone. The download button uses the browser install
prompt when available, otherwise links to #install-app with instructions for iOS, Android and desktop (November 2026). The bar: the name (30 px, 28 on a phone), the page's links, the language, Inloggen and the main button;
on a phone two straight rows, the name with the button, then the links with the language and Inloggen (two wrapping flex
rows: a grid tied the second row to the button's width; the type follows the screen's width and the narrowest phones leave
out the middle link; the browser test measures it in the longest languages). The learning features (`#oefenvormen`)
start as compact headings in native `details`: tapping or keyboard activation opens one description and colors that
card blue; a fine mouse pointer also opens it on hover and closes it on leaving. No card starts highlighted. Keep the
summary's icon and disclosure indicator, all nine languages, and the native fallback without JavaScript.
Descriptions expand and collapse over 360/280 ms with height and opacity, reversing from their current frame on rapid
interaction. Reduced motion skips the animation; resize settles it. Phone cards have no border; keyboard focus stays visible.
Scroll anchoring is paused during disclosure motion, and feature-section entrance motion settles on hover so the heading
cannot move away from a stationary pointer.
"Leer het land kennen en durf te spreken" (`#ontdek`, "Vraag 2"; before 25 November 2026 "Meer dan examenvragen"; the user's wish, 24 November 2026) follows it: four blocks (`.extra`), each with a
piece of the app itself in HTML or pictures instead of an icon (a sentence from a story with the word popup, paintings, a video
frame with subtitles above a podcast player, so it is clear that you can watch and listen: our own photo, never a channel's still; Saskia with a correction): books, history and art, videos, podcasts and news, Saskia. The whole block is one link,
to `/oefenen?open=books`, `history`, `media` or `talk` (`openEntry()`; Oefenen is behind the back button). Keep the texts true:
words are translated into English only, and Saskia is called an AI character. Those three features left the `#oefenvormen` list
(four headings now), so nothing appears twice. The Dutch in the pictures stays Dutch (`lang="nl"`, hidden from screen readers).
The later questions moved one up: 3 the level, 4 the KNM question, 5 the writing check.
How the two pages hand over (`tests/browser.test.mjs` checks it):
the site always opens with the homepage in a browser, on phones, tablets and computers, including returning learners
with saved progress or an account (the user's wish, 12 November 2026). The bar's button leads into the app. On a computer,
the app's menu has "Home" as its first row, `.tabs .hm`, a link to "/" that the lens never covers. Profiel has a "Naar de website" row in its bottom Bittertalen group, next to Statistiek for the owner, on every device except the store apps (see App Store and Google Play). Installed apps, old addresses and sign-in (`?code`, `?error`, with the handoff's `?h`), Stripe (`?plus`)
or migration (`#verhuis=`) callbacks still enter the app directly, preserving their query and hash. `/?home` explicitly opens the public homepage, including inside an installed app. An installed app keeps the query
so reloading stays on the homepage; ordinary browser visits remove that query. A fresh installed launch still opens practice. The "← Bittertalen" links of /over and /privacy go back to
/oefenen for someone who came from the app. Arriving from the homepage (`?open=today`, `a2`,
`b1`, `sample`) marks the login window as seen (`ww-welcome`): the homepage already offers Inloggen, so someone who
started without an account isn't stopped by it later; `?open=login` opens it. Under the hero four numbers (questions, KNM questions, proefexamens per level,
conversations), checked against the content by the same test: change them when the content shrinks. The sections are set like questions on the exam
form, in the app's Examenblad style (the user found icon cards and phone screenshots looked like every competitor):
"Vraag 1 · Waar oefen je voor?" with A (A2) and B (B1) in square letter boxes that open the app at that level; "Vraag 2
· Probeer het zelf", a real KNM question marked on the page like in the app (`landing.js`; the question and its
feedback stay Dutch); "Vraag 3", the three ways to practise as a numbered list; "Vraag 4 · Zo kijkt Claude je tekst
na", the writing check set in HTML like in the app, with the same checklist (a made-up example, the page says so; its errors and points must follow the scoring
rules); under it `#try-free` says the check can be tried for free, with `free` and `limit` from `/api/config` (`tryCopy` in `landing.js`, nine languages; hidden without them). "Veelgestelde vragen" uses native `<details>`; keep the answers true (not DUO, offline, no pass guarantee). The
Plus and Examenpas cards carry the current prices in the HTML (for search engines and slow connections; 25 November
2026) and are hidden only when `/api/config` answers without Plus, never when it fails. Keep those prices, `PLANS`,
`PASSES`, `YEARS` (the Jaarpas card `#year-card`) and the `13 weken` line in step. Under them: the 14-day money-back promise (voorwaarden.html, "Niet tevreden, geld terug";
refunds are made by hand in Stripe). `landing.js` is loaded as `?v=<name>`: change the name when it changes. The page looks like the app (dark only on phones and tablets, light on a computer, like the app): the
blurred windmill behind frosted glass, white tiles with the app's shadow, a glass bar on top. The hero shows the app
itself in a phone (`shots/app.webp`, the top of Mijn dag, taken with Playwright) in front of Vermeer's Gezicht op Delft
(no caption on the painting there: removed at the user's wish; the credit is in `art/CREDITS.md`);
Bitterbal, the plush mascot, stands small beside it with a speech bubble (the user wanted the app there, not the
mascot instead of it; they want Bitterbal in another pose, waving: swap `art/bitterbal-white.jpg` there once there is
such a picture). Contact on the homepage and in the app opens `/contact`: the same eight-language contact page, with hallo@bittertalen.nl (the catch-all mailbox), explicit email/copy actions, and a back link to the app when entered from it. The study app is served at `/oefenen` from `oefenen.html` (the code, the styles and the small tables, about 340 KB).
Its large data lives in `data/`, plain scripts loaded before the app's own script, each a set of top-level `const`s
that depend on nothing: `data/knm.js` (`KNM`), `data/a2.js` (`LZ`, `LS`, `LSM`, `SP`, `WR`,
`WT`, `BG`), `data/b1.js` (`LZ1`, `LSB`, `WRB`, `SPB`, `G1`, `VO1`, `GSB`) and `data/extra.js` (`GP`, `GS`, `BOOKS`,
`ART`, `FOTO`). `data/ui.js` is the menus' translations: it adds to the empty `UI` and `UIR` the page defines and is
loaded only when the menus are in another language than Dutch (`loadUI()`, version `UIV`; about 190 KB Dutch users don't
need); the service worker keeps it with the page only for someone who already uses it, and the tests load it always.
Below, "in `oefenen.html`" for these names means that file. Every local script is loaded as
`?v=<hash of its content>`, and the service worker keeps it for good under that address: after editing `data/`,
`study/` or the dictionary run `node tools/stamp.mjs` (the tests fail when a version is out of date). A data file
must not use anything from the app's script at load time (only inside functions). `study/language-v1.js` holds stable verb and word-order data plus checking logic. `study/progress-v1.js` handles three-way progress merges and conditional cloud writes. `study/writing-v1.js` aggregates writing feedback without making another grading request. Paintings are in `art/`.
The study app shows Bittie while it starts (`#app-loading`, the early `data-boot` attribute), already waving from the
first frame (`art/bittie-wave-v2.svg`, the user's wish, 24 November 2026: an earlier wave began with the arm hanging down
and the page's Bittie sat higher and larger than on the launch image, so he seemed to shoot up from below).
`python3 tools/build-bittie-wave.py` makes it from `art/bittie-loading-v1.webp`, the picture of the native launch image:
only the raised arm turns around its shoulder (behind the body), and the first frame is exactly that picture. The picture
is embedded, so the SVG works as a cached image with no scripts or external requests.
`.boot-bittie` is in the middle of the screen with the launch image's size (700 of 2732 px of the height), its text below
it (`.boot-text`), no safe-area padding; `ios-startup-v1.js` draws the same size and place. Keep the three alike.
`picture` selects the static `art/bittie-loading-v1.webp` for reduced motion or if the animated file fails. Conditional
preloads download the selected image; both are cached offline. The store app's launch image goes once the page's Bittie
is decoded. The earlier dance (`tools/build-bittie-dance.py`, `art/bittie-dance-*`) is no longer used. The loading label uses the saved menu language before the full translations load.
The dots stop for reduced motion. At the user's request, the splash stays visible for at least two
seconds from when its markup is shown, then fades when startup is ready; slow starts add no extra delay. Reduced motion
and startup errors skip this minimum. Optional account work cannot cover usable local content for more than four seconds
after local restoration. Script failures and a 20-second stalled startup expose the existing reload action instead of
leaving a permanent overlay. Without JavaScript the splash stays hidden and the existing noscript message is visible.
Installed launches serve the cached `/oefenen` page immediately, while a complete update is fetched in parallel;
the previous 2.5-second network race produced the blank screen in the user's iPhone recording. Keep validating and
caching the page's scripts and both mascot assets before replacing that saved page. A new worker using the same
cache also remembers and announces the update, so the installed app can replace its old CSS wobble. The optional
motion stylesheet cannot block the first mascot frame. `ios-startup-v1.js` supplies an exact-device-size static
Bittie launch image on iOS (including from the homepage before installation); iOS cannot animate its native launch
image. The wave begins inside the web view while data and optional account work continue. Startup and offline
browser checks run in Chromium and WebKit, including held navigation/style requests and a same-cache worker update.
Deployed on Vercel from `main`: every push to `main` goes live at https://bittertalen.nl (push `main` first, then the working
branch: in November 2026 a commit built first as a branch preview got no production build when it reached `main`; then
start one by hand, a production deployment of `main` at that commit) (Vercel project
`nedelands`; the domain is registered at TransIP with Vercel's nameservers, so its DNS records are in Vercel, including
Resend's). The old addresses https://bittertalen.vercel.app and https://nedelands.vercel.app serve the same deployment
as migration-only entry points (see Progress). Practice is available only on bittertalen.nl.
Search: `robots.txt`, `sitemap.xml` (the homepages and the public pages), a canonical link to bittertalen.nl, Open Graph tags
with `art/og-delft.jpg`, JSON-LD (`WebApplication`) and a `<noscript>` line, and search engines don't get the welcome
screen. The homepage has its own address per menu language (24 November 2026, for search): `/en`, `/ar`, `/tr`,
`/hi`, `/zh`, `/es`, `/ru` are `en.html` … `ru.html`, made by `node tools/build-lang.mjs` from `index.html` and
`landing.js`'s `copy` (texts already translated, the Dutch kept in `data-t="…"`; their own title, description, Open
Graph, canonical, html lang and JSON-LD from `META` in the tool). Never edit those files by hand: after changing
`index.html` or `copy`, run the tool (`tests/lang-pages.test.mjs` fails otherwise). Every homepage lists all nine with
`hreflang` (`zh-Hans` for Chinese, `x-default` = `/`), as does `sitemap.xml`. On those pages their language wins and
is saved in `ww-ui` (so the app opens in it); `/` still shows the saved language in place; the language selector goes
to that language's address. Until the public launch every address sends `X-Robots-Tag: noindex` (`vercel.json`, one rule for all hosts). At
launch, limit that rule to the old addresses (`"has": [{"type": "host", "value": "bittertalen.vercel.app"}]`, and the
same for nedelands.vercel.app) and add bittertalen.nl to Google Search Console.
Privacy: `privacy.html` (served as /privacy, `cleanUrls` in `vercel.json`) is the privacy statement in Dutch, in the same
Delfts blauw; controller Artem Matveev, contact privacy@bittertalen.nl (an iCloud+ custom-domain mailbox of the user's, catch-all on;
its MX, SPF, DKIM and apple-domain records are in Vercel DNS next to Resend's). Linked from Profiel (a list row) and the welcome
screen. Keep it true: when data goes somewhere new (a new service, a new field in the account, analytics), update it
and its date. `sw.js` caches other pages under their own address, never as "/".
The app defaults to Dutch. A word's meaning is a short Dutch description (A2) or English from the dictionary.
The menus can switch to English, Arabic, Turkish, Hindi, simplified Chinese, Spanish or Russian.
The native language selector (`langHTML()`) appears on the painting and login card and saves the selection in `ww-ui`.
`UI` (exact Dutch string → `[en, ar, tr, hi, zh, es, ru]`, the
order of `LCODE`) and `UIR` (patterns: "2 van 6 klaar", dates, "nodig: 76%"…) translate text
nodes, `aria-label` and `placeholder` after every render (a MutationObserver; the Dutch original is kept in `UIO`, so
switching back restores it). The user's rule: only the menus, the privacy statement and sections like it are translated, exercises stay Dutch.
So never inside `#play` (exercises), conversations or the text of what you read: books, chapters, painting stories and the museum label stay Dutch, with
their titles on their own page. Everything around them is translated: list rows (conversation, chapter and book titles and descriptions), back buttons,
the reader's buttons, and information such as the ONA screen. `lang="nl"` marks Dutch content (`DUTCH`: never translated, always
left to right): a conversation wraps its content in `<div lang="nl">`, because `#tbody` and `#hbody` also hold menus. A new menu string needs all seven translations in `UI` plus Ukrainian in `UK` (regex rows in `UIRK`, same order as `UIR`). The
translations were made by Claude and not yet checked by native speakers.
Arabic runs right to left (`<html dir="rtl">`, set by `applyLang()`): use logical CSS (`padding-inline-start`,
`inset-inline-start`, `text-align:var(--ta)` and `var(--te)` for left and right), not physical sides, for anything in the menus. Dutch
content stays left to right (`#play`, `#read`, the header, `[lang=nl]`, `.book`, `.doc`, `.sample`, `.msum`, `.tl`, `.bgl`, in one CSS rule). In Arabic the
tab bar, its lens and the swipe back are mirrored; `unicode-bidi:plaintext` keeps Dutch titles readable in a right-to-left list.
No letter spacing in Arabic, Hindi or Chinese: it breaks joined letters.
`privacy.html` and `over.html` hold the same text in eight languages: one `<article data-l>` per language with the same sections, points and
links, only the one matching `ww-ui` shown (a small script; Dutch without a script), with their own language globe (in ink
on the glass, top left above the tile, like the app's). They look like an inner screen of the app: one white tile on the frosted
windmill, Examenblad corners, each section under a hairline with its heading in cobalt, sentence case (no small capitals), Delft at
night in dark mode. The Dutch text of the
privacy statement is the official one and each translation says so. When either page changes, update every translation.
