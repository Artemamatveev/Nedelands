# Bittertalen

Bittertalen (a pun on bitterballen: "bitter languages", self-irony about learning Dutch) is a single-page study app for the Dutch A2 integration exam (inburgeringsexamen).
The public homepage is `index.html` (`landing.js` translates it: every `data-t` text and `data-alt` alt text needs all
seven translations in `copy`, which `tests/site.test.mjs` checks) and reads Plus pricing from `/api/config`. Its main
button "Begin gratis" opens `/oefenen?open=today`. How the two pages hand over (`tests/browser.test.mjs` checks it):
the homepage sends to the app whoever already practises on this device (a `ww-v1`, `ww-acc` or `ww-progress-v2:`
key; the app lived at "/" before, so old bookmarks and the "← Bittertalen" links of /over and /privacy point there),
an installed app, the old addresses, and returns from a login (`?code`, `?error`, the handoff's `?h`), from Stripe
(`?plus`) and from a move (`#verhuis=`), each with its address. `/?home` (Profiel's Website row, hidden in an installed
app, which can't show the website) shows the homepage all the same. Arriving from the homepage (`?open=today`, `a2`,
`b1`, `sample`) marks the login window as seen (`ww-welcome`): the homepage already offers Inloggen, so someone who
started without an account isn't stopped by it later; `?open=login` opens it. Under the hero four numbers (questions, KNM questions, proefexamens per level,
conversations), checked against the content by the same test: change them when the content shrinks. "Zo ziet het
eruit" shows three screenshots of the app in `shots/` (WebP, 780 px wide), taken with Playwright from the real app; the
writing feedback in them is a made-up example (the page says so), and its errors and points must follow the scoring
rules. "Veelgestelde vragen" uses native `<details>`; keep the answers true (not DUO, offline, no pass guarantee). The
Plus card only shows when Plus is on (a card saying it was unavailable looked broken). It looks like the app: the
blurred windmill behind frosted glass, white tiles with the app's shadow, cobalt squares with white glyphs, a glass
bar on top; the hero shows the app in a phone (`shots/app.webp`, the top of Vandaag) in front of Vermeer's Gezicht op
Delft with a museum line; the plush Bitterbal says hello at the closing call to action. Contact on the homepage is
hallo@bittertalen.nl (the catch-all mailbox). The study app is served at `/oefenen` from `oefenen.html` (the code, the styles and the small tables, about 340 KB).
Its large data lives in `data/`, plain scripts loaded before the app's own script, each a set of top-level `const`s
that depend on nothing: `data/ui.js` (`UI`, `UIR`), `data/knm.js` (`KNM`), `data/a2.js` (`LZ`, `LS`, `LSM`, `SP`, `WR`,
`WT`, `BG`), `data/b1.js` (`LZ1`, `LSB`, `WRB`, `SPB`, `G1`, `VO1`, `GSB`) and `data/extra.js` (`GP`, `GS`, `BOOKS`,
`ART`, `FOTO`). Below, "in `oefenen.html`" for these names means that file. Every local script is loaded as
`?v=<hash of its content>`, and the service worker keeps it for good under that address: after editing `data/`,
`study/` or the dictionary run `node tools/stamp.mjs` (the tests fail when a version is out of date). A data file
must not use anything from the app's script at load time (only inside functions). `study/language-v1.js` holds stable verb and word-order data plus checking logic. `study/progress-v1.js` handles three-way progress merges and conditional cloud writes. `study/writing-v1.js` aggregates writing feedback without making another grading request. Paintings are in `art/`.
Deployed on Vercel from `main`: every push to `main` goes live at https://bittertalen.nl (push `main` first, then the working
branch: in November 2026 a commit built first as a branch preview got no production build when it reached `main`; then
start one by hand, a production deployment of `main` at that commit) (Vercel project
`nedelands`; the domain is registered at TransIP with Vercel's nameservers, so its DNS records are in Vercel, including
Resend's). The old addresses https://bittertalen.vercel.app and https://nedelands.vercel.app serve the same deployment
(see Progress for the move).
Search: `robots.txt`, `sitemap.xml` (only https://bittertalen.nl/), a canonical link to bittertalen.nl, Open Graph tags
with `art/og-delft.jpg`, JSON-LD (`WebApplication`) and a `<noscript>` line, and search engines don't get the welcome
screen. Until the public launch every address sends `X-Robots-Tag: noindex` (`vercel.json`, one rule for all hosts). At
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
left to right): a conversation wraps its content in `<div lang="nl">`, because `#tbody` and `#hbody` also hold menus. A new menu string needs all seven translations in `UI`. The
translations were made by Claude and not yet checked by native speakers.
Arabic runs right to left (`<html dir="rtl">`, set by `applyLang()`): use logical CSS (`padding-inline-start`,
`inset-inline-start`, `text-align:var(--ta)` and `var(--te)` for left and right), not physical sides, for anything in the menus. Dutch
content stays left to right (`#play`, `#read`, the header, `[lang=nl]`, `.book`, `.doc`, `.sample`, `.msum`, `.tl`, `.bgl`, in one CSS rule). In Arabic the
tab bar, its lens and the swipe back are mirrored; `unicode-bidi:plaintext` keeps Dutch titles readable in a right-to-left list.
No letter spacing in Arabic, Hindi or Chinese: it breaks joined letters.
`privacy.html` and `over.html` hold the same text in eight languages: one `<article data-l>` per language with the same sections, points and
links, only the one matching `ww-ui` shown (a small script; Dutch without a script), with their own language pill. The Dutch text of the
privacy statement is the official one and each translation says so. When either page changes, update every translation.

## Design: Delfts blauw

The design should also teach Dutch culture. Keep it recognisably Dutch and avoid the
generic "AI app" look.

- **Colours**: tin-glaze white `--bg`, cobalt `--blue`, light wash `--wash`, and
  `--oranje` as the only accent (timer, selection, the bitterbal lens in the tab bar). Filled cobalt surfaces (`.btn`, the icon squares,
  chosen word tokens, photo numbers) use `--fill` with `--on-fill` text: in dark mode that stays a deep
  cobalt (`#2A4AAE`) with white text (7.8:1), because the light `--blue` read as a highlight rather than the main action.
  Dark mode is Delft at night: a blue-black page (`#0A0F1B`) with tiles a clear step lighter (`#131A2A`), so they don't
  melt into the page. A neutral graphite with a brighter blue button was tried and looked like a stock UI kit.
  Always use the tokens on `:root`; every colour has a dark-mode value.
- **Glass and tiles**: the page background is a Dutch landscape faintly seen through a frosted window: Ruisdael's
  windmill, pre-blurred in `art/molen-glass.jpg` (`body::before`), under a half-transparent wash (`--glass`). The content sits on plain white tiles with a soft shadow (`.tile`, `--card`, `--lift`), not
  ceramic Delft tiles: on the home tabs one per block (today's lesson, Naar het examen, Examenonderdelen, Grammatica en woorden, Lezen
  luisteren en spreken, Herhalen), and every inner screen is one tile. The museum label sits on the glass.
- **Type**: the system font only (`-apple-system, system-ui`: SF Pro on iPhone), so the
  app reads like a native iPhone app. No web fonts; headings semibold (600–700), never 800.
  No handwriting or decorative fonts.
- **The login window's look, everywhere** (the user liked its type and colours): headings in `--ink`, semibold (600),
  no diamond; small labels (`h3.lh`, `.ask`) in cobalt (`--blue`), sentence case, 15 px, never small capitals; cobalt only on the main action (`.btn`) and
  in icons; secondary buttons (`.ghost`, `.back`) are neutral: 1px `--line` border, `--ink` text; chevrons › in
  `--soft`; fields have a 1.5px `--ink` border, 52px high; the level switch (`.seg`) is a grey track with a white
  thumb, like iOS.
- **Type**: one scale, the iOS text styles, as tokens on `:root`: `--fs-xs` 12 (tab names), `--fs-s` 13 (small capitals
  labels, meta), `--fs-m` 15 (descriptions, notes, field labels, small buttons), `--fs-b` 17 (body, list titles,
  buttons, fields, documents), `--fs-l` 20 (options, long questions, feedback), `--fs-xl` 22 (h2), `--fs-xxl` 28 (today's
  lesson). Only display sizes stay their own (the logo, the big word 44, the score 72, the streak ribbon, the reader). Weights
  600, 700 only for the logo, the big word and the score. Headings a little tighter (-.01em to -.02em).
- **Shapes** ("Examenblad", the user's choice in November 2026, from four designs: it looks like the exam form and not
  generated): tiles and inner screens keep round corners (`--r` 20px; the login window 24px), everything inside is nearly
  square: `--rc` 4px for controls (buttons, fields, options, the level switch, documents, photos, icon squares), `--rs`
  3px for small things (letter boxes, word tokens, the timer); bars are pills, the feedback sheet has round top corners. Use the tokens, not new numbers. Solid 1px
  separators, flat buttons. The floating tab bar is a glass pill (like iOS 26 and Instagram); the login window
  (`#welcome`) is a card like Yandex ID (24px).
- **Logo**: the name "Bittertalen" in the system font, with a bitterbal (`--oranje`, light crumbs) as the dot on
  the i, the size and place of a normal dot (`h1 .idot`). The app icon is a bitterbal too: `icon-1024.png` is the
  source; `manifest.json` lists 192 and 512 px versions and a maskable one (the picture inside the safe circle), and
  the pages use `favicon-32.png`. Make them again from the source when the icon changes.
- **Dutch motifs instead of decoration**:
  - Header: the painting of the day (`ART` + `paint()` in `oefenen.html`), with a museum
    label underneath: artist, title, year, museum and one A2 sentence in Dutch (no
    translation), all in one size (15px, no italics). The full painting and the label are on the Vandaag tab; the
    other tabs and inner screens get the narrow strip (`main.big` is only set on Vandaag), on a phone softened (blurred),
    so the crop never shows half a face. Tapping the painting on a
    home tab opens its story (`story()`); on inner screens it shows the painting in full.
  - Streak: a ribbon in the Dutch flag (rood, wit, blauw, horizontal like the flag: `#AE1C28`, white, `#21468B`)
    hanging from the top of the painting, the number on the white band and "dagen op rij" under it (`.streak .lint`).
    The user chose it from 16 designs (a round stamp, glass pills, an enamel house number, turfjes, a spaarkaart…).
- **Never use**: cream or beige backgrounds, handwriting fonts, wobbly hand-drawn (uneven)
  border-radius, dashed lines, highlighter underlines under headings, decorative SVG
  squiggles, emoji as decoration.

## Home screen

Five tabs, switched by a floating glass bar at the bottom (`nav.tabs`, `setTab()`; like iOS 26 / Instagram:
icons with names, the names fold away while you scroll down). The bar is a nearly opaque capsule with a thin line and a deep
shadow, so it stands out on a white tile too (the clear glass one vanished on light screens). The current tab sits
under a lens (`.tabs .lens`), a bitterbal (an orange gradient, lighter top left, the same in dark mode) with the
tab in white, that slides to the new tab with a little spring and stretch, and can be dragged along the bar
with a finger (it grows and clears while held; where you let go is the tab that opens). The bar only
shows on the five tabs; exercises and inner screens hide it and go back with their back button or a swipe. The tab
you were on is kept (`tab`), so every back button returns to it and is named after it.

- **Mijn dag** (the first tab; it was called "Vandaag", which the user found unclear, November 2026; its key in the
code is still `vandaag`, and "Vandaag" below means this tab): the painting and its label, then today's lesson: how far you are today (a bar of six pills, "2 van 6
klaar"), one short line, and the steps (a new A2 learner sees "Waar begin ik?" right under the heading, above the time
choice, so it shows above the tab bar on a phone): all alike: its icon, title, a short line and ›, a done one a green check; no exam dates. When all are done the streak ribbon drops down once that day (`ww-stamp`) with a tap of the
phone. The learner chooses 10, 20 or 40 minutes. `planTasks()` selects short rounds within that estimated budget, prioritises weak parts, and rotates ties. `S.lessonPlan` freezes the steps for that day, level and budget so completed work does not reorder the lesson. Full timed exams start from Examen. Then Mix van de dag.
- **Examen**: "Naar het examen": one row per exam part (`.rd`, from `ready()`), the whole row starts that part's
proefexamen: its icon, the name with its minutes under it, the score on the right ("76%" in ink with where it comes
from under it; nothing without one) and ›; under it the bar with the pass line (`passOf()`: Lezen and Luisteren 19 of
25, KNM 28 of 40, the rest 70%) and one status line: a dot and the status (green Stabiel oefenresultaat, oranje Bijna
klaar, grey Nog niet klaar) or "Bij het oefenen" / "Nog niet geoefend", then "nodig: 76%". No line with the number of proefexamens, the date and "nieuwe vragen" under it (removed at the user's wish: the history is in Mijn resultaten). The user found a bare
percentage unclear, so the intro says in one line what the percentage and the line mean. The number is the share of right answers (the last
proefexamen, else practice), never a chance of passing; the intro says so. Under the rows one row to DUO's 15
official oefenexamens ↗, and on both levels "ONA en participatieverklaring" (`onaScreen()`, in `#talk`): the two parts not
everyone does, as DUO says them (who: the 2013 law and voluntary inburgering, the 2021 law does MAP instead; the Staatsexamen NT2 counts for the language exams only; the
exemption after 6 of the last 12 months of work, 48 hours a month; the portfolio of eight resultaatkaarten, then the
eindgesprek or a 64-hour course with the Blik op Werk keurmerk; the PVT with the four values, no mark), links to
inburgeren.nl ↗, and the eindgesprek to practise as four conversations (`GP` items with `ona:1`, the learner is a kok,
examiner "Mevrouw Bakker"), which the Gesprekken list and its count leave out. Check these rules when DUO changes them. Practising a part is on Oefenen.
Last on both level tabs, "Mijn examen" (`uitScreen()`, in `#talk`): per part the learner taps Geslaagd or Niet geslaagd for
the real exam (tap again to take it back). Their own record is `S.uit` `{part: {ok, at}}`;
a copy goes to `/api/outcome` (`api/outcome.js`, table `exam_outcomes` and `put_outcome()` in `supabase/schema.sql`, run it
in the SQL editor) to see whether the proefexamens and "Stabiel oefenresultaat" predict the result: part, ok, `pc` the last
proefexamen score, `rd` the status then (0 nog niet, 1 bijna, 2 klaar), the month. No name, e-mail, account or IP. The row's
random id stays on the device (`ww-uit`, also what is still unsent; it goes at the next start) and never in `S`, so a row
can't be tied to an account: a correction within a day changes the row, later it is a new attempt with a new row, and a row
can only be taken back on the device that sent it. `OUTCOME_CAP` new rows a month (default 2000); rows go after three years
(privacy.html says so). A passed part stays in today's lesson for now.
- **Oefenen**: "Examenonderdelen" (Lezen, Luisteren, Schrijven, Spreken, KNM: practice without the clock) and
"Grammatica en woorden" under it, "Lezen, luisteren en spreken" beside them on a computer.
The KNM row opens a list under it (`knmRow()`, `aria-expanded`, the chevron turns down): "Alle thema's" (the usual mixed
round) and the eight themes (`KNMT`), each with its own count; a theme round is `build("knm", {theme})` and "Nog een
ronde" keeps the theme. The theme names' translations come from the `"KNM: <theme>"` entries in `UI`.
- **Herhalen**: Mijn zwakke punten, Mijn fouten and Mijn woorden (the last two once there is something in them); with
neither, a short empty state says what will come there (`.empty`).
- **On a computer** (`data-desktop`), like a glass dashboard (the user's examples, November 2026): the painting of the
day, strongly blurred, fills the screen (`--paint-bg`, set by `paint()`); the app sits in one big window of frosted glass
with round corners (the glass on `main::before`: a backdrop filter on `<main>` would pin its fixed children inside it;
`main` sits above the menu with `z-index`); the museum wall exists only inside the window (it used to run across the
whole screen, under the menu). The menu is its own floating glass panel left of the window, level with its top
(`.tabs`; the user liked the floating bar, not a full-height white sidebar): a narrow strip of icons (76 px, a small
bitterbal for the logo, the language as a row like the tabs: the globe in line with the icons, not the cobalt pill,
which looked out of place there) that widens over the window to 212 px on hover or keyboard focus, also while the
pointer is on the language row (`:root:has(...)`), and then shows the logo, the tabs' names and the language code with
its arrow; the oranje lens behind the current tab; mirrored in Arabic; on
Vandaag the painting hangs framed on the cobalt museum wall (360 px high), the other tabs have no painting band.
- **Profiel** looks like an iPhone settings screen (the user's example, November 2026): on top a round avatar the learner
picks (`avScreen()` in `#talk`, "Kies je avatar": a grid of three by three, the chosen one with an orange ring; `S.me.av`, so it
goes along). The avatars are plush (crocheted) Dutch characters, images in `art/avatars/<key>.jpg` and the bitterbal in
`art/bitterbal-white.jpg` (`avSVG()`); the plush bitterbal is the mascot everywhere (the homepage too). Only the app icon
is still a photo of a real bitterbal: make it plush too once there is a plush bitterbal of at least 1024 px. `AVS`
keeps their names and the earlier SVG drawings: four girls (Volendam with the white hul, a supporter in orange, a headscarf in Delfts blauw, braids with
a tulip), four boys (Volendam, Koningsdag with a crown, a painter, a cheese carrier) and the bitterbal, the default; skin
tones vary on purpose. Their names under them are Dutch content (`lang="nl"`). The user showed a Vexels set as the example:
that set is copyrighted, so never copy it; no `<defs>`/gradients in them (a gradient defined in a hidden copy doesn't draw).
Under it the name (or "Profiel") and the
e-mail; then one filled cobalt banner (`.pban`: "Inloggen of account maken", or Bittertalen Plus when logged in), and
rounded grey groups of rows on the white tile (`.pg`, `.prow`: the name fields with the value on the right, the level as a
row with a native select over it, Trillen; the account with its status and Uitloggen / Account verwijderen as plain rows;
then `siteFooter()`: "Hulp" (Veelgestelde vragen, Uitleg over de examens, Prijzen, Abonnement opzeggen, Contact) and
"Bittertalen" (Over, Privacyverklaring, Website) as rows like the iPhone's Settings). Content: first and last name, the level (A2 or B1, a list, see B1) (`S.me` `{name, last}`, so they sync, and they also go to the account's
`user_metadata` by `syncMeta()`; an exam date was asked here once and removed at the user's wish, an old `exam` field is
kept as it is but not shown), the account
(see Accounts). No "Mijn resultaten" tile any more (removed at the user's wish, November 2026): the scores stay in
`S.res` and show in the Examen rows.

Every section appears once; don't add a second entry point to the same exercise.

## Navigation: one action language

- **Going somewhere** (an exercise, a screen, a book, a source) is a list row, `itHTML()`:
  the whole row is the button, title + grey description, a count on the right, `›` at the end.
  On the home screen a row starts with an icon like the Settings app on iPhone (`IC`, `icHTML()`): a filled white
  glyph on a cobalt (`--fill`) square of 34 px with 9 px corners; a path with class `s` is drawn as a line. Every step
  of today looks the same (`.sic` icon 36 px, title, line, ›, so the titles and chevrons line up), a done one a
  green square with a check; the steps are rows of one list with a line between them, like every other list (not
  bordered cards), also on a computer. The next step is no longer singled out (a filled card and a play button were tried; the
  user found one highlighted row odd): the order and the checks say what is next (`aria-current="step"`). Hover colours only under `@media (hover:hover)`: on iPhone they stuck after a tap. Not thin line icons on pastel squares (they look
  generated) and not painting details (tried, the user didn't like them). Counts on the right only once something
  was done (no "0 van 225").
  No "Oefenen →" or "Openen →" text links, no cards with their own buttons.
- **Filled cobalt `.btn`**: the one main action on a screen (Controleer,
  Volgende). **Outlined `.ghost`** (neutral grey border): secondary actions (Proefexamen, Mix van de dag,
  Wis).
- **Underlined `.hint`**: only small in-place toggles (Betekenis, Uitspraak).
  Text links `<a>` only for other websites, with ↗.
- One `h2` per section or screen; groups inside it get `h3.lh`
  (small capitals, `--soft`). Every inner screen starts with a back button named after where it
  goes: the tab's name (Mijn dag, Examen, Oefenen, Herhalen) for the home screen.
- **Practising is a focus screen** (`#play`): no painting, one row with ✕ (back to where you came from; in a
  proefexamen the first tap or swipe back only asks "Stoppen?" and the page springs back), the progress bar, the count (3/10) and the clock. The main
  button (`.act`), the exam buttons (`.exnav`) and the feedback stick to the bottom of the screen, under the thumb.
  Three options are set like the exam form (`.opts.one`, `optLt()`): a letter A, B, C in a square box, rows between
  hairlines. Marked: the box turns green with ✓ or red with ✕, the text stays ink, the other options fade; a choice in a
  proefexamen fills the box oranje. Answers to KNM, reading, listening and history questions start with a capital on
  screen (`capA()`); grammar options keep their case. The feedback is a plain, square sheet under a 2px ink rule (`.fb.sheet`): "Goed zo!" or
  "Niet goed" in colour, for a wrong answer "Goed is: <answer>" in ink, why, and Verder. The user found the earlier
  versions generated-looking: solid green and red fills, then separate tinted boxes with coloured borders, ✓ / ✕ in
  front and a tinted sheet, then a grouped grey list; don't go back to any of them.

## Words, motion, touch

- **Short words**: no explaining paragraph under every heading; a description says what is in it in a few words
  ("Korte teksten met vragen"). Text wraps balanced (`text-wrap`), units with a non-breaking space (`10&nbsp;min`).
- **Motion**: short and quiet, like iOS: a screen or tab comes in (`rise`), buttons give a little when pressed, a right
  option pops, a wrong one shakes, the feedback sheet slides up, the streak ribbon drops down. All off with
  `prefers-reduced-motion`.
- **Trillen, no sound** (the user's choice): `buzz("good"|"bad")` at every right or wrong answer and when the ribbon drops, `buzz("tick")` when an
  answer is chosen in a proefexamen (marked only at the end, so the tap says nothing about right or wrong):
  Android `navigator.vibrate`; iPhone has none for websites, so `tapIOS()` makes a fresh `<label><input type="checkbox" switch>` (display:
  none, in `<head>`), clicks it inside the tap and removes it (Safari 18+ gives the switch's own tap; a hidden switch
  kept in the page gave nothing on the user's iPhone). A switch in Profiel turns it off per device
  (`ww-tril`); it shows only on phones that can do it.
- **Over Bittertalen**: `over.html` (served as /over, in the sitemap, linked from Profiel above the privacy row):
  what it is, the name, who makes it, how it works, what it is not (not DUO), where everything comes from, contact.
  The maker's own story and photo go there when the user gives them.

## Paintings

Only public-domain or CC0 images, downloaded from Wikimedia Commons into `art/`,
resized to max 1000px and compressed (~100–150 KB each). Record every new image in
`art/CREDITS.md`. To add one, append to `ART` with `f` (file name), `y` (vertical focus
in % for the header crop), artist, title, year, museum and an A2 sentence. Check facts in the sentences; they double as KNM material.
Each painting also has `v`, its story in A2 Dutch (who made it, what it shows, why it is famous; paragraphs
split by `\n`), and `w`, three or four things you can really see on it (`de kan=jug|…`, English like the dictionary). Tapping the
painting in the header on the home screen opens `story()` (no extra row under the label, to keep the home screen short): the
painting (tap it to see it in full), the story to read or hear (recorded, see Voices), and the words, each can be kept in Mijn woorden (`{w, en, p, s, f}`). Look at the painting
before writing `w`, and check every fact in `v`.


## Photos (Spreken)

The picture tasks in Spreken use real photos in `foto/`, by the same rules as the paintings:
public domain or CC0 from Wikimedia Commons, max 640px wide (~30–100 KB), each recorded in
`foto/CREDITS.md`. An `SP` item lists its photos in `p[3]` (two to choose from, or three, in order if the
question says so); `FOTO` holds a short Dutch description of each for screen readers. No emoji as pictures.

## Progress

Progress is isolated by account, with a guest scope. `ww-progress-v2:<owner>` stores `{data, frame, version}` locally and in IndexedDB. Existing `ww-v1` data is migrated only into the account recorded by `ww-acc`, or into the guest scope if none was recorded. Never discard this legacy backup. Normal logout clears the active-owner marker and switches to guest progress, without merging account data into another account. A matching cached Supabase user may reopen that same local scope offline while session refresh is unavailable; it never grants server access.

`frame.base` is the last acknowledged server snapshot and must be a deep copy independent of live `S`. A pending write records its local input, target, receipt id and device id before sending. `syncProgress()` reads the latest row, merges offline changes, and updates only if its `t` still matches. Retries inspect `_receipts` so losing an acknowledgement cannot count the same answers twice. New practice-result rows have a random `id` as well as `at`; older rows still work. Errors schedule retries and show a sync status in Profiel. Do not revert to whole-document last-writer-wins.

Practice rounds (`build()`): due questions first, the lowest box first, but while unseen questions remain at most half
of a round (it was 70%, and a five-question round then brought one new question a day: learners met the same KNM
questions over and over). `GAP` is `[1,2,4,7,14,30,60]` days per box (`S.items .b`); a question right the first time
starts in box 2 (back in four days, not tomorrow); a wrong answer goes back to box 0. New KNM questions mix the short
ones and the situations (their `ord` is counted apart), so the exam's format is not kept until last.

`S.res` keeps the last 10 practice-exam scores per part. A stable practice result requires three recent results averaging at least 80%, each above the practice target, with at least two mostly new attempts. This describes practice performance. Speaking explicitly leaves pronunciation and pace unassessed. The score thresholds are practice targets.

New A2/B1 writing results also have an optional `writing` v1 snapshot: task-type and criterion point totals, task counts and the number left blank. It contains no answer text or error fragments. The current report separates types absent from that exam from types that scored zero; Profile combines up to five recent detailed attempts with their task/attempt counts. Legacy results retain their scores without invented breakdowns. Missing or malformed grades preserve the draft and do not create a total. A submitted blank exam scores zero without a model request.

Writing drafts are local and account-scoped (`ww-writing:<owner>:practice|exam:<section>`). They retain task keys, text, form fields, position, grouped B1 sentences and the original exam deadline. Practice has no timer. An expired exam opens its review without another timed attempt. Successful grading clears the draft. An unsuccessful request preserves it.

Writing feedback recommends at most two actions, prioritising unfinished tasks and critical content before other lost points. A zero for content is not treated as separate evidence of grammar or spelling weakness. Identified word-order errors can open the existing A2/B1 word-order section; other actions open the relevant writing task. These focused tasks use a separate `:focus/<task-key>` draft slot, appear among resumable drafts, and preserve ordinary practice drafts. Returning restores the exam result without grading or recording the attempt again. Detailed corrections, rewriting and Word export remain available under the summary.

Run `npm ci --ignore-scripts` and `npm test` after changes. `tests/browser.test.mjs` opens the homepage and the app
in Chromium (no errors, no sideways scroll, Arabic right to left, the sample question, the KNM theme list); it skips
where Playwright is missing, and the `browser` job in `.github/workflows/check.yml` installs it and makes it required. The workflow checks learner verb forms, order alternatives, normal UI entry points, diagnostic counts, time budgets, drafts and deadlines, account isolation, offline merges, conditional-write races, lost acknowledgements and grading-quota failures. Browser/microphone behaviour and human NT2 review still require separate validation.

`sw.js` makes the app work offline and start quickly: the page from the network if it answers within `FAST` (2.5 s),
else the cached copy (`cacheFirst()`: on a slow connection people waited for the page). Pure cache-first left the user's
iPhone on an old version in November 2026 (iOS stops a home-screen app's background work, so the background refresh of
the 1 MB page never finished), so don't go back to it. The page's `?v=` scripts and dictionary parts are cache-only: a
new copy of the page is stored only after all its files are in the cache (`storeApp()`), then versions it no longer
uses are removed (`prune()`), so the cached page always opens offline (`tests/browser.test.mjs` checks this, also
after an update). Keep `CACHE` as it is when `sw.js` changes: a new name throws away every cached painting, photo and
voice. A new `CACHE` tells the open windows at activate, only when it replaces an older cache (not on a first visit). Its install never fails: each core file is cached on its own, a miss is fine, and without a fresh page the old cache's page is carried over (an install that cached the whole page with `addAll` seemed never to finish on the user's iPhone). When
the cached copy was shown and the network's differs (another ETag), the open page gets
`{fresh:true}`, and because a page that is still starting can miss that, the time of the change is also kept at
`/__changed`, which the page asks after 4 and 15 s and when it comes back (`freshCheck()`); then a glass bar above the
tab bar says "Er is een nieuwe versie van Bittertalen" with "Vernieuwen" (`showFresh()`). So a push shows on the next
start, or at once after Vernieuwen. Paintings, photos and the dictionary from the cache and never fetched again once
there (on a slow line every start used to fetch them all again); the rest (manifest, icons, lib, audio/index.json)
cache first and refreshed in the background. The page sends the list of paintings and photos to keep 10 s after the
start, asks for a new sw.js at every start and return (`r.update()`), (Profiel's line with how long the start took was removed at the user's wish). `api/` never cached. Don't change the stored shape without migrating old data.
Saving progress to a file was removed on purpose. On an iPhone in Safari a tile on Vandaag (`drawA2hs()`)
asks to put the app on the home screen, because Safari can wipe a site's storage after a week without a visit; the
home-screen app has its own storage, so the progress goes along by the clipboard (Kopieer / Plak mijn voortgang).
The app moved to https://bittertalen.nl. Storage is per address, so on bittertalen.vercel.app a move screen
(`moveScreen()`) takes the progress along: in a browser it packs `S`, `ww-media` and own books (gzip, base64url,
`BITTERTALEN2:`, books dropped if the link would pass 60 000 characters) into the link `bittertalen.nl/#verhuis=…`,
and `arrive()` there merges it in (`mergeS()`; the fragment never reaches a server). A home-screen app can't carry its
memory to another address, so it is told to log in, reinstall from bittertalen.nl and log in there. With nothing to
move, the old address forwards at once; https://nedelands.vercel.app (the address before, moved in October) always
forwards. Remove the move screen once nobody uses the old address any more.

## Accounts (optional)

Logging in is optional; everything works without it except Claude's grading. Supabase (connected to the Vercel project
through the Marketplace: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`); the tables, row level
security and `use_checks()` are in `supabase/schema.sql` (run it in the SQL editor). Without those env vars
`/api/config` returns `{}` and the app behaves as before. The page loads `lib/supabase-2.117.3.js` (the UMD build,
vendored, MIT, `lib/supabase-LICENSE`) only when there is a session or one coming back from Google/Apple.
- Login: one login window (`#welcome`, see Welcome screen) with the login block (`loginHTML("w")`, `bindLogin()`),
  laid out like Yandex ID at the user's wish: the e-mail field, a row of square logo buttons (`PROV`: Google, Apple, Microsoft = Supabase's
  `azure`, Facebook; the brands' own logos), "Volgende" (sends the code) and "Face ID of vingerafdruk" (passkey). A
  provider shows when it is on in Supabase (`/api/config` reads `/auth/v1/settings`; Google is on since November 2026:
  the OAuth client "Bittertalen" in the user's Google Cloud project, consent screen published without a logo so it
  needs no verification; Supabase's Site URL and Redirect URLs are https://bittertalen.nl), also in an iPhone home-screen
  app: iOS may open their page in a separate Safari window, so there the app marks the login (`HAND` = `ww-hand`, a
  random `h` in the address it comes back to); a window that comes back with an `h` it did not make leaves the one-time
  code at `/api/handoff` (`handBack()`, table `handoff` in `supabase/schema.sql`, rows gone after 10 minutes) and says
  "Ga terug naar Bittertalen", and the app takes it when it is visible again (`claimHand()`) and exchanges it itself
  (PKCE: the code is useless without the verifier only the app holds). If the login comes back in the app, nothing changes
  (that is what happened on the user's iPhone in November 2026; the handoff is the fallback for other iOS versions). No name is asked to log in: the e-mail is enough, the providers bring theirs
  (`syncMeta()`), and Profiel has the name fields; the e-mail code (`signInWithOtp` + `verifyOtp`, a 6-digit
  code, so an iPhone home-screen app never has to open a link) only with `LOGIN_EMAIL=1`, because Supabase's own mail
  only reaches the project's team (it needs custom SMTP); passkeys (experimental in Supabase) only with
  `LOGIN_PASSKEY=1`, and a passkey is added after logging in another way.
- Sync uses the account-scoped state and retry journal described above. Supabase RLS still limits reads and conditional updates to the signed-in user's row. No new table or privileged client API is needed.
- Free checks without an account: `FREE_CHECKS` a day per visitor (default 2, 0 turns it off), single tasks only (cost
  1, no proefexamens), and `FREE_CAP` a day for all visitors together (default 50). The visitor is a hash of the IP
  with the service key (`visitor()` in `api/_supa.js`), counted in `free_checks` by `use_free_checks()` (in
  `supabase/schema.sql`, rows deleted after a day; privacy.html says so). Without that function in the database the
  server answers `login` as before. `/api/config` gives `free`; the page shows how many are left (`acc.free`,
  `freeNote()`) and asks to log in when they are used up.
- Grading: with accounts on, `/api/check` needs the user's access token (or a free check, above) and takes checks from `CHECK_LIMIT` a day
  (default 5 when Plus is set up, else 20, Amsterdam days, `check_usage`; `PLUS_LIMIT`, default 60, with Bittertalen Plus): one task 1, a Schrijven proefexamen 2, Schrijven B1 4, a Spreken proefexamen 6
  (`checkCost()`; the page's `examGate()` uses the same numbers and warns before such a proefexamen). A failed grading gives the learner their checks back. Once the provider call starts, its global reservation is retained even if the reply is lost, since that request may have incurred cost. Structured `grading_usage` logs record model/token usage without learner text. Configure deployment-log alerts for `grading_quota_unavailable` and review token usage in the provider dashboard. The code does not configure external alert recipients. The answer has `left`.
- Welcome screen = the login window (`#welcome`, `drawWelcome()`): a fixed full screen with the painting of the day
  behind a rounded white card (the logo, "Inloggen of account maken", the login block (no level), "Eerst rondkijken"
  or "Terug"); under the card on the painting what an account gives, the privacy link and the painting's name. It opens
  by itself the first time the app opens with accounts on and nobody logged in (once per device, `ww-welcome`, also
  shown once to people who already had progress), and from Profiel ("Inloggen of account maken"); after logging in
  you are back where you were.
- A ceiling for everyone: all Claude checks of a day together, logged-in and free, stop at `CHECK_CAP` (default 400,
  `use_total()` and `check_total` in `supabase/schema.sql`), so many new accounts can't run up the bill; then the
  server answers 429 `busy` and the page says "Morgen kan het weer". Without that function, or if its reply is invalid, grading returns 503 `quota_unavailable` before calling the model. `/api/check` also refuses bodies over 200 KB (413).
- Security headers for every address in `vercel.json`: a Content-Security-Policy (scripts and styles only from the site
  itself plus inline, connections only to the site and `*.supabase.co`, frames only `youtube-nocookie.com`, media also
  any https podcast, no framing of the site), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`
  (microphone only for the site, no camera or location) and COOP. A new outside service (a script, an API, an embed)
  needs its host in the CSP, or the browser blocks it.
- `/api/account` (DELETE) deletes the user and, by cascade, their rows; the progress on the device stays.

## Bittertalen Plus (payments)

The user chose (9 November 2026, replacing the earlier version with levels, a yearly price and a free week): practice,
the proefexamens and `CHECK_LIMIT` Claude checks a day (default 5) stay free with an account; Bittertalen Plus, a monthly
Stripe subscription of €9,99, only raises the daily Claude checks to `PLUS_LIMIT` (default 60). No trial, no yearly price,
one Plus for both levels. No video or podcast may ever go behind it (YouTube's policies).
- Stripe by plain fetch, no SDK (`stripe()` in `api/_supa.js`). Off unless `STRIPE_SECRET_KEY`, `STRIPE_PRICE` (the
  monthly price's id, `price_…`) and `STRIPE_WEBHOOK_SECRET` are set (never in the repository or the chat); without them
  Plus is hidden and the free limit stays 20. `PLUS_PRICE` is only the shown price (default "9,99"); `STRIPE_TERMS=1`
  makes Checkout ask to accept the terms (set their URL in Stripe first).
- `api/plus.js` (POST, logged in): `{go:"buy"}` → a Stripe Checkout URL (subscription, `subscription_data.metadata.uid`,
  back to `/?plus=ok` or `/?plus=stop`), or the portal when Plus already runs; `{go:"manage"}` → the customer portal
  (cancel, payment method, invoices; back to `/?plus=back`). Never a second subscription.
- `api/stripe.js`: the webhook (raw body, `bodyParser:false`), events `customer.subscription.created`, `.updated` and
  `.deleted` (Snapshot payloads). Every event reads the subscription from Stripe again and keeps the user's row of table
  `plus` (`supabase/schema.sql`; RLS: read own row; written only by the server): customer, sub, status, `until` (end of
  the paid month), `ends` (cancelled). An old subscription that ends never hides a newer one; an event for a deleted
  account cancels the subscription.
- `api/check.js`: Plus (`isPlus()`: active, trialing or past_due, until `until` plus a day) gets `PLUS_LIMIT`; Plus checks
  don't count against `CHECK_CAP`. `api/account.js` cancels the subscription at Stripe before it deletes the account.
- The page: `acc.plus` (read in `usage()`), `isPlus()`, `myLimit()`, a "Bittertalen Plus" row in Profiel under the
  checks counter (`plusLine()`) and `plusScreen()` in `#talk` (the one entry point). `plusBack()` handles the return from
  Stripe and `plusWait()` looks again a few times, because the webhook may be later than the learner. Stripe's pages are
  navigations, so the CSP needs nothing new.
- privacy.html has a Stripe section (Stripe Payments Europe, seven years for payment records). Before taking real
  money: KVK (within a week of the start), Stripe's account verification, live keys, algemene voorwaarden and the right
  of withdrawal for digital services.

## Content

Lezen texts (`LZ`: `[text, questions, intro?]`) are plain strings rendered as documents by `docHTML()`: the first line is the title
(unless it is a letter or an e-mail), `label: value` lines become a table, `Van:` starts an
e-mail header. Luisteren items in `LS` are `[text, question, right, wrong, wrong, photo?]`; a dialogue has one line per
turn (`A: …` / `B: …`), read with two pitches, and the optional photo from `foto/` sets the scene. In the
proefexamen a fragment can be played twice (counted per fragment). `LSM` holds longer fragments with two or three
questions (`[text, photo, [[q, right, wrong, wrong], …], intro?]`, keys `ls|m<i>.<j>`); each Luisteren proefexamen takes up to
eight of them, questions kept together, as DUO's oefenexamens are almost all long fragments with two or three questions.
The intro (who reads or hears what, e.g. 'Yusuf belt de woningcorporatie.') is shown above, as on the exam. In the Lezen, Luisteren, KNM and Schrijven proefexamens you can go back: an answer is only
selected (`cur.pick`, option order kept in `cur.op`; for Schrijven `{f, t}`, the form fields and the text), "Overzicht" shows every question, and everything is marked when
handed in (`submitExam()`, also when the time runs out). KNM follows the 8 official themes of the exam since 1 July 2025
(40 questions, 45 minutes, 28 to pass). The questions from `KNMS` on are situations with a person in them, as on the exam; the KNM proefexamen takes three
of them per theme first and keeps each theme together, as DUO's voorbeeldexamens do; every KNM question has
'▶ Lees voor' (Luisteren too), because the exam reads the questions aloud. A KNM row can have a photo from `foto/`
as a 7th field, as every exam question has one. DUO's voorbeeldexamens are copyrighted: never copy their questions. Wrong options must be plausible (real instanties, real numbers) and about as long as the right one, so the
longest answer is not a giveaway. Woordenschat has the definitions in `VO` and the themed A2 word list `WT`
(Dutch with de/het = a short Dutch description; small words get a gap sentence with ___, numbers the digits), practised three
ways: word → description, description → word, and by ear (`wl|`: the word is only spoken, `hear`). Description → word can also be
typed (the 'Typ het antwoord zelf' mode, with de/het). `BET` holds the Dutch meaning of a word (from `WT`, `VO` and a few more), for the Betekenis hint on verbs and de/het. Item keys (`lz|3.1`, `wn|de huis`) are
stored progress: append new items, don't reorder or rename existing ones.

## B1 (Staatsexamen NT2, programma I)

Built part by part: Lezen, Luisteren, Schrijven and Spreken. The level is `S.lvl` ("A2" by default, "B1"; it syncs with the progress).
The user wants it chosen once, at the start: as the first step of the starttest (`startTest()`'s `intro()`, `.seg.tlv`,
`segHTML()`; the welcome screen had a level switch too, removed at the user's wish; at B1 the test, which checks the A2 basics, is skipped and the
button goes to today's lesson). After that the app shows only that level: Examen, Oefenen and Mijn examen have no A2/B1
tabs (they were removed at the user's wish; don't bring them back). It is changed only in Profiel, with a list: a native
`<select id="plvl">` under a field-like box (`.pick`, like the language pill). `setLvl()` sets it. `parts()` gives the exam parts of the level: at B1 `l1` replaces `lz`, `lb` replaces `ls`, `wb` replaces `wr` and `sb` replaces `sp`; KNM
belongs to both routes. At B1 Examen and Oefenen show Lezen B1, Luisteren B1, Schrijven B1, Spreken B1 and KNM (with a
row to the official oefenexamens NT2 ↗). At B1 the Grammatica tile shows the B1 rounds first and the A2 ones under "Herhalen op
A2-niveau", and today's grammar step helps with a B1 round. The page title, description, Open Graph tags, JSON-LD and
`manifest.json` name both levels.
- Grammatica B1: `G1` (`[topic, sentence with ___, right, wrong, wrong, why]`, section `g1`, keys `g1|<i>`): die/dat/
  wat/waar, zou en als, passief, er, voegwoorden, om … te, vaste voorzetsels, wederkerend, tijden, vergelijken. A wrong
  option must never also be correct Dutch. `WO1` (section `w1`, like `WO`): long sentences with bijzinnen, more verbs
  and the passive. `VO1` (section `v1`, `word:description` split by `|`, no colon inside a description): B1 words, asked
  both ways (`v1|`, `v1r|`), and added to `BET`. Not in the Mix at A2. Today's lesson uses `parts()`; the Mix leaves out the other level's reading and listening.
- Lezen B1: `LZ1` (`[text, questions, intro]`, the same shape as `LZ`), section `l1`, keys `l1|<text>.<question>`,
  label "Lees de tekst (B1)". Six questions per text with three options; question types like the exam: main point,
  purpose, details, the writer's opinion, a word or phrase in context, what you should do. The proefexamen (`EX.l1`) is
  6 whole texts, 36 questions, 110 minutes, with Overzicht and going back, like Lezen A2. DUO publishes no raw pass mark
  (a scaled 500), so the pass line is the default 70%. Places, organisations and people are made up; facts about the
  Netherlands in the texts are real. The first eight texts are about 220 words, the later ones about 300; the exam's
  texts are longer still, so new ones may be longer.
- Luisteren B1: `LSB` (`[text, photo|null, [[q, right, wrong, wrong], …], intro]`, like `LSM`), section `lb`, keys
  `lb|<fragment>.<question>`. Radio, news, podcasts, voicemail, phone calls, talks and conversations of about 140–210
  words, three or four questions each (main point, details, an opinion, what to do). The proefexamen (`EX.lb`) takes
  whole fragments up to 39 questions in 90 minutes, with Overzicht; each fragment is heard once (A2: twice), and before
  listening the screen lists every question of the fragment (`qs`), like the reading time on the exam. Practice takes
  two whole fragments (`someTexts()`) and may replay. Pass line the default 70%.
- Schrijven B1: `WRB` (objects: `k` kind, `t` task, `m` example; `c` the sentence to finish (ends with …) or a text with
  an open place `___`; `fl`/`o` form questions; `i` situation, `d` information rendered by `docHTML()`, `f` photos, `p`
  the points to write about), section `wb`, keys `wb|<i>`. Three kinds, as on the exam: zinsopdracht (`z`, 2 points:
  inhoud 0–1, grammatica 0–1), formulier (`f`, 7: inhoud 3, woorden 1, grammatica 2, spelling 1) and e-mail (`m`, 8:
  the same plus samenhang 1) (`WBMAX`, and `SCORES_WB` in `api/check.js`, which grades them with `part:"wb"` and its own
  B1 prompt and sets `passed` from the points). The proefexamen (`EX.wb`, `wbTasks(8,3)`) is 12 tasks in 100 minutes:
  8 zinsopdrachten, a form, an e-mail about two photos and two other e-mails, 47 points, with Overzicht; it costs 4
  checks. The pass line is 25 of 47 (`PASSP.wb`): the public exams of 2023–2025 needed about that. Practice is three
  zinsopdrachten and one longer task, each checked on its own; today's short round alternates three zinsopdrachten and
  one longer task; zinsopdrachten that follow each other in practice are checked together in one call (`checkZ()`,
  `cur.zs`: one check instead of three). `wrTask()` builds the full task text for Claude (and the Word file) from all these fields.
- Spreken B1: `SPB` (objects: `k` kind, `t` situation and task, `f` photos, `d` a short text, `m` example), section
  `sb`, keys `sb|<i>`, type `reveal` like Spreken A2 but with `spk`, the seconds to speak (`listen(mode, done, lim)`).
  Two kinds, as on the exam: korte opdracht (`k`, 20 seconds: asking, choosing, explaining, apologising; inhoud 0–2,
  grammatica 0–1) and middellange opdracht (`m`, 15 seconds to think, which is only said, and 30 to speak: advice, an
  opinion with reasons, comparing two photos and choosing, a story about three photos in order; inhoud 0–3, woorden
  0–1, grammatica 0–2, samenhang 0–1) (`SBMAX`, `SCORES_SB` in `api/check.js`, `part:"sb"`, its own B1 prompt;
  voldoende is inhoud 2 and 60% of the points). The proefexamen (`EX.sb`, `sbTasks(8,8)`) is 8 short and 8 medium
  tasks, 80 points, 25 minutes, costs 6 checks; pass line the default 70% (DUO publishes no raw mark). In the
  proefexamen the question is read aloud, then the thinking time (`prep`: 15 s for a medium task, 5 for a short one with
  a photo) counts down and the answer starts by itself (`prepThen()`); if the phone won't open the microphone without
  a tap, the take is dropped and the button asks for one.
- Elsewhere at B1: six B1 conversations in Gesprekken (`b1:1`, listed first at B1), two B1 stories in the Boekenkast
  (`zorg`, `molen`), and two harder questions per history chapter (`GSB`, keys `gb|<id>.<n>`, sec `gs`, only at B1:
  `gsItems()` and `lv()` in `build()` leave them out at A2).

## Writing and speaking check (Schrijven, Spreken)

The result shows DUO's points as bars, one per criterion (`scoreHTML()`, `.dpts`: full green, some oranje, none red)
with the total, then the learner's own text with every error marked where it is and numbered (`markErrs()`,
`ownHTML()`: Claude's `wrong` is looked up in the text; one it can't find is only in the list), the numbered list of
errors (`errsHTML()`: wrong → right, why) and the corrected text.

"Schrijf het nog een keer" (`redo()`, `redoItems()`: Schrijven and Schrijven B1, in practice and per task after a proefexamen,
not in Spreken, and only when the corrected text differs): the learner gets their own text back to correct, without the
corrected text on screen (the errors are in a fold), and "Vergelijk" marks it against Claude's corrected text on the phone
(`diffHTML()`: struck through = take out, green = add; capitals and punctuation count; a word in the wrong place counts as
one). No Claude call, so it costs no check, works offline and changes nothing in `S`. After a proefexamen it goes back to the
same result, not marked again. A sentence to finish comes back whole (`zWhole()`), because `corrected` is the whole sentence.
A B1 form gets one box per answer that differs: `SYSTEM_WB` asks for one line per form answer with the open answer last, and
another shape gives no button. An A2 form's `corrected` is the open answer only, so only that comes back.

`api/check.js` is a Vercel function that grades writing with Claude (`claude-opus-5-5`,
structured JSON output, server-side refusal fallback). The page posts
`{tasks:[{task, form, text}]}` and gets `{tasks:[{passed, verdict, corrected, errors, scores}]}`;
the prompt is built on the server, so the page can't send arbitrary prompts. Schrijven is scored on DUO's
beoordelingsmodel: inhoud 0–3, woorden 0–2, grammatica 0–2, spelling 0–2, samenhang 0–1 (inhoud 0 makes everything 0;
the prompt counts errors: 0–2 = 2, 3–5 = 1, 6+ = 0). `passed` is set by the server from the points (inhoud 2+ and 7 of 10),
not by Claude, and the Schrijven proefexamen score is points of all 4 tasks against the 70% line. It only
accepts requests whose Origin is the site itself, and with accounts on only from a logged-in user (see Accounts). It needs `ANTHROPIC_API_KEY` in the
Vercel project's environment variables (the user adds it in the dashboard; never handle
the key in chat). Without it the page falls back to showing the example answer.

Spreken uses the same function with `{part:"sp", tasks:[{task, text}]}` (up to 16, for the
proefexamen); `task` also says what the photos show (`spTask()`, from `FOTO`). Each result also has `scores`
(inhoud 0–3, woorden 0–2, grammatica 0–2, samenhang 0–1: DUO's criteria as far as a transcript shows them; pronunciation
and fluency can't be judged), clamped on the server; the Spreken proefexamen score is points of all 16 questions.
The Spreken proefexamen has DUO's four parts of four (since March 2025): a question, one photo (describe and answer),
two photos (choose and explain), three photos (a story in order, or three separate things to say something about: learners
remembered both kinds from the real exam, so the part's label leaves the order to the question); the proefexamen reads each question aloud, like the
video on the exam, and speech stops before the microphone opens; `SP` items fall into a part by their number of photos. Claude can't take audio, so the phone writes the answer down first (Web Speech
API, `nl-NL`). Recording (`MediaRecorder`, to play the answer back) and transcribing are
separate takes, never at the same time: on iPhone they compete for the microphone. One
minute per answer. Recordings and transcripts stay in memory only. "Zeg het na" (free, no Claude call):
the learner reads the example or corrected answer aloud and the words speech recognition missed are marked.

Making new Lezen and Luisteren material with Claude was removed (it cost a call per tap and its
result was invisible). Items made earlier stay in `S.gen` and are still added by `addGenerated()`.

## Beginnen (from nothing)

For someone who starts from nothing, at A2 only. `BG` in `oefenen.html` holds twelve short lessons (`t`, `s`; `x` the rule in very
simple Dutch, a paragraph per line, `<b>` allowed; `e` the same in English, behind an "English" toggle and open when the menus
are in English, the one place where an explanation is in English, because a beginner can't read the Dutch yet (there is no
Arabic, Turkish, Hindi or Chinese version of the explanations); the lessons' own text has class `.bgl`: never translated, always
left to right; `v` examples
and `w` words as `Dutch=English` split by `|`, both recorded; `q` questions `[question, right, wrong, wrong, why]`). Keys
`bg|<id>.<n>`, section `bg`: append, don't rename. A wrong option must never also be correct Dutch. A lesson is Klaar when every
question was answered right once (`bgDone()`). Twelve lessons are the basics, not A2: don't promise more on screen. Screens in
`#talk`: `bgList()` (a row at the top of Grammatica en woorden, A2), `bgLes()`, `startTest()`.

The starttest first asks the level (see B1), then (`START`: one question per lesson, easy to hard, each with "Ik weet het niet"; no right or wrong shown; three misses
in a row offer an early recommendation and a continuation button) gives `S.start` `{at, lv, miss, untested, asked}`. Only asked questions count in the displayed score. Untested lessons can be recommended, but are not counted as errors. The routing is: 10+ right `lv` 2, needs no lessons; 5+ `lv` 1, the
lessons in `miss`, one a day instead of the grammar round; fewer `lv` 0, all lessons in order, and today's lesson is only the
lesson of the day plus "Herhalen" (`SHORT.bg`, `bgDue()`, the lesson questions that are due), without the Mix, until the lessons
are done (`bgTodo()`, in `planTasks()`). A lesson done today stays on the list, or the day would never finish. It is offered at
the top of Vandaag ("Waar begin ik?") at A2 while there is no `S.start` and fewer than 30 practised items, and on the Beginnen
screen. Without a test nothing changes. The Mix only takes lesson questions that were already practised.

## Boekenkast (reading)

Built-in A2 stories live in `BOOKS` in `oefenen.html` (original texts; check facts, they double
as KNM material). Readers can add their own books (.epub without DRM, .txt, pasted text);
those are stored only in IndexedDB (`books` list, `book:<id>` text), never in `ww-v1`.
`S.bk` keeps reading positions and `S.words` the saved words (`{w, en, p, s, f}`; a few early
ones had `ru`, which `enWords()` replaces with English from the dictionary), practised as `bw|…` items, also in the Mix.

Tapping a word looks it up in the Dutch–English dictionary, built
from English Wiktionary by `dict/build.py` (kaikki.org extract, CC BY-SA 4.0; keep the credit
line on the Boekenkast screen). `dict/nl-en.txt` is the whole dictionary; the app loads its parts by first letter
(`dict/nl-en/<letter>.txt`, `_` for the rest, made by `dict/split.py`, which `build.py` runs; `dshard()` in the page
must match `shard()` there). `lookUp()` runs `define()`, loads the parts it missed and runs it again, so a tap loads
a few parts of about 100 KB, not 7 MB; opening the shelf or the history sends every part to the cache in the
background (`warmDict()`), so lookups work offline later. `nl-en.txt` stays deployed for pages from before the split. The popup shows the
lemma, de/het, plural or verb forms (perfectum aux from `V`), and finds separable verbs
(bel … op → opbellen). Meanings are in English.
No Claude calls in the reader: whole sentences go to Google Translate via a link.

## Geschiedenis van Nederland

"Geschiedenis van Nederland" (a row under "Lezen en luisteren") is a timeline of short A2 chapters in
`GS` in `oefenen.html`, from the hunebedden to now, grouped by period (`g`). Each chapter has years, a text
(one paragraph per line, tap a word for the dictionary popup, like in the reader), an optional picture at the top
(`foto/` or `art/`, same rules as the photos, credited in `foto/CREDITS.md`), more historical paintings, prints and
photos between the paragraphs (`f`: `[file, caption, after paragraph n]`, shown whole, tap to enlarge) and three questions, stored as
`gs|<id>.<n>` items (also in the Mix and in "Mijn zwakke punten"). Original texts: check facts, they double as
KNM material. `S.hs` keeps when a chapter was last opened; a chapter is "Klaar" when every question was
answered right once. Append chapters and questions; don't reorder or rename them.

## Voices (speech)

Everything the app says from its own material is recorded: `audio/<key>.mp3`, one file per line, made once with Google
Cloud Text-to-Speech, Chirp 3 HD voices (chosen by ear: Vindemiatrix for women, Charon for men; Aoede and Orus only
when two women or two men talk together). `speak(t)` keeps its old interface (lines split by `\n`, `A: …` / `B: …` /
`C: …` for a dialogue) and plays each line's file if `audio/index.json` lists its key (`sayKeys()`: a dialogue's lines
are keyed by the whole dialogue, other lines on their own), else the phone's Dutch voice (`utter()`), as for own books,
Claude's corrections and dictionary words. The first line starts inside the tap, the rest follow on the same audio
element (iPhone only plays sound from a tap). `stopSpeak()` stops both; `speaking()` says whether either still runs.
`sw.js` keeps each file after its first play and answers the byte ranges Safari asks for.

`node audio/build.mjs` records what is new or changed and deletes what no line uses any more (`--dry` only counts,
`--dry --who` shows who says what). It reads the texts from the page itself in headless Chrome (`voiceTexts()`: every
text the app passes to `speak()`, with its kind), so after adding or changing Luisteren, KNM, Spreken, Gesprekken,
words, paintings or history, run it and commit `audio/`. Who speaks: dialogue people by how they introduce themselves
(names and titles in `FEMALE` / `MALE` in the script; add new names there), the KNM, Luisteren and Spreken questions by
Charon (as the voice on the exam), words and reading aloud by Vindemiatrix, Gesprekken by the role (`GP .w`) and the
learner's example answers by the other voice. The Google key is in `~/.config/bittertalen/tts.env` (`GOOGLE_TTS_KEY`, a
key restricted to the Text-to-Speech API in the user's Google Cloud project); never put it in the repository or the chat.
In a cloud session the key is a network secret of the environment `nedelands` (host texttospeech.googleapis.com, header
`X-Goog-Api-Key`, no prefix), which the proxy puts in: run `NODE_USE_ENV_PROXY=1 GOOGLE_TTS_KEY=dummy node audio/build.mjs`
(the page's texts then come through Playwright).
The whole app is about 240 000 characters, inside Google's free million per month.

## Gesprekken (conversations)

"Gesprekken" (a row under "Lezen, luisteren en spreken") are everyday role plays in four groups: on the phone
(huisarts, work, landlord, school, gemeente, 112, a language school), work, school and the doctor (a job interview,
a day off, the teacher, the GP's consulting room), in town (bakker, apotheek, café, station, exchanging a jumper,
the bike repairer, the market, the library, asking the way) and the neighbours. Free and
offline, no Claude (the user chose this over an AI conversation partner). Each one in `GP` in `oefenen.html` is a script:
the other person's line is read aloud (`speak()`), the learner answers out loud through `listen("say")` or types,
and `gpFits()` checks the answer for keywords (`k`, groups of alternatives); a line marked `x` is skipped when the
answer already said it. Two misses show the example answer (`m`). At the end: how many answers needed no help and
every example answer to listen to. `S.gp` keeps per conversation `{n, b, at}`. Check that every `m` fits its own `k`.
Facts in the scripts double as KNM material: check them.

## Luisteren en kijken (real Dutch)

Real speech from Dutch YouTube channels and podcasts, listed in `MEDIA` in `oefenen.html` (id, name,
video or audio, level 1–3, a Dutch description). `api/feed.js` fetches the latest 15 episodes of
the whitelisted feeds (YouTube channel RSS, podcast RSS; no key, cached by Vercel's CDN for 30 min)
and returns `{link, items:[{t, d, s, v|a, n}]}`; to add a source, add it to both `MEDIA` and `FEEDS`.
Only free sources whose episodes are entirely in Dutch. Videos play in the YouTube embed
(`youtube-nocookie.com`, Dutch captions on; a Short, `sh` from the feed's /shorts/ link, gets an upright 9:16 box;
"Volledig scherm" uses the browser's fullscreen, or on an iPhone, which has none for a page element, lets the box cover the
screen with a ✕, `vFull()`), podcasts in `<audio>` with 10 s back and 0.75/1/1.25×.
Thumbnails come through `api/thumb.js` (`/api/thumb?v=<id>`, only i.ytimg.com's mqdefault, CDN-cached a week), so
Google sees nobody until a video is opened. YouTube's developer policies: keep the player as it is (no overlays, ads
and branding intact), never put the videos behind a paywall, and privacy.html links YouTube's Terms and Google's
privacy policy.
What was opened, where a podcast stopped and the chosen speed stay in `localStorage` `ww-media`,
not in `ww-v1`.


## Audit follow-up validation

`supabase/calibration.sql` is a read-only owner report of self-reported real exam outcomes by practice-score band, with sample sizes and Wilson intervals. It does not expose a public view or change the schema. Do not claim the training targets have been empirically calibrated until this report and a qualified NT2 review have been completed against the correct project. Keep historical label changes in mind when analysing outcomes.
