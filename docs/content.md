# Content
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

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
longest answer is not a giveaway. Woordenschat has the definitions in `VO` and the themed A2 word list `WT` (about 2000 words in 27 themes; the
meaning of every word in the eight menu languages is in `dict/wt/<lang>.txt`, `word<TAB>meaning`, loaded by `wtLoad()`
under DICTV and shown only after an answer (`wtNote()`) and in the word popup; a new WT word needs a line in all eight files,
`tests/wordlist.test.mjs`; a description never contains its own word)
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
  Netherlands in the texts are real. The first eight texts are about 220 words, the later ones about 300, and texts 37–42 about 400 (Koningsdag, afval, DigiD, phones at school, an energy bill, a newcomer at work); the exam's
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
- Elsewhere at B1: six B1 situations in Gesprekken (`b1:1`, listed first at B1), two B1 stories in the Boekenkast
  (`zorg`, `molen`), and two harder questions per history chapter (`GSB`, keys `gb|<id>.<n>`, sec `gs`, only at B1:
  `gsItems()` and `lv()` in `build()` leave them out at A2).

## Beginnen (from nothing)

For someone who starts from nothing, at A2 only. `BG` in `data/a2.js` holds twenty short lessons (`t`, `s`; `x` the rule in very
simple Dutch, a paragraph per line, `<b>` allowed; `e` the same in English, behind an "English" toggle and open when the menus
are in English, because a beginner can't read the Dutch yet; `window.BGI` in `data/ui.js` has the explanation, the examples and
the words of every lesson in ar, tr, hi, zh, es, ru and uk (a new lesson needs all seven), and `window.BGW` turns the English
options of "Wat betekent" into the menu language (a new option word needs all eight); the lessons' own text has class `.bgl`: never translated, always
left to right; `v` examples
and `w` words as `Dutch=English` split by `|`, both recorded; `q` questions `[question, right, wrong, wrong, why]`). Keys
`bg|<id>.<n>`, section `bg`: append, don't rename. A wrong option must never also be correct Dutch. A lesson is Klaar when every
question was answered right once (`bgDone()`). The first twelve are the basics the starttest checks (one question each); lessons 13–20 (possessives, separable verbs,
imperfectum, adjective -e, future with gaan, object pronouns, comparing, er is / er zijn) are the bridge to A2 and are not in
the test, so only learners who start from nothing (`lv` 0) get them in today's lesson. Twenty lessons are not A2 yet: don't promise more on screen. Screens in
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
The two KNM health situations about Samira and Karin's son use separate 640px home-temperature photos (14 November
2026). They are CC BY 2.0 exceptions, not reused in Speaking. `FOTO_CREDITS` supplies visible author, source, license and
resize attribution under the image and in the enlarged view. Keep those credits whenever using either photo.
The original `ziek` asset remains for existing unrelated tasks; only these two KNM photo references changed.
Four other KNM birth situations have distinct 640px photos (`geboorte-v1`, `ouders-baby-v1`, `geboorte-hand-v1`,
`kraamvisite-v1`), public domain/CC0, credited in `foto/CREDITS.md`. Keep the original `baby` photo for the
consultatiebureau question and its existing listening fragment. Neutral birth scenes must not reveal an answer.

## Voices (speech)

Everything the app says from its own material is recorded: `audio/<key>.mp3`, one file per line, made once with Google
Cloud Text-to-Speech, Chirp 3 HD voices (chosen by ear: Vindemiatrix for women, Charon for men; Aoede and Orus only
when two women or two men talk together). The people in the Luisteren fragments (`ls`) are drawn from `POOL` in
`audio/build.mjs` (six women's and six men's voices, picked by the fragment's text, each person in a fragment their own),
so the learner hears many people, as on the exam (25 November 2026, after the critique that two voices sound synthetic).
Lines recorded by real people are listed in `audio/live.json` (key → who recorded it): the script never records over
or deletes them, and says when such a line's text has changed. `--dry --script` prints the Luisteren lines to record. `speak(t)` keeps its old interface (lines split by `\n`, `A: …` / `B: …` /
`C: …` for a dialogue) and plays each line's file if `audio/index.json` lists its key (`sayKeys()`: a dialogue's lines
are keyed by the whole dialogue, other lines on their own), else the phone's Dutch voice (`utter()`), as for own books,
Claude's corrections and dictionary words. The first line starts inside the tap, the rest follow on the same audio
element (iPhone only plays sound from a tap). `stopSpeak()` stops both; `speaking()` says whether either still runs.
`sw.js` keeps each file after its first play and answers the byte ranges Safari asks for.

`node audio/build.mjs` records what is new or changed and deletes what no line uses any more (`--dry` only counts,
`--dry --who` shows who says what). It reads the texts from the page itself in headless Chrome (`voiceTexts()`: every
text the app passes to `speak()`, with its kind), so after adding or changing Luisteren, KNM, Spreken, the ONA scripts,
words, paintings or history, run it and commit `audio/`. Who speaks: dialogue people by how they introduce themselves
(names and titles in `FEMALE` / `MALE` in the script; add new names there), the KNM, Luisteren and Spreken questions by
Charon (as the voice on the exam), words and reading aloud by Vindemiatrix, the ONA scripts by the role (`GP .w`; the AI conversations get their voice from the server) and the
learner's example answers by the other voice. The Google key is in `~/.config/bittertalen/tts.env` (`GOOGLE_TTS_KEY`, a
key restricted to the Text-to-Speech API in the user's Google Cloud project); never put it in the repository or the chat.
In a cloud session the key is a network secret of the environment `nedelands` (host texttospeech.googleapis.com, header
`X-Goog-Api-Key`, no prefix), which the proxy puts in: run `NODE_USE_ENV_PROXY=1 GOOGLE_TTS_KEY=dummy node audio/build.mjs`
(the page's texts then come through Playwright).
The whole app is about 240 000 characters, inside Google's free million per month.

## Luisteren en kijken (real Dutch)

Real speech from Dutch YouTube channels and podcasts, listed in `MEDIA` in `oefenen.html` (id, name,
video or audio, level 1–3, a Dutch description). `api/feed.js` fetches the latest 15 episodes of
the whitelisted feeds (YouTube channel RSS, podcast RSS; no key, cached by Vercel's CDN for 30 min)
and returns `{link, items:[{t, d, s, v|a, n}]}`; to add a source, add it to both `MEDIA` and `FEEDS`.
Only free sources whose episodes are entirely in Dutch. Videos play in the YouTube embed
(`youtube-nocookie.com`, Dutch captions on; a Short, `sh` from the feed's /shorts/ link, gets an upright 9:16 box;
"Volledig scherm" uses the browser's fullscreen, or on an iPhone, which has none for a page element, lets the box cover the
screen with a ✕, `vFull()`), podcasts in `<audio>` with 10 s back and 0.75/1/1.25×.
Thumbnails come through `api/_thumb.js` (via `feed.js`) (`/api/thumb?v=<id>`, only i.ytimg.com's mqdefault, CDN-cached a week), so
Google sees nobody until a video is opened. YouTube's developer policies: keep the player as it is (no overlays, ads
and branding intact), never put the videos behind a paywall, and privacy.html links YouTube's Terms and Google's
privacy policy.
What was opened, where a podcast stopped and the chosen speed stay in `localStorage` `ww-media`,
not in `ww-v1`.

## Quick Dutch encouragement

At the user's request, practice answers briefly show outcome-specific Dutch brush lettering inspired by their café-menu photos.
`study/praise-art-v1.js` holds twelve local SVG-outline phrases, generated by `tools/build-praise.py` from Permanent Marker
(Font Diner, Apache 2.0; attribution/license in `art/praise-LICENSE.txt`). This is a requested decorative exception to the
system-font/body-type rules. No font or image is fetched when an answer is marked. `quickPraise` in `study/praise-v1.js`
shows one 1500ms pulse (quick entrance, readable hold, short fade) with no consecutive repeat per outcome, never takes focus, and has no pointer hit area. Next stays available
immediately; any pointer/key action, a question change or returning home dismisses the pulse. Reduced motion gets a still
version. Correct answers use six cobalt encouragements; incorrect answers use six warm-orange Dutch retry phrases (Wat jammer!,
Helaas!, Oeps!, Geeft niks!, Nog een keer!, Volgende keer beter!). Normal corrections and explanations remain visible.
Ungraded self-assessment and exam/diagnostic selections do not get a pulse. Objective feedback and completed AI verdicts
for writing/speaking/B1 sentence groups select the matching outcome. Existing scoring/timing is unaffected.

## KNM photos and absolute words (25 November 2026)

A KNM question's photo is shown only after the answer (and never in a proefexamen): signs in the photos (IND-Loket,
CJIB, Juridisch Loket) gave the answer away in about a fifth of the questions. `node tools/answer-length.mjs` also reports
absolute words (altijd, nooit, alleen, moet …) in wrong and right options; in KNM situaties they are in 22% of the wrong
options and 8% of the right ones, so "skip the absolute option" still helps. Rewrite those options together with their
recordings (`audio/build.mjs`), set by set.
