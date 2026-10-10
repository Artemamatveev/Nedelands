# Bittertalen

Bittertalen (a pun on bitterballen: "bitter languages", self-irony about learning Dutch) is a single-page study app for the Dutch A2 integration exam (inburgeringsexamen).
Everything lives in `index.html` (styles, data, logic). Paintings are in `art/`.
Deployed on Vercel from `main`: every push to `main` goes live at https://bittertalen.vercel.app (Vercel project
`nedelands`). The old address https://nedelands.vercel.app serves the same deployment and sends you on
to the new address (see Progress).
The app's UI language is Dutch; the user talks to Claude in Russian.

## Design: Delfts blauw

The design should also teach Dutch culture. Keep it recognisably Dutch and avoid the
generic "AI app" look.

- **Colours**: tin-glaze white `--bg`, cobalt `--blue`, light wash `--wash`, and
  `--oranje` as the only accent (timer, selection, the streak stamp).
  Always use the tokens on `:root`; every colour has a dark-mode value.
- **Glass and tiles**: the page background is a Dutch landscape faintly seen through a frosted window: Ruisdael's
  windmill (`art/molen.jpg`) lightly blurred (`body::before`) under a half-transparent wash (`--glass`). The content sits on plain white tiles with a soft shadow (`.tile`, `--card`, `--lift`), not
  ceramic Delft tiles: on the home screen one per block (today's lesson, Naar het examen, Grammatica en woorden, Lezen
  luisteren en spreken, Herhalen), and every inner screen is one tile. The museum label sits on the glass.
- **Type**: the system font only (`-apple-system, system-ui`: SF Pro on iPhone), so the
  app reads like a native iPhone app. No web fonts; headings semibold (600–700), never 800.
  No handwriting or decorative fonts.
- **Shapes**: square or nearly square corners (2–4px), solid 1px separators, flat buttons.
- **Logo**: the name "Bittertalen" in the system font, with a bitterbal (`--oranje`, light crumbs) as the dot on
  the i, the size and place of a normal dot (`h1 .idot`). The app icon is a bitterbal too.
- **Dutch motifs instead of decoration**:
  - Header: the painting of the day (`ART` + `paint()` in `index.html`), with a museum
    label underneath: artist, title, year, museum and one A2 sentence in Dutch (no
    translation), all in one size (15px, no italics). Tapping the painting on the home screen opens its story
    (`story()`); on other screens it shows the painting in full.
  - Streak: a stamp, like on a Museumkaart.
- **Never use**: cream or beige backgrounds, handwriting fonts, wobbly hand-drawn
  border-radius, dashed lines, highlighter underlines under headings, decorative SVG
  squiggles, emoji as decoration.

## Home screen

One clear path, top to bottom: today's lesson (numbered steps; the next one is filled
cobalt; no exam dates: the plan starts with the exam part that scores lowest, and Schrijven
and KNM are in it every day), then "Naar het examen" (one row per exam part with how ready you
are, from `ready()`: status, last proefexamen and a bar with the 70% line; then one "Proefexamen"
button per part with its time, and one row to DUO's 15 official oefenexamens ↗), then "Grammatica en woorden", "Lezen, luisteren en spreken" and
"Herhalen" (weak points and own mistakes).
Every section appears once; don't add a second entry point to the same exercise.

## Navigation: one action language

- **Going somewhere** (an exercise, a screen, a book, a source) is a list row, `itHTML()`:
  the whole row is the button, title + grey description, a count on the right, `›` at the end.
  On the home screen a row starts with a line icon (`IC`, drawn with `--blue`) in a thin `--wash` frame, transparent inside, not a picture.
  No "Oefenen →" or "Openen →" text links, no cards with their own buttons.
- **Filled cobalt `.btn`**: the one main action on a screen (the next step of today,
  Controleer, Volgende). **Outlined `.ghost`**: secondary actions (Proefexamen, Mix van de dag,
  Wis).
- **Underlined `.hint`**: only small in-place toggles (Vertaling, Uitspraak).
  Text links `<a>` only for other websites, with ↗.
- One `h2` (with the tile diamond) per section or screen; groups inside it get `h3.lh`
  (small capitals, cobalt). Every inner screen starts with a back button named after where it
  goes: "Start" for the home screen.

## Paintings

Only public-domain or CC0 images, downloaded from Wikimedia Commons into `art/`,
resized to max 1000px and compressed (~100–150 KB each). Record every new image in
`art/CREDITS.md`. To add one, append to `ART` with `f` (file name), `y` (vertical focus
in % for the header crop), artist, title, year, museum and an A2 sentence. Check facts in the sentences; they double as KNM material.
Each painting also has `v`, its story in A2 Dutch (who made it, what it shows, why it is famous; paragraphs
split by `\n`), and `w`, three or four things you can really see on it (`de kan=jug|…`, English like the dictionary). Tapping the
painting in the header on the home screen opens `story()` (no extra row under the label, to keep the home screen short): the
painting (tap it to see it in full), the story to read or hear (speech synthesis), and the words, each can be kept in Mijn woorden (`{w, en, p, s, f}`). Look at the painting
before writing `w`, and check every fact in `v`.


## Photos (Spreken)

The picture tasks in Spreken use real photos in `foto/`, by the same rules as the paintings:
public domain or CC0 from Wikimedia Commons, max 640px wide (~30–100 KB), each recorded in
`foto/CREDITS.md`. An `SP` item lists its photos in `p[3]` (two to choose from, or three in
order); `FOTO` holds a short Dutch description of each for screen readers. No emoji as pictures.

## Progress

Progress is per device: `localStorage` key `ww-v1`, mirrored to IndexedDB as a backup.
There is no server. `S.res` keeps the last 10 proefexamen scores per part (`{at, pc, nw}`, `nw` = % of new
questions; older results have none); the rows in "Naar het examen" read it through `ready()` (ready = the last two
average 80% or more and not both mostly known questions; the pass line is 70%). The proefexamen takes the least-seen
questions first (`seenN()`: practice answers plus `S.xs`, how often a question was in a proefexamen); Lezen takes
whole texts.

`sw.js` makes the app work offline: the page network-first (a push is live at once), paintings and
photos from the cache (the page sends their list after loading), `api/` never cached. Don't change the stored shape without migrating old data.
Saving progress to a file was removed on purpose. The app moved from https://nedelands.vercel.app; that address
still serves the same deployment, and the page there sends you on to the new address (the one-time move screen with a
progress code was removed once the move was done).

## Content

Lezen texts are plain strings rendered as documents by `docHTML()`: the first line is the title
(unless it is a letter or an e-mail), `label: value` lines become a table, `Van:` starts an
e-mail header. Luisteren items in `LS` are `[text, question, right, wrong, wrong, photo?]`; a dialogue has one line per
turn (`A: …` / `B: …`), read with two pitches, and the optional photo from `foto/` sets the scene. In the
proefexamen a fragment can be played twice (counted per fragment). `LSM` holds longer fragments with two or three
questions (`[text, photo, [[q, right, wrong, wrong], …]]`, keys `ls|m<i>.<j>`); each Luisteren proefexamen has two of
them, questions kept together. In the Lezen, Luisteren, KNM and Schrijven proefexamens you can go back: an answer is only
selected (`cur.pick`, option order kept in `cur.op`; for Schrijven `{f, t}`, the form fields and the text), "Overzicht" shows every question, and everything is marked when
handed in (`submitExam()`, also when the time runs out). KNM follows the 8 official themes of the exam since 1 July 2025
(40 questions, 45 minutes, 28 to pass). Woordenschat has the definitions in `VO` and the themed A2 word list `WT`
(Dutch with de/het = Russian), practised both ways. Item keys (`lz|3.1`, `wn|de huis`) are
stored progress: append new items, don't reorder or rename existing ones.

## Writing and speaking check (Schrijven, Spreken)

`api/check.js` is a Vercel function that grades writing with Claude (`claude-opus-5-5`,
structured JSON output, server-side refusal fallback). The page posts
`{tasks:[{task, form, text}]}` and gets `{tasks:[{passed, verdict, corrected, errors}]}`;
the prompt is built on the server, so the page can't send arbitrary prompts. It only
accepts requests whose Origin is the site itself. It needs `ANTHROPIC_API_KEY` in the
Vercel project's environment variables (the user adds it in the dashboard; never handle
the key in chat). Without it the page falls back to showing the example answer.

Spreken uses the same function with `{part:"sp", tasks:[{task, text}]}` (up to 16, for the
proefexamen); `task` also says what the photos show (`spTask()`, from `FOTO`). Each result also has `scores`
(inhoud 0–3, woorden 0–2, grammatica 0–2, samenhang 0–1: DUO's criteria as far as a transcript shows them; pronunciation
and fluency can't be judged), clamped on the server; the Spreken proefexamen score is points of all 16 questions.
The Spreken proefexamen has DUO's four parts of four (since March 2025): a question, one photo (describe and answer),
two photos (choose and explain), three photos (tell in order); `SP` items fall into a part by their number of photos. Claude can't take audio, so the phone writes the answer down first (Web Speech
API, `nl-NL`). Recording (`MediaRecorder`, to play the answer back) and transcribing are
separate takes, never at the same time: on iPhone they compete for the microphone. One
minute per answer. Recordings and transcripts stay in memory only. "Zeg het na" (free, no Claude call):
the learner reads the example or corrected answer aloud and the words speech recognition missed are marked.

Making new Lezen and Luisteren material with Claude was removed (it cost a call per tap and its
result was invisible). Items made earlier stay in `S.gen` and are still added by `addGenerated()`.

## Boekenkast (reading)

Built-in A2 stories live in `BOOKS` in `index.html` (original texts; check facts, they double
as KNM material). Readers can add their own books (.epub without DRM, .txt, pasted text);
those are stored only in IndexedDB (`books` list, `book:<id>` text), never in `ww-v1`.
`S.bk` keeps reading positions and `S.words` the saved words (`{w, en, p, s, f}`; a few early
ones have `ru` instead of `en`), practised as `bw|…` items, also in the Mix.

Tapping a word looks it up in `dict/nl-en.txt`, a free offline Dutch–English dictionary built
from English Wiktionary by `dict/build.py` (kaikki.org extract, CC BY-SA 4.0; keep the credit
line on the Boekenkast screen). It is loaded once, when the shelf opens. The popup shows the
lemma, de/het, plural or verb forms (perfectum aux from `V`), and finds separable verbs
(bel … op → opbellen). Meanings are in English; the rest of the app stays in Russian.
No Claude calls in the reader: whole sentences go to Google Translate via a link.

## Geschiedenis van Nederland

"Geschiedenis van Nederland" (a row under "Lezen en luisteren") is a timeline of short A2 chapters in
`GS` in `index.html`, from the hunebedden to now, grouped by period (`g`). Each chapter has years, a text
(one paragraph per line, tap a word for the dictionary popup, like in the reader), an optional picture
(`foto/` or `art/`, same rules as the photos, credited in `foto/CREDITS.md`) and three questions, stored as
`gs|<id>.<n>` items (also in the Mix and in "Mijn zwakke punten"). Original texts: check facts, they double as
KNM material. `S.hs` keeps when a chapter was last opened; a chapter is "Klaar" when every question was
answered right once. Append chapters and questions; don't reorder or rename them.

## Gesprekken (conversations)

"Gesprekken" (a row under "Lezen, luisteren en spreken") are everyday role plays in four groups: on the phone
(huisarts, work, landlord, school, gemeente, 112, a language school), work, school and the doctor (a job interview,
a day off, the teacher, the GP's consulting room), in town (bakker, apotheek, café, station, exchanging a jumper,
the bike repairer, the market, the library, asking the way) and the neighbours. Free and
offline, no Claude (the user chose this over an AI conversation partner). Each one in `GP` in `index.html` is a script:
the other person's line is read aloud (`speak()`), the learner answers out loud through `listen("say")` or types,
and `gpFits()` checks the answer for keywords (`k`, groups of alternatives); a line marked `x` is skipped when the
answer already said it. Two misses show the example answer (`m`). At the end: how many answers needed no help and
every example answer to listen to. `S.gp` keeps per conversation `{n, b, at}`. Check that every `m` fits its own `k`.
Facts in the scripts double as KNM material: check them.

## Luisteren en kijken (real Dutch)

Real speech from Dutch YouTube channels and podcasts, listed in `MEDIA` in `index.html` (id, name,
video or audio, level 1–3, a Dutch description). `api/feed.js` fetches the latest 15 episodes of
the whitelisted feeds (YouTube channel RSS, podcast RSS; no key, cached by Vercel's CDN for 30 min)
and returns `{link, items:[{t, d, s, v|a, n}]}`; to add a source, add it to both `MEDIA` and `FEEDS`.
Only free sources whose episodes are entirely in Dutch. Videos play in the YouTube embed
(`youtube-nocookie.com`, Dutch captions on), podcasts in `<audio>` with 10 s back and 0.75/1/1.25×.
What was opened, where a podcast stopped and the chosen speed stay in `localStorage` `ww-media`,
not in `ww-v1`.
