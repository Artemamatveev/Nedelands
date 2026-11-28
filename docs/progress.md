# Progress, sync and offline
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

## Progress

Progress is isolated by account, with a guest scope. `ww-progress-v2:<owner>` stores `{data, frame, version}` locally and in IndexedDB. Existing `ww-v1` data is migrated only into the account recorded by `ww-acc`, or into the guest scope if none was recorded. Never discard this legacy backup. Normal logout clears the active-owner marker and switches to guest progress, without merging account data into another account. A matching cached Supabase user may reopen that same local scope offline while session refresh is unavailable; it never grants server access.

`frame.base` is the last acknowledged server snapshot and must be a deep copy independent of live `S`. A pending write records its local input, target, receipt id and device id before sending. `syncProgress()` reads the latest row, merges offline changes, and updates only if its `t` still matches. Retries inspect `_receipts` so losing an acknowledgement cannot count the same answers twice. New practice-result rows have a random `id` as well as `at`; older rows still work. Errors schedule retries and show a sync status in Profiel. Do not revert to whole-document last-writer-wins.

Practice rounds (`build()`): due questions first, the lowest box first, but while unseen questions remain at most half
of a round (it was 70%, and a five-question round then brought one new question a day: learners met the same KNM
questions over and over). `GAP` is `[1,2,4,7,14,30,60]` days per box (`S.items .b`); a question right the first time
starts in box 2 (back in four days, not tomorrow); a wrong answer goes back to box 0. New KNM questions mix the short
ones and the situations (their `ord` is counted apart), so the exam's format is not kept until last.

`S.res` keeps the last 10 practice-exam scores per part. A stable practice result requires three recent results averaging at least 80%, each above the practice target, with at least two mostly new attempts. This describes practice performance. Speaking never reaches it; a Spreken A2 result with `snd: 1` counted pronunciation and fluency from recordings (docs/ai.md), one without leaves them unassessed. The score thresholds are practice targets.

New A2/B1 writing results also have an optional `writing` v1 snapshot: task-type and criterion point totals, task counts and the number left blank. It contains no answer text or error fragments. The current report separates types absent from that exam from types that scored zero; Profile combines up to five recent detailed attempts with their task/attempt counts. Legacy results retain their scores without invented breakdowns. Missing or malformed grades preserve the draft and do not create a total. A submitted blank exam scores zero without a model request.

Writing drafts are local and account-scoped (`ww-writing:<owner>:practice|exam:<section>`). They retain task keys, text, form fields, position, grouped B1 sentences and the original exam deadline. Practice has no timer. An expired exam opens its review without another timed attempt. Successful grading clears the draft. An unsuccessful request preserves it.

A2 speaking exam drafts are local and account-scoped (`ww-speaking:<owner>:exam:sp`). They keep the question order, transcribed answers, original deadline and submission ID. Audio is held in memory. An expired draft opens submission review. Successful grading or explicit discard removes the draft.

Writing feedback recommends at most two actions, prioritising unfinished tasks and critical content before other lost points. A zero for content is not treated as separate evidence of grammar or spelling weakness. Identified word-order errors can open the existing A2/B1 word-order section; other actions open the relevant writing task. These focused tasks use a separate `:focus/<task-key>` draft slot, appear among resumable drafts, and preserve ordinary practice drafts. Returning restores the exam result without grading or recording the attempt again. Detailed corrections, rewriting and Word export remain available under the summary.

Run `npm ci --ignore-scripts` and `npm test` after changes. `tests/browser.test.mjs` opens the homepage and the app
in Chromium (no errors, no sideways scroll, Arabic right to left, the sample question, the KNM theme list, and axe-core
(a dev dependency) finding no accessibility problem on the homepage, every tab, an answered question, a proefexamen, the
login window, Over and Privacy, light and dark; a screen without the painting gives its own `h1`, like `#playh`); it skips
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
cache first and refreshed in the background. Recordings (`audio/*.mp3`) are kept after their first play under a name that
is the hash of the line, not of the voice: when all of `audio/` is recorded with other voices, change `VOICES` in sw.js
(`azure-1` since 28 November 2026), and on activate the saved recordings are dropped once (marker `/__voices`). The page sends the list of paintings and photos to keep 10 s after the
start, only on a fast connection that is not mobile data and without Save-Data (`bulkOK()`; iPhone has no
`navigator.connection`, so there pictures are cached when first shown, and Profiel has "Alles downloaden voor offline", `warmAll()`; the dictionary's `warmDict()` follows the same rule), asks for a new sw.js at every start and return (`r.update()`), (Profiel's line with how long the start took was removed at the user's wish). `api/` never cached. Don't change the stored shape without migrating old data.
Saving progress to a file was removed on purpose. On an iPhone in Safari a tile on Vandaag (`drawA2hs()`)
asks to put the app on the home screen, because Safari can wipe a site's storage after a week without a visit; the
home-screen app has its own storage, so the progress goes along by the clipboard (Kopieer / Plak mijn voortgang).
The app moved to https://bittertalen.nl. Both old public origins are migration-only: home, practice and exam entry points
return to `moveScreen()` with no “Nu niet” bypass. Browser visits automatically carry `S`, `ww-media` and own books
(gzip/base64url, `BITTERTALEN2:`, books omitted above 60,000 characters) in the fragment to bittertalen.nl/oefenen;
`arrive()` merges it there. Account initialization finishes before transfer, and old storage is retained. A failed transfer
shows only a retry. Installed apps retain login/reinstall instructions and a link to the new address; there is no route
back to exercises. Migration visits do not emit usage events. On legacy origins the worker skips precaching, activates
immediately, navigates open windows to the migration gate, and uses network-only navigation. Offline it shows a blocking
move message rather than cached practice; all local data/cache remains intact. Devices must connect once to receive
this worker update. Normal bittertalen.nl startup, offline caching and account isolation are unchanged.

A2 Lezen, Luisteren and KNM practice-exam drafts stay on the device under the current account or guest scope. They include question keys, selected answers, option order, playback counts and the original deadline. Submitting clears the draft.
