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

In practice, a checked text with corrections goes on with "Schrijf de verbeteringen" (`practiseCorrections()`: each correction written from memory, compared on the phone). After a proefexamen each task keeps "Schrijf het nog een keer" (`redo()`, `redoItems()`: Schrijven and Schrijven B1, in practice and per task after a proefexamen,
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

When checking fails temporarily, single-task writing practice keeps the text editable and speaking practice retries the same transcript. Writing and speaking exam results offer a retry with the submitted answers, without registering another exam attempt. Speaking practice transcripts remain available in the open exercise only. The local A2 exam draft also restores the original deadline and question order after reopening.

Making new Lezen and Luisteren material with Claude was removed (it cost a call per tap and its
result was invisible). Items made earlier stay in `S.gen` and are still added by `addGenerated()`.

## Gesprekken (conversations with AI)

"Gesprekken" (a row under "Lezen, luisteren en spreken", `aiList()` in `#talk`) are real conversations with Claude, like
Duolingo's video call (the user's request, 23 November 2026). On that day the user also chose to remove the free,
offline scripted Gesprekken (keyword checks with `gpFits()`, October 2026): they were too rigid next to a real
conversation. Two menu buttons (aiMenu remembers the choice when returning from a conversation): "Praat met iemand" and "Dagelijkse situaties". The latter opens expandable topic groups, each with individual situation rows; choosing a situation shows its task before starting. Two parts:
- The first menu now opens Saskia, the recurring human host of a small museum cafe in Utrecht (the user's
  approved direction, 24 November 2026). Her approved portrait is `art/characters/saskia-museum-v1.jpg` (768 pixels wide);
  `aiList()` shows her card and `aiTalk()` her full portrait. The image is a still, not an animated video or a fake lip-sync.
  `api/_talk.js` defines her museum-cafe persona and openers. `aiAny()` now consistently opens Saskia; `aiIds()` counts
  her plus the situations. Older PEOPLE/TOPICS ids remain supported for old sessions and progress but are not offered
  in the main menu. Her portrait, outfit and setting were created with built-in image generation; source and prompt
  records are kept locally in `art/characters/`. No Tavus custom face has been trained or connected to the app. The
  separate Tavus Dirk pilot and its stock face are not a Saskia video. Training her own face requires the user's paid
  service activation and a later integration; do not describe the static portrait as completed video animation.
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
- The voice: Google Chirp 3 HD (Vindemiatrix for women, Charon for men, like the recordings), synthesised per reply by
  the server with `GOOGLE_TTS_KEY` (a Vercel env var: the user adds it in the dashboard, never in chat); without it, or
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
- Saskia's memory (the user's wish, 24 November 2026, kept in the account): `S.sm` `{on, onAt, f: {id: {t, at}}}`, at most 20
  short facts, with the progress (guests: on the device). Only after a yes: `memAsk()` asks once, before the first review,
  in the menu language (outside the Dutch conversation); `on:false` is never asked again and nothing is sent. Only Saskia:
  the page sends dated facts with `say` and `end`, the server puts them in the message as data and ignores them for other
  topics; with facts the greeting is one of `again` (no model call). `end` with `remember:true` returns `facts` and `old`
  (what to forget) in the review call, so no extra call. The prompt forbids sensitive facts and `PRIVATE` drops them
  again on the way in and out. Profiel, "Wat Saskia over je weet" (`memScreen()`): see, erase, switch off. Deleting the account
  drops them from the device too. privacy.html describes it in eight languages: change both together.
- `/api/talk` is a rewrite to `/api/check?kind=talk` (the 12-function limit); `check.js` imports `_talk.js` only then.
  `S.ai` `{id: {n, at}}` (merged like `S.gp`); the event `ai` counts started conversations. privacy.html says, in all
  eight languages under the checking section, what goes to Anthropic and Google.
