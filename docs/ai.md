# AI: grading and conversations
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

## Writing and speaking check (Schrijven, Spreken)

The result shows DUO's points as a checklist (`scoreHTML()`, `.dpts`; the user's choice, November 2026, from three
designs): each criterion as a plain question ("Heb je geschreven wat de opdracht vraagt?", "Zijn je zinnen goed
gebouwd?"…) with a round mark and "Ja", "Bijna" or "Nee" and its points (✓ green full, ! oranje some, ✕ red none), then the
total. Coloured bars looked generated, and boxes of numbers 0–3 left it unclear whether a score was good or bad; don't go
back to either. After it comes then the learner's own text with every error marked where it is and numbered (`markErrs()`,
`ownHTML()`: Claude's `wrong` is looked up in the text; one it can't find is only in the list), the numbered list of
errors (`errsHTML()`: wrong → right, why) and the corrected text.

The practice result (28 November 2026) reads top down: the verdict, "Het belangrijkste om te verbeteren:" (the first
correction), then "Was → Zo schrijf je het goed" (`wrDiffHTML()`): the learner's text with its numbered mistakes beside
Claude's `corrected` text, every changed word underlined in green (`insHTML()`: a word diff plus each correction's own
words, so a swapped "ik ga" → "ga ik" shows both), one column on a phone and two from 700 px, and "▶ Luister naar de
verbeterde tekst" (`speak()`); then the points, the list of mistakes and the example. A text without changes keeps the
plain marked text.
In practice, a checked text with corrections goes on with "Verbeter je fout" or "Verbeter je 3 belangrijkste fouten" (`practiseCorrections()`: at most `FIX_MAX` = 3 corrections, the most important first, on one screen, each written from memory and compared on the phone; "Verder" skips; the user found five steps one by one too long, 26 November 2026). A correction that only adds or changes a full stop, comma or question mark (`punctOnly()`) is neither listed nor practised, and the A2 prompt does not count such punctuation for the spelling points. After a proefexamen each task keeps "Schrijf het nog een keer" (`redo()`, `redoItems()`: Schrijven and Schrijven B1, in practice and per task after a proefexamen,
not in Spreken, and only when the corrected text differs): the learner gets their own text back to correct, without the
corrected text on screen (the errors are in a fold), and "Vergelijk" marks it against Claude's corrected text on the phone
(`diffHTML()`: struck through = take out, green = add; capitals and punctuation count; a word in the wrong place counts as
one). No Claude call, so it costs no check, works offline and changes nothing in `S`. After a proefexamen it goes back to the
same result, not marked again. A sentence to finish comes back whole (`zWhole()`), because `corrected` is the whole sentence.
A B1 form gets one box per answer that differs: `SYSTEM_WB` asks for one line per form answer with the open answer last, and
another shape gives no button. An A2 form's `corrected` is the open answer only, so only that comes back.

Luisteren A2 next to DUO's oefenexamen Luisteren A2 1 (screenshots, 28 November 2026): 25 questions, 45 minutes, per
screen the situation ("Dina gaat verhuizen. Ze belt met een vriend."), "Lees eerst de vraag. Luister daarna naar de
tekst" (or "Kijk daarna naar de video"), the question with its own ▶, three or four options A–D, Vorige, Volgende, an
overview and handing in with the time left and the questions without an answer. Ours has all of that except video and
four options. DUO lets a fragment be played as often as you like (the user checked) and asks two or three questions
about one fragment, as ours does, so since 28 November 2026 our A2 proefexamen has no limit on plays either (B1 keeps one).
DUO's player can pause and jump 10 seconds; ours too, under ▶ Luister in Luisteren A2 (`sayPause()`, `sayResume()`,
`saySkip()`: a fragment is a row of recorded lines, `sayCur` says which one plays; a jump stays in the line and past its
edge goes to the line before or after; the phone's own voice can only pause). Luisteren options stay three: they are
recorded, and a fourth needs new recordings (`audio/build.mjs`). DUO's result gives chances by score (19–21 "kans"): that is the source of our 19 of 25 line,
which stays a practice target.

Lezen A2 next to DUO's oefenexamen Lezen A2 2 (screenshots, 28 November 2026): 25 questions, 65 minutes, two or three
questions per text, per screen the situation, "Lees eerst de vraag. Lees daarna de tekst.", the text (folders, tables,
e-mails) beside the question, three or four options, Vorige/Volgende, an overview and handing in with time left. Ours had
it all except the order: since that day a Lezen A2 question stands above its text with that sentence (`qFirst` in
`show()`), as a phone has no room beside it. DUO's bands differ per oefenexamen (Lezen 2: 17–22 "redelijke kans",
Luisteren 1: 19–21 "kans"), so the result no longer says 19 is "probably" needed: DUO does not publish the line and it
differs per exam; 19 of 25 stays the target. DUO gives three or four options; since that day one question per Lezen A2
text (82 of 225) has a fourth, a detail from the same text that does not answer the question (another day, time, price
or place), and `tools/answer-length.mjs` counts all wrong options.

KNM next to DUO's voorbeeldexamen KNM 1 2025 (screenshots, 28 November 2026): 40 questions, 45 minutes, grouped by
theme with a page "De volgende vragen gaan over het thema 'wonen'" before each, every question with a photo and read
aloud as it appears (pause, ±10 s), three options (some with a map), and the result "U moet minstens 28 vragen goed
hebben", our line too. Since that day ours keeps the themes together (the pool grouped them but the exam shuffled them
again: `knm` was missing from `keep`), says the theme above its first question, and reads each new question aloud. The photo
now comes with the question too, except 44 photos that give the answer away (docs/content.md, KNM photos).

How a Schrijven A2 task looks, as in DUO's oefenexamen Schrijven 1 (the user shared the PDF on 28 November 2026; only
the form is taken, never DUO's tasks): the situation, the points to write about as a list ("Denk aan:" when they are
questions), "Schrijf in hele zinnen.". Our tasks are one paragraph in `data/a2.js`; `wrBrief()` splits them on screen
(a sentence that asks for something or a question is a point; "Schrijf een e-mail aan …" and "Schrijf over …" stay in
the situation; under two points the task stays one paragraph) and the task text for Claude is unchanged. DUO prints an
e-mail's greeting and closing; ours come from the task's example answer (`wrFrame()`, a message or formal e-mail whose
example starts with a greeting and ends with a usual closing and [naam]), shown above and below the text box, and
`wrFull()` puts them around the learner's text for grading (not twice when typed too); the task tells Claude they were
given. The proefexamen has DUO's mix in DUO's order: a formal e-mail, a short text, a form, a message
(`writingTaskType()`). DUO's form also has a choice of one ("Ik wil meedoen met de volgende groep"); since 28 November
2026 each of our nine A2 forms has one too, with options of our own: a field written `Label|option|option|option` in
`data/a2.js` becomes `q.fields` (the label, which grading, drafts and the Word file use) and `q.choices` (the options,
shown as radio buttons that fill a hidden field, so the form text reads "Ik kies de groep op: Woensdagmiddag"). DUO's two
open questions are one open question with two or three sub-questions in ours.

`api/check.js` is a Vercel function that grades writing with Claude (free checks, a guest's trial and a free account's,
practice or proefexamen: `GRADING_MODEL_FREE`, default `claude-haiku-5-5`; paid practice, 1 to 3 tasks: `GRADING_MODEL`,
default `claude-sonnet-5-5`; a paid proefexamen, 4 or more tasks: `GRADING_MODEL_EXAM`, default `claude-opus-5-5`; all Vercel env vars,
so the model changes without code; structured JSON output, server-side refusal fallback). Every call adds its tokens to
today's row per model in `ai_spend` (`add_ai_spend()`, `supabase/migrations/20261118230000_ai_spend.sql`, also in
`schema.sql`: day, model and token totals only, no account, answer or IP, so privacy.html needs no change; rows go after
two years); a failure there never fails the grading. The page posts
`{tasks:[{task, form, text}]}` and gets `{tasks:[{passed, verdict, corrected, errors, scores}]}`;
the prompt is built on the server. The page does send the task text and the form, so every field from the page goes between fences with a random name per request (`fence()` in `check.js`) and the system prompt says never to follow instructions inside them: a text can't close its block and add a task or its own points. Schrijven is scored on DUO's
beoordelingsmodel: inhoud 0–3, woorden 0–2, grammatica 0–2, spelling 0–2, samenhang 0–1 (inhoud 0 makes everything 0;
the prompt counts errors: 0–2 = 2, 3–5 = 1, 6+ = 0; for spelling the server applies that count itself since 28 November
2026, see below). `passed` is set by the server from the points (inhoud 2+ and 7 of 10),
not by Claude, and the Schrijven proefexamen score is points of all 4 tasks against the 70% line.

Grading again near the line (28 November 2026): the same text could get 6 one time and 7 the next, which matters only at
voldoende. A task (writing: A2 text or form, B1 form or e-mail, not a B1 zinsopdracht; speaking: A2 and B1, practice and
proefexamen) where one point either way on a criterion Claude judges would change voldoende (`nearLine()`, judged on the
final points: a short spoken answer's cap and the sealed sound included, so Azure's fixed points never trigger it) is
graded once more, by the same model with the same prompt, effort low,
for the points only. When both say the same, the first grading stays (`checks: 2`); when they disagree, a third grading
decides, each criterion taking the middle of the three (`medianScores()`, `checks: 3`). The corrections and the verdict
always stay those of the first. With no time left for the third (an extra call starts only with 25 s of the function's
110 s left) the first points stay, marked `nearLine`. The page says it under the points (`lineNote()`, "Je tekst" or "Je antwoord"). The learner pays no
extra check; the tokens go to `ai_spend` like every call; `RECHECK=0` in Vercel switches it off. In a proefexamen all
tasks near the line go into one extra call (and the split ones into one more), so an exam costs at most three calls.

Zo haal je meer punten (28 November 2026): every result also has `meer`, at most three steps for the criteria that lost
points, the most points first: `kind` (a criterion), `tip` (what to do, in the menu language like `why`) and `voorbeeld`
(one good Dutch sentence for this task). The server keeps only tips for a criterion below its maximum and none when every
point was earned (`cleanMeer()`). The page shows them under the points (`meerHTML()`), in practice, after a proefexamen and
in Spreken; for a recorded answer that lost uitspraak or vloeiendheid points the page adds its own tip, with the words
that sounded least clear (`soundTips()`).

Spelling without AI (`api/_spell.js`, 28 November 2026), so a text's spelling points don't depend on how Claude counts
that day. `unknownWords()` lists the words of the text and the form that are not in `dict/nl-en.txt` (every headword,
and a form only of a verb, noun, adjective or name, or a pronoun, article or numeral that adds an ending: Wiktionary
also lists misspellings as "forms" of words that don't inflect, mischien → misschien, tog → toch); compounds of two
known parts (with s, e or en between), diminutives and -s plurals count as known, and so do the task's own words, names
(a capital inside a sentence, after a greeting, or closing a line), numbers, e-mail addresses and links. Up to 15 go
under the text in the prompt as a plain list ("often a spelling mistake, sometimes a name or a rare word"). Claude also
returns `spelfouten`, its count of all spelling mistakes (`withCount()`), and the server sets spelling to
`min(Claude's points, DUO's count rule on max(listed spelling errors, spelfouten))` (`spellingPoints()`): Claude can
still take a point (a misspelled personal detail, unreadable words) but never gives 2 while it lists four spelling
mistakes. A2 only (practice, proefexamen and the owner's comparison); B1 Schrijven gets the count field but keeps its
own points. On the made-up samples the list catches gekoopt, gekogt, klijn, mauwen, sijn, gelt, antwoort and flags no
correct word; it has not been run against Claude's own counting on real texts. `vercel.json` bundles the dictionary
with `check.js` and `admin.js` (`includeFiles`). A form (A2 items with
fields get `kind:"f"` and `mx: WFMAX`) is scored as DUO's beoordelingsmodel Formulier: inhoud 0–3, woorden 0–2, spelling
0–2, 7 points, voldoende with inhoud 2+ and 5 (`SCORES_WF`, `wfPassed`). As in DUO's models, woorden is 0 when the text
or answer is almost only words from the task. A writing text sent again unchanged gets its earlier result without a new
check (`nakijken()`, `ww-graded` in localStorage, the last 60, Plus or not in the key), so sending the same text until it
says voldoende doesn't work; spoken answers are not kept (privacy.html). It only
accepts requests whose Origin is the site itself, and with accounts on only from a logged-in user (see Accounts). It needs `ANTHROPIC_API_KEY` in the
Vercel project's environment variables (the user adds it in the dashboard; never handle
the key in chat). Without it the page falls back to showing the example answer.

Spreken uses the same function with `{part:"sp", tasks:[{task, text}]}` (up to 16, for the
proefexamen); `task` also says what the photos show (`spTask()`, from `FOTO`). Each result also has `scores`
(inhoud 0–3, woorden 0–2, grammatica 0–2, samenhang 0–1: DUO's criteria as far as a transcript shows them; with a
recording scored by Azure also uitspraak and vloeiendheid, see "All 12 points" below), clamped on the server; `passed` is set by the server from the points (inhoud 2+ and 6 of
the 8 since 25 November 2026, higher than 5 because 4 of DUO's 12 points can't be judged; `spPassed`), not by Claude, as for B1; a complete answer of fewer than 5 words (`SP_SHORT`, "Met de trein") keeps full inhoud, but the server caps woorden and grammatica at 1 and samenhang at 0 and adds a note to say two or three sentences (`capShortSpoken`, 26 November 2026), so two words never reach voldoende; in practice a transcript of only fillers ("eh", "hm") or a single letter is not sent for grading (`spokenTextReady`); the Spreken proefexamen score is points of all 16 questions. Speaking never
gets "Stabiel oefenresultaat" in Mijn examen (`ready()`): the phone's transcripts have no sound, and the 12-point score
from recordings has not been compared with an examiner. Under a Spreken score Mijn examen says
"Uitspraak en vloeiendheid zijn door de computer gemeten." when the last proefexamen counted sound (`snd: 1` on its
`S.res` entry, set by `examSpeak()`), else "Uitspraak en tempo zijn niet beoordeeld."

All 12 points (28 November 2026): DUO's Spreken A2 has 12 points a question; a transcript shows 8. When Azure scored the
recording (Spreken practice and proefexamen, signed in, `pron` on), `/api/pron` returns `seal` with the answer: Klanken
(Azure's AccuracyScore) and Vloeiendheid (FluencyScore), signed with the service key for this learner for 24 hours
(`soundSeal()`/`soundOpen()` in `_supa.js`), so the page can't send its own. The page sends it as `sound` with the
answer; `check.js` adds uitspraak 0–2 and vloeiendheid 0–2 (`withSound()`: 80 or more is 2, 60–79 is 1, the lines at
which the page marks a word; inhoud 0 makes them 0 too; an answer under 5 words gets vloeiendheid at most 1), and
voldoende is then inhoud 2+ and 8 of 12 (`spsPassed`). A seal that doesn't open, a guest or B1 (the Staatsexamen has its
own criteria) keeps the 8 points and 6 of 8. In the proefexamen each recorded answer counts 12, one the phone wrote down
8, a silent or missing one 12 when the exam counted sound elsewhere; the exam draft keeps the seals (`sounds`), so a
reopened exam still counts them. Claude never sees the sound scores. The lines 80 and 60 are a first choice: Azure's
scores are made for native speakers, and neither they nor the 8 of 12 have been compared with an examiner.

Hear yourself and the right answer (28 November 2026): a Spreken result (practice and each proefexamen question) shows
"Jouw antwoord" (the recording, when there is one, and what was heard with the mistakes numbered) beside "Zo zeg je het
goed" (the corrected answer with every changed word marked, `insHTML()`), and "▶ Luister naar het goede antwoord"
(`sayDiffHTML()`, `sayBind()`, `speak()`), as Schrijven has "Was → Zo schrijf je het goed".
How the Spreken A2 proefexamen moves, as DUO's own oefenexamen does (the user went through DUO's oefenexamen Spreken A2 1
on 28 November 2026 and shared screenshots; only the procedure is taken, never DUO's design, logo, questions or video):
16 questions in four parts, 35 minutes on one clock, the question played at once and playable again, recording started by
a tap, at most one minute, a recording that can be made again. Since that day, like DUO's: ← Vorige and "Sla over →" go to
any question (`spNav()`, `spNavHTML()`), an answered one shows its saved answer (recording and text, its seal kept) without
being replaced, Overzicht shows which questions have an answer, and handing in (from the last question or Overzicht) goes
through Overzicht with the time left and the numbers of the questions without an answer; with any open, a second tap
("Toch inleveren") hands in. Each part starts with one line on what to do (`SPINTRO`, on the part's first question; DUO
shows it on a page of its own). A skipped or silent answer gets 0 points without a model call. Not taken over: DUO's
sound test page (our question is read aloud and can be replayed), bookmarks, and video (Bittertalen reads the question).
DUO's practice exam ends with "het echte examen wordt nagekeken door mensen": our grading by Claude stays a practice score.
B1 Spreken keeps the Staatsexamen's fixed order and timing.

The Spreken proefexamen has DUO's four parts of four (since March 2025): a question, one photo (describe and answer),
two photos (choose and explain), three photos (a story in order, or three separate things to say something about: learners
remembered both kinds from the real exam, so the part's label leaves the order to the question); the proefexamen reads each question aloud, like the
video on the exam, and speech stops before the microphone opens; `SP` items fall into a part by their number of photos. Claude can't take audio, so the phone writes the answer down first (Web Speech
API, `nl-NL`). Recording (`MediaRecorder`, to play the answer back) and transcribing are
separate takes, never at the same time: on iPhone they compete for the microphone. One
minute per answer. During a speaking exam, “Antwoord klaar” ends a take early. A tap immediately shows a finishing
state and stops the per-answer timer; normal final speech results are accepted, with an 800ms fallback for native
recognisers that omit their end event. The last available transcript is retained and a stuck recogniser is aborted and
replaced. Completed takes show “Antwoord klaar” (or explicitly no speech recognised), a stopped clock and “Volgende vraag”;
the last task shows “Antwoorden inleveren”. Before advancing, “Opnieuw opnemen” starts another take with the same
answer-time limit, without restarting thinking time or the overall exam clock. The previous answer remains until a new
nonempty transcript/recording replaces it at the same question index; an empty failed retake explicitly retains the old
answer. Superseded audio URLs are released. The retry control is hidden while recording and on each new question.
Navigation/late native events cannot complete a different task or append an answer twice. Natural MediaRecorder stop also completes the active take. Recordings stay in memory only. A2 speaking exam transcripts are saved in a local draft until grading succeeds or the learner discards the draft. "Zeg het na" (free, no Claude call):
the learner reads the example or corrected answer aloud and the words speech recognition missed are marked.

Zeg het na with Azure Speech (27 November 2026, `api/_pron.js`, `/api/pron` → `/api/check?kind=pron`): when
`/api/config` has `pron` (AZURE_SPEECH_KEY set, accounts on) and the learner is signed in, the phone records the sentence
(`listen("rec")`, at most 30 s) instead of writing it down; `pronWav()` decodes the recording and renders it to a 16 kHz
mono WAV, and the server sends it with the model text to Azure's short-audio REST API with a `Pronunciation-Assessment`
header (scripted, `HundredMark`, word granularity, miscue on; nl-NL, region `AZURE_SPEECH_REGION`, default
`germanywestcentral`, which must stay an EU region for privacy.html to be true; 15 s timeout). The page shows Uitspraak (PronScore),
Klanken, Vloeiendheid and Volledigheid out of 100 and marks words below 80 (`.miss`, below 60 or left out) or 60–79
(`.miss.mid`), aligned with the model text by the same LCS as the phone path; a marked word can be practised alone, also
scored by Azure. Dutch gets no prosody score (Azure scores intonation for en-US only). A limit, a busy day, a recording
that can't be converted or a missing service sends the rest of the visit back to the phone's recognition (`pronOff`).
The scores are a practice hint ("geen examencijfer"); they are not part of Spreken grading and have not been compared
with an examiner. Guests keep the phone path. Do not switch on audio logging in the Azure resource: privacy.html says
Microsoft keeps no recording.

Spreken practice with Azure (28 November 2026): with `pron` on and a signed-in learner, a practice answer (Spreek in en
laat nakijken, Opnieuw inspreken, Geef opnieuw antwoord) is recorded instead of written down by the phone (`spListen()`;
`listen("rec")`, then `pronCheck(null, r)`). `/api/pron` with `{free:true, audio}` (at most `FREE_SECONDS`, 60 s, Azure's
limit for short audio) sends the whole answer to Whisper large-v3-turbo at Groq for the text (`whisper()`, since
28 November 2026, `GROQ_API_KEY`; Azure's plain speech to text, `Display`, when the key is missing or Groq fails) and, at
the same time, its
first 30 s (`wavHead()`, Azure's limit for an assessment) to an unscripted pronunciation assessment (no reference text,
no miscue): Uitspraak, Klanken and Vloeiendheid out of 100 and up to six words below 80 ("Minder duidelijk"), shown in the
review (`pronSummaryHTML()`, with the recording to play back) and again with Claude's grade; "Alleen de eerste 30
seconden" when the answer was longer. The text then goes through the same review and grading as the phone's. A failure
says why and lets the learner speak again; a lasting one (limit, busy, no recorder) falls back to the phone (`pronOff`).
About 10 s for a 60 s answer. Claude never sees the pronunciation scores; with the seal they count as uitspraak and
vloeiendheid (All 12 points, above).

Why Whisper writes the text (28 November 2026): a recognizer that "corrects" a learner hides the very mistakes Claude
should grade. Fifteen A2 sentences, twelve with typical mistakes (geschrijft, geholpt, de brood, hij hebben, Ik vind
leuk, Gisteren ik ben…), were spoken with four accents (Azure's multilingual en, es, zh and fr voices speaking Dutch)
and written down: Azure kept 36 of the 48 mistakes (it wrote geschreven, geholpen, het brood), Whisper large-v3-turbo
(whisper.cpp on the Mac) 43; Whisper with a prompt asking for a verbatim learner transcript only 35 (it reordered
words), so it gets no prompt. Whisper still adds "het" to "Ik vind leuk". Synthetic accents, not real learners: test
again with real recordings. Through Groq with the app's own `whisper()` the same 60 gave 51 exact and 44 of 48 kept. Whisper may write a subtitle line for silence ("Ondertiteling …"): such text (`PHANTOM`), or
any text when Azure's assessment heard no word in an answer of at most 30 s, counts as nothing heard.

The proefexamen Spreken (A2 and B1) with Azure (28 November 2026): when the exam starts, `sttExam()` asks `/api/pron`
`{ask:true}` for the learner's seconds left today (`STT_DAY`) and everyone's (`PRON_CAP`), and uses Azure for the whole
exam only when both cover it (each question its seconds plus up to 30 scored); else, or while that answer is on its way
(`cur.stt` null), the phone's recognition as before, so an exam never switches halfway on a full allowance. With Azure
each take is a recording (`spExamTake()`): kept at once as the answer (Volgende vraag right away), written down in the
background (one retry), the text saved into the draft when it arrives; a retake replaces it and its late text is
ignored. A lasting failure (limit, busy) sends the rest of the exam to the phone (`cur.stt=false`). `examSpeak()` waits
for the texts ("Je antwoorden worden uitgeschreven…", at most 60 s) before Claude grades; an answer without text shows
its recording and "(niets verstaan)". Each answer in the result shows its pronunciation, and its uitspraak and vloeiendheid count in
the points (All 12 points, above). Recordings stay in memory, so after reopening an unfinished exam only the answers already written down are
there (as before with recordings).

When checking fails temporarily, single-task writing practice keeps the text editable and speaking practice retries the same transcript. Writing and speaking exam results offer a retry with the submitted answers, without registering another exam attempt. Speaking practice transcripts remain available in the open exercise only. The local A2 exam draft also restores the original deadline and question order after reopening.

Making new Lezen and Luisteren material with Claude was removed (it cost a call per tap and its
result was invisible). Items made earlier stay in `S.gen` and are still added by `addGenerated()`.

## Gesprekken (conversations with AI)

"Gesprekken" (a row under "Lezen, luisteren en spreken", `aiList()` in `#talk`) are real conversations with Claude, like
Duolingo's video call (the user's request, 23 November 2026). On that day the user also chose to remove the free,
offline scripted Gesprekken (keyword checks with `gpFits()`, October 2026): they were too rigid next to a real
conversation. Two menu buttons (aiMenu remembers the choice when returning from a conversation): "Praat met iemand" and "Dagelijkse situaties". The latter opens expandable topic groups, each with individual situation rows; choosing a situation shows its task before starting. Two parts:
- The first menu opens Bittie, the recurring AI partner for conversations on a topic the learner chooses.
  The full-screen dial shows when Bittie is speaking and doubles as the microphone control. Text input and the transcript
  remain available throughout the call. The existing topic key `saskia` keeps saved progress and memory compatible.
- The situations: the old scripts in `GP` (`data/extra.js`, the ones without `ona`), in their groups: on the phone
  (huisarts, work, landlord, school, gemeente, 112, a language school), work, school and the doctor, in town (bakker,
  apotheek, café, station, exchanging, the bike repairer, the market, the library, asking the way), the neighbours, and
  the B1 group (`b1:1`, listed first at B1). Each shows its photo (`p`) and task (`o`). `tools/build-scenes.mjs` turns
  them into `api/_scenes.js`: the server gives Claude the script (`a` lines and example answers `m`, closing `e`) as a
  model conversation, so the facts in it stay the checked ones while Claude reacts freely. After changing `GP` run
  `node tools/build-scenes.mjs` (the test fails otherwise). Facts in the scripts double as KNM material: check them.
  `v` is the person's voice (F or M). `k`, `r` and `x` are only used by the ONA scripts now; `GP` ids are progress
  keys of `S.ai` (and `S.gp` for ONA).
`TOPICS` in `api/_talk.js` (`PEOPLE` plus `SCENES`) and the page hold the same ids, `who` and `task`
(`tests/talk.test.mjs`); the server alone has the openers and prompts, so the page can't send its own prompt.
- One conversation costs one check (the user's choice), taken at `go:"start"` like one writing task: a guest's trial,
  a free account's seven, Plus's daily 20 (and 200 a month) (then no `CHECK_CAP`). Start returns the fixed opener (no model call) and a
  signed ticket (`talkSign()` in `_supa.js`, HMAC with the service key; account or trial cookie, topic, level, Plus,
  40 minutes); `go:"say"` and `go:"end"` need it and take no further check. At most `TURNS` (14) learner turns; the
  character rounds off from turn 8 (A2) or 10 (B1) and says goodbye (`done`).
- Free conversations use `TALK_MODEL_FREE` (default `GRADING_MODEL_FREE`, Haiku 5.5, no server fallback), Plus
  `TALK_MODEL` (default Sonnet 5.5, with refusal fallback); effort low, JSON output: `reply`, one `fix` for the
  learner's last line (shown under it as "Beter: …"), `done`. `go:"end"` gives `verdict`, `good` and up to four `tips`,
  which also go to Mijn fouten (`keepErrs()`). Tokens go to `ai_spend`. Nothing of the conversation is stored or logged.
- The voice: Azure's Dutch voices (Fenna for women, Maarten for men, Bittie Maarten +8%; `api/_azure.js`) when
  `AZURE_SPEECH_KEY` is set (since 27 November 2026), else Google Chirp 3 HD (Vindemiatrix for women, Charon for men), synthesised per reply by
  the server with `GOOGLE_TTS_KEY` (Vercel env vars: the user adds them in the dashboard, never in chat); without it, or
  when Google fails, the page uses the phone's voice (a synthesis request times out after 2.5 s). A turn is streamed (`stream:2`; the user found the replies slow, 24 November 2026): Claude writes `reply`, `done`, `fix` in that order, and the server voices each sentence as soon as it is complete (`sentences()`; a short one joins the next) and sends JSON lines: {say, audio} per sentence in order, {reply, done, parts}, {fix}. The page plays them in a row (`aiNext()`), listens only after the last one, and an interruption silences the rest. A sentence once sent stays (a later refusal or cut only loses what follows); a model switch before the first sentence gives one plain answer, as do older pages (`stream:true` or none). `talk_time` in the logs has milliseconds only: `reply` the first sentence written, `sent` its voice on the way. Synthesis runs in parallel with spend accounting. The MP3 comes back as base64 and plays through Web Audio buffer sources;
  `aiUnlock()` unlocks its context with silence inside the tap. Browsers without Web Audio use the shared `sayA` element.
  Each decoded clip plays through a bounded gain (target active-sample RMS .12, maximum 3x, peaks no higher than .9;
  near-silence is not boosted), so replies have comparable levels without clipping. Where AudioSession is available,
  replies request playback and dictation returns to auto; this is a best-effort request, not control of the phone's
  hardware volume or Bluetooth routing. If cloud audio fails, the conversation stays on the device voice until it ends
  instead of alternating engines; voice:"device" skips server synthesis for subsequent turns. Device utterances use
  volume 1, never the volume 0 used by the unlock utterance. Real iPhone loudness validation is still needed.
  HTML audio between recognition sessions can silently break iOS dictation (WebKit bug 321436). It also unlocks the phone's speech synthesis with a silent utterance there, or the phone's voice stays mute
  after the network wait (the user heard nothing on 23 November 2026). A random person starts the conversation
  in the same tap as "Praat met iemand" (`aiTalk(id, true)`), so the greeting is heard at once; a situation waits for
  "Begin het gesprek" so the task can be read first. ▶ replays a line a little slower.
- The learner speaks through `listen("say", …, SPK, {conversation:true,hints})`. AI replies are submitted only by
  "Klaar" (the user's choice, 24 November 2026); silence, final recognition results, natural recogniser end and the old
  one-minute limit never submit a turn. The clock shows elapsed time. After the other person finishes, listening starts
  automatically (falls back to the button when the phone refuses the microphone without a tap). A failed microphone
  with partial text leaves an editable draft, never a model request. Klaar always sends what was heard, also interim or
  uncertain words, with no second tap on Stuur (the user's complaint, 24 November 2026; a review of uncertain words came
  in between before). After Klaar the page waits for late text: 1.5 s (`REC_TALK_MS`), 4 s when nothing arrived yet
  (`REC_TALK_EMPTY_MS`), 0.7 s when the text had stood still before Klaar (`REC_TALK_STILL_MS`), less once a final result or the recogniser's end comes. Text typed meanwhile counts when nothing was heard.
  Typing and Stuur remain available. A failed request keeps the learner's visible answer; retry replaces the pending turn.

  In AI conversations each completed take aborts and retires its recogniser before voice playback, so iOS gets a fresh
  recogniser for each answer; exams retain their existing shared recogniser. Restart exceptions and terminal errors
  are handled. Thinking never ends a take: the check every 8 s only fails a recogniser that never started, and quietly
  replaces one (`r.renew()`, same take, text kept) that heard a voice five seconds ago without words or stays silent for
  three checks, never just after a voice began (that swallowed first words: "van Gogh" became "Gogh"); after
  three replacements it offers a retry. audio-capture and network errors without text are retried twice. A failure shows
  its code in brackets, so a learner's report says what went wrong. The button says "Wacht even…" until the phone really
  records (`audiostart`, `r.go()`), recognition restarts 20 ms after it ends, and leading words the phone drops from its
  own hypothesis are kept.
  Permission checks are scoped to the specific take, so old timers cannot cancel a later answer. Test doubles cover
  five consecutive spoken replies, a deaf third take, late timers, cancellation and late audio decoding. A real iPhone
  microphone check is still needed; automated tests cannot certify the WebKit workaround on every iOS version.
  Recognition uses nl-NL and up to three alternatives. AI dictation supplies modest context phrases (current task,
  person, last question; fish vocabulary for Haringboer Dirk) only when SpeechRecognitionPhrase/phrases are supported.
  An unsupported-phrases error clears the hints and permits the normal restart. Do not promise this improves iOS's
  acoustic model: support varies, and speech recognition accuracy has not been measured on the user's microphone.
  Close domain words with a shared ending (e.g. kering → haring in the fish conversation) and native alternatives are
  suggestions in the draft a stopped microphone leaves, never silent substitutions.
  A final result replaces its interim hypothesis, and the ready message waits for the recogniser's start event. No additional model calls or providers are used for these checks.
- Bittie's memory (the user's wish, 24 November 2026, kept in the account): `S.sm` `{on, onAt, f: {id: {t, at}}}`, at most 20
  short facts, with the progress (guests: on the device). Only after a yes: `memAsk()` asks once, before the first review,
  in the menu language (outside the Dutch conversation); `on:false` is never asked again and nothing is sent. Only Bittie:
  the page sends dated facts with `say` and `end`, the server puts them in the message as data and ignores them for other
  topics; with facts the greeting is one of `again` (no model call). `end` with `remember:true` returns `facts` and `old`
  (what to forget) in the review call, so no extra call. The prompt forbids sensitive facts and `PRIVATE` drops them
  again on the way in and out. Profiel, "Wat Bittie over je weet" (`memScreen()`): see, erase, switch off. Deleting the account
  drops them from the device too. privacy.html describes it in nine languages: change both together.
- `/api/talk` is a rewrite to `/api/check?kind=talk` (the 12-function limit); `check.js` imports `_talk.js` only then.
  `S.ai` `{id: {n, at}}` (merged like `S.gp`); the event `ai` counts started conversations. privacy.html says, in all
  nine languages under the checking section, what goes to Anthropic and Google.

## Review of A2 writing feedback

The checker labels each correction with a criterion. Inversion in a main clause and singular instead of plural agreement
are grammar labels with their own follow-up exercises. The server collapses duplicate edits that only differ in how much
unchanged text surrounds the edit. Full spelling points can still coexist with minor mistakes that leave the text
understandable. The result explains this next to the score. The versioned writing cache avoids replaying older feedback
without these labels.

After ordinary A2 writing practice, Mijn dag offers a different sentence on the next day for either of those two grammar
rules. The words are supplied so the check can focus on the intended rule. A correct sentence records success for that
exercise. A missed sentence returns the next day with a different prompt. Progress stores only the rule, prompt index,
date, result and update time along with existing progress. The new sentence is checked on the device.

In speaking practice, learners can correct the recognised text or speak again before explicitly requesting a check.
Only that confirmed text goes to the existing grading endpoint. The edit field stays in the current exercise and is
discarded on leaving. Pronunciation and speaking speed still require audio and are outside the transcript score.

For NT2 calibration, ask a qualified reviewer to score the original A2 tasks before seeing the app's result. Include
the brief asking a neighbour to water the plants and a form. For the brief, compare a complete clear answer, a clear answer
with small spelling errors, an answer missing the key location, and an off-topic answer. For the form, include a complete
form and cases missing a required field or giving an unclear open answer. Record criterion-level scores and the reason
for any disagreement. Check the free and paid models on the same set. Keep these results separate from pass-rate claims. In /admin, "Сравнение моделей" has "Скачать для учителя (CSV)", for Schrijven (30 texts) or Spreken (24 transcripts, no spelling column): the made-up answers of `api/_samples.js` with an empty
column per criterion and no model result (`/api/compare` with `{list: true}`, no model call). The reviewer's points go into
`expected` of that sample, with `by` and `date` (never guessed: `tests/compare.test.mjs`); a run then shows, per model, the share
within one point of the reviewer, the same voldoende, and exact agreement per criterion (`againstTeacher()`).

A completed Schrijven A2 exam schedules the most frequent supported rule in scored responses for the next study day. The following two sentences test that rule with different wording. A Spreken A2 exam with near-complete answers can schedule a new question that also asks for a reason. The plan only displays successful speaking practice after the new response receives full content points. Only rule labels, question keys, counts and dates go into this follow-up progress.

In a Bittie conversation the learner may opt in to practising one saved dictionary headword and one predefined mistake category. The client sends only those targets with the turns. The server turns known category IDs into conversational practice prompts. It does not use the learner’s earlier error text or the word list.
