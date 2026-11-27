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

In practice, a checked text with corrections goes on with "Verbeter je fout" or "Verbeter je 3 belangrijkste fouten" (`practiseCorrections()`: at most `FIX_MAX` = 3 corrections, the most important first, on one screen, each written from memory and compared on the phone; "Verder" skips; the user found five steps one by one too long, 26 November 2026). A correction that only adds or changes a full stop, comma or question mark (`punctOnly()`) is neither listed nor practised, and the A2 prompt does not count such punctuation for the spelling points. After a proefexamen each task keeps "Schrijf het nog een keer" (`redo()`, `redoItems()`: Schrijven and Schrijven B1, in practice and per task after a proefexamen,
not in Spreken, and only when the corrected text differs): the learner gets their own text back to correct, without the
corrected text on screen (the errors are in a fold), and "Vergelijk" marks it against Claude's corrected text on the phone
(`diffHTML()`: struck through = take out, green = add; capitals and punctuation count; a word in the wrong place counts as
one). No Claude call, so it costs no check, works offline and changes nothing in `S`. After a proefexamen it goes back to the
same result, not marked again. A sentence to finish comes back whole (`zWhole()`), because `corrected` is the whole sentence.
A B1 form gets one box per answer that differs: `SYSTEM_WB` asks for one line per form answer with the open answer last, and
another shape gives no button. An A2 form's `corrected` is the open answer only, so only that comes back.

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
the prompt counts errors: 0–2 = 2, 3–5 = 1, 6+ = 0). `passed` is set by the server from the points (inhoud 2+ and 7 of 10),
not by Claude, and the Schrijven proefexamen score is points of all 4 tasks against the 70% line. A form (A2 items with
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
(inhoud 0–3, woorden 0–2, grammatica 0–2, samenhang 0–1: DUO's criteria as far as a transcript shows them; pronunciation
and fluency can't be judged), clamped on the server; `passed` is set by the server from the points (inhoud 2+ and 6 of
the 8 since 25 November 2026, higher than 5 because 4 of DUO's 12 points can't be judged; `spPassed`), not by Claude, as for B1; a complete answer of fewer than 5 words (`SP_SHORT`, "Met de trein") keeps full inhoud, but the server caps woorden and grammatica at 1 and samenhang at 0 and adds a note to say two or three sentences (`capShortSpoken`, 26 November 2026), so two words never reach voldoende; in practice a transcript of only fillers ("eh", "hm") or a single letter is not sent for grading (`spokenTextReady`); the Spreken proefexamen score is points of all 16 questions. Speaking never
gets "Stabiel oefenresultaat" in Mijn examen (`ready()`), because pronunciation and fluency are not judged.
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
