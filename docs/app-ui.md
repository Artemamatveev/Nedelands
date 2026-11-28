# The study app: screens and interaction
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

## Home screen

Five tabs, switched by a floating glass bar at the bottom (`nav.tabs`, `setTab()`; like iOS 26 / Instagram:
icons with names, the names fold away while you scroll down). The bar is a nearly opaque capsule with a thin line and a deep
shadow, so it stands out on a white tile too (the clear glass one vanished on light screens). The lens is a rounded
rectangle (19 px corners, the bar 24 px, so they run parallel), not a circle: a circle cut off longer names such as
"Мой день"; a name wider than its button ("Повторение") is set a little smaller, down to 9.5 px (`fitTabs()`, phone only). The current tab sits
under a lens (`.tabs .lens`), a bitterbal (an orange gradient, lighter only at the top where the icon is, the same in
dark mode) with the tab in white (at least 4.5:1 behind the name, measured by the browser test), that slides to the new tab with a little spring and stretch, and can be dragged along the bar
with a finger (it grows and clears while held; where you let go is the tab that opens). On a phone `LENS` in `oefenen.html` moves it
(24 November 2026, the user found it jerky): a critically damped spring played as Web Animations keyframes on the compositor
(with an explicit start time, so it doesn't stand still while the new tab is drawn), each glide starting from the spring's own
place and speed, so a second tap or a flick carries on without a stop; the place is the `translate` property in tabs, never
`transform` (a `scale` after a transform pushed the stretched lens sideways), and the stretch follows its speed; a drag catches
up with the finger instead of jumping under it. `tests/browser.test.mjs` ("lens glides") checks it frame by frame. The
computer's menu keeps its CSS transition. The bar only
shows on the five tabs; exercises and inner screens hide it and go back with their back button or a swipe. The tab
you were on is kept (`tab`), so every back button returns to it and is named after it.

On installed iPhone apps at normal zoom, `data-iphone-dock` anchors the bar from the top using a calibrated
`--app-viewport-height` and the existing safe-area gap. Record the largest observed `window.innerHeight` separately
for each viewport width, before keyboard resizing. A smaller keyboard/stale viewport cannot raise the dock, and
returning to portrait restores its previous height. Do not use `screen.height` or `100vh`/`100lvh`: they can include
system space outside the app's web view and the CSS-unit version clipped the bar on the user's phone (14 November
2026). Document scrolling, lens dragging and compact-on-scroll remain unchanged. Browsers, iPads, Android and pinch
zoom use the native CSS anchor. Desktop WebKit/emulated checks cannot fully reproduce a native iPhone compositor bug.

- **Mijn dag** (the first tab; it was called "Vandaag", which the user found unclear, November 2026; its key in the
code is still `vandaag`, and "Vandaag" below means this tab): the painting and its label, then today's lesson: how far you are today (a bar of six pills, "2 van 6
klaar"), one short line, and the steps (a new A2 learner sees "Waar begin ik?" right under the heading, above the time
choice, so it shows above the tab bar on a phone): all alike: its icon, title, a short line and ›, a done one a green check. The next saved exam date appears over the steps. When all are done the streak ribbon drops down once that day (`ww-stamp`) with a tap of the
phone. The learner chooses 10, 20 or 40 minutes. `planTasks()` selects short rounds within that estimated budget, starts with the closest exam parts within fourteen days, then prioritises weak parts and rotates ties. When a writing follow-up is due, it appears above the steps with a new sentence on the same rule. `S.lessonPlan` freezes the steps for that day, level and budget so completed work does not reorder the lesson. Full timed exams start from Examen. Then Mix van de dag.
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
examiner "Mevrouw Bakker"), still scripts with keyword checks (`talk()`, `gpFits()`, `S.gp`), not AI conversations. Check these rules when DUO changes them. Practising a part is on Oefenen.
Last on both level tabs, "Mijn examen" (`uitScreen()`, in `#talk`): per part the learner taps Geslaagd or Niet geslaagd for
the real exam (tap again to take it back), and after that, if they want, the grade from DUO's letter: 1 to 10 for an A2
part and KNM, a score up to 1000 for a Staatsexamen NT2 part (500 or more is a pass; `NT2PART`, `scParse()`, `setScore()`,
since 28 November 2026; DUO shows it as "Cijfer" under Details examen in Mijn Inburgering, a whole number in the
examples the owner saw). Their own record is `S.uit` `{part: {ok, at, sc?}}`;
a copy goes to `/api/outcome` (`api/outcome.js`, table `exam_outcomes` and `put_outcome()` in `supabase/schema.sql`, run it
in the SQL editor) to see whether the proefexamens and "Stabiel oefenresultaat" predict the result: part, ok, `pc` the last
proefexamen score, `rd` the status then (0 nog niet, 1 bijna, 2 klaar), `sc` the grade or score or null (column and
`put_outcome_sc()` from migration `20261128140000_outcome_score.sql`; until it has run, `put_outcome()` keeps the rest), the month. No name, e-mail, account or IP. The row's
random id stays on the device (`ww-uit`, also what is still unsent; it goes at the next start) and never in `S`, so a row
can't be tied to an account: a correction within a day changes the row, later it is a new attempt with a new row, and a row
can only be taken back on the device that sent it. `OUTCOME_CAP` new rows a month (default 2000); rows go after three years
(privacy.html says so). A passed part stays in today's lesson for now.
- **Oefenen**: "Examenonderdelen" (Lezen, Luisteren, Schrijven, Spreken, KNM: practice without the clock) and
"Grammatica en woorden" under it, "Lezen, luisteren en spreken" beside them on a computer.
The KNM row opens a list under it (`knmRow()`, `aria-expanded`, the chevron turns down): "Alle thema's" (the usual mixed
round) and the eight themes (`KNMT`), each with its own count; a theme round is `build("knm", {theme})` and "Nog een
ronde" keeps the theme. The theme names' translations come from the `"KNM: <theme>"` entries in `UI`.
- **Voortgang** (the tab key stays `herhalen`; "Herhalen" before 28 November 2026): a report from the progress only, so
  the same on every device (`progressHTML()`). A ring with the share answered right (`S.qd`/`S.qr`, else the answers in
  `S.items`) beside six numbers (questions, days practised, hours from `S.tm`, proefexamens, the streak, saved words);
  "Per onderdeel": every exam part of the level with its practice share and bar, and the last proefexamen as an
  oefencijfer (A2, KNM) or a percentage, a tap practises it; "Hier ben je goed in" (80% or more, 5+ answers, top 3);
  "Hier maak je de meeste fouten" (under 80%, the weakest 5, a tap practises that group, as Mijn zwakke punten);
  "Soorten fouten in je teksten en antwoorden" (the learner's own mistakes by kind: `ERRCAT`, kept by `keepErrs()` as
  `c` since 28 November 2026, a tap practises those mistakes); "Werk aan je fouten": Mijn fouten (the due ones first),
  Kies een lastig onderwerp and Mijn woorden. With nothing practised yet, a short empty state.
  Under the numbers, "Zo ga je vooruit" (`growthHTML()`): the last 7 days against the 7 before ("N% beter dan vorige week",
  from 10 answers each), a line of the share right per week (the last eight Monday-to-Sunday weeks, `weeks()`; a point
  only for a week with 5+ answers) and bars of practice minutes per week, and per exam part with two or more
  proefexamens a small line of the last ten with the oefendoel as an oranje line. Plain SVG (`lineSVG()`, `barSVG()`):
  one series per chart, so the caption names it, a `<title>` tooltip on every point and bar, the newest value written
  beside it and the numbers in `aria-label`. Shown from two active weeks or two proefexamens of a part.
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
`art/bitterbal-white.jpg` (`avSVG()`); the plush bitterbal is the mascot everywhere (the homepage too). The app icon also uses Bittie:
`icon-1024.png` is the 1024 px master. Derived PNGs are opaque squares; the maskable version has extra safe-area
padding. Icon and manifest URLs use `?v=bittie1` to refresh browser caches. `AVS`
keeps their names and the earlier SVG drawings: four girls (Volendam with the white hul, a supporter in orange, a headscarf in Delfts blauw, braids with
a tulip), four boys (Volendam, Koningsdag with a crown, a painter, a cheese carrier) and the bitterbal, the default; skin
tones vary on purpose. Their names under them are Dutch content (`lang="nl"`). The user showed a Vexels set as the example:
that set is copyrighted, so never copy it; no `<defs>`/gradients in them (a gradient defined in a hidden copy doesn't draw).
Under it the name (or "Profiel") and the
e-mail; then one filled cobalt banner (`.pban`: "Inloggen of account maken", or Bittertalen Plus when logged in), and
rounded grey groups of rows on the white tile (`.pg`, `.prow`: the name fields with the value on the right, the level as a
row with a native select over it, Taal (the menus' language, each named in itself, `.langrow`; on a computer both lists are the
same visible box at the end of the row), Trillen; the account with its status and Uitloggen / Account verwijderen as plain rows;
then `siteFooter()`: "Hulp" (Veelgestelde vragen, Uitleg over de examens, Prijzen, Abonnement opzeggen, Contact) and
"Bittertalen" (Over, Privacyverklaring, Naar de website, and Statistiek for the owner) as rows like the iPhone's Settings). Content: first and last name, the level (A2 or B1, a list, see B1) (`S.me` `{name, last}`, so they sync, and they also go to the account's
`user_metadata` by `syncMeta()`; since 25 November 2026, at the user's wish, "Data van mijn examens": one native date field per exam part of
the level (`parts()`: five for A2, four Staatsexamen parts plus KNM for B1, and for B1 also the optional ONA-eindgesprek and
participatieverklaring: `examParts()`) in `#pexams`, stored as `S.me.exams`
`{part: "YYYY-MM-DD"}` and merged per part; the older single `S.me.exam` still counts until a part gets its own date, then
it is copied to the empty parts and cleared. `examLine()` shows the next exam's part(s) and "Nog N dagen tot je examen" under
the Proefexamens heading on Examen, and the Plus screen says whether the Examenpas lasts until the last exam
(`examLastDays()`); Mijn dag still shows no exam date), the account
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

Feedback in exercises (25 November 2026): the menu words of the feedback (`[data-ui]`: "Goed zo!", "Niet goed",
"Goed is:", "Verder", the labels of the exam-focus block) are translated like menus, although `#play` is Dutch
(`uiSkip()`); the question, the answers and the explanation stay Dutch. A plain-text explanation (`noteHTML()`) has
tappable words for the dictionary popup (`tapWord()`, now also in `#play`) and "Vertaal ↗" to Google Translate in the
menu language (`gtURL()`, English for Dutch menus); the reader's "Vertaal de zin" uses the same language.

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
- **Zo kijkt Bittertalen na**: `nakijken.html` (served as /nakijken, in the sitemap; linked under Vraag 5 on the homepage
  and from Profiel's Hulp group), built like over.html in nine languages: DUO's Schrijven A2 points and Bittertalen's
  practice pass rule, two made-up examples scored by those rules (the examples stay Dutch), Speaking, and what to know
  (not DUO, AI can be wrong, Haiku for free checks, Sonnet/Opus for paid ones). Keep it true when the scoring rules or models change.
- **Over Bittertalen**: `over.html` (served as /over, in the sitemap, linked from Profiel above the privacy row):
  what it is, the name, who makes it, how it works, what it is not (not DUO), where everything comes from, contact.
  The maker's own story and photo go there when the user gives them.

## Reminders in the store app (26 November 2026)

`remindPlan()` plans the daily reminder for the next 7 days (ids 1–7) with the days left and today's part, never on a
finished day and not on an exam day. `examDayPlan()` adds, for every exam date in Profiel, a message at 07:00 that morning
(ids 20–29): "Succes vandaag!" / "Vandaag is je examen …. Je hebt goed geoefend. Je kunt dit! Succes!". It needs only
the notification permission, not the daily reminder, and is planned again when a date changes or the app opens.

After the first start test the store app shows Bittie's question "Mag Bittie je meldingen sturen?" (yes: the reminder at 19:00, the time in Profiel). Only after "Ja, dat mag" does iOS/Android show its own permission prompt, so a "no" never
spends that one-time prompt. Asked once per device (`ww-notif-asked`); Profiel → Herinnering changes it later.

## First check for a new learner (28 November 2026)

Mijn dag for someone new at A2 (no starttest, no answers yet) opens with Bittertalen's grading, the "wow" moment, while a
check is free to have (`canCheck` in `planHTML()`: the browser's trial `acc.cfg.free` without an account, else
`checksLeft("wr")`): one line, "Schrijf je eerste tekst" (the screen's one filled button, `data-p="first:wr"`, the count
`first`) opens the short note to the neighbour (`wr|0`, the homepage's example task), and the starttest stays under it as
a row. Without a free check the starttest comes first, as before.

## Coming back (28 November 2026)

Three things taken from the big language apps, all in `oefenen.html`:

- **Streak.** One missed day a week still keeps it (`freezeOk()`, `S.frz`); Mijn dag says so once the day's lesson is done
  and the streak is 3+. A streak of 3+ that is lost anyway can be won back once in 30 days (Duolingo's revival):
  `complete()` keeps `S.lost` `{n, d, c, cd}`; three finished rounds on one day within a week of the loss add the old
  days back (`S.revAt`, `S.revived` for the line "Je reeks is terug"). Mijn dag shows "Haal je reeks terug" with three
  dots. `mergeS()` takes the newer device's `lost` and the latest `revAt`.
- **Own mistakes come back.** `keepErrs()` stores the day (`d`); `dueErrs()` is every mistake from the day after it was
  made, then as its own spaced repetition says (`S.items["er|…"]`, `GAP`), until it was right four times in a row.
  Mijn dag shows "Oefen met je eigen fouten" with the number (`#dayerrs`, at most 8 a round).
- **Oefenen zonder handen** (`hfScreen()`, a row under Oefenen zonder timer when `hfOK()`: speech recognition and a
  voice). KNM, Luisteren (B1: lb) or both, ten minutes (`HF_MS`): the fragment, the question and "A. … B. … C. …" are
  said (`speakThen()` over `speak()`), `hearOnce()` listens up to 7 s, `hfPick()` takes A/B/C, een/twee/drie,
  eerste/tweede/derde or the words of one answer; "herhaal" repeats, "stop" stops; no answer twice moves on. Answers
  count in `S.items` (`hfRecord()`) and the round in the streak. Questions with a picture are left out. The question
  area is Dutch (`lang="nl"`).

## Oefencijfer (28 November 2026)

A proefexamen result of an inburgering part (Lezen, Luisteren, Schrijven, Spreken A2 and KNM) also shows "Oefencijfer N
van 10 · een 6 is voldoende" (`oefenCijfer()`, `cijferHTML()`), as DUO shows a "Cijfer" in Mijn Inburgering: the
oefendoel (`passPc()`) is a 6, everything right a 10, nothing a 1, straight lines in between, rounded, and under the
oefendoel at most a 5, so it never says voldoende when the result is "Meer oefenen". The note says it is Bittertalen's
own conversion: DUO doesn't publish its own. Not for the Staatsexamen (B1), which has scores.
