# Server: functions, accounts, payments, counts
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

## Functions and the Vercel plan

The Hobby plan deploys at most 12 functions (files in `api/` not starting with `_`); a 13th made the production build
fail at "Deploying outputs" on 19 November 2026. `/api/thumb`, `/api/compare` and `/api/referral` are therefore rewrites
(`vercel.json`) to `feed.js`, `admin.js` (POST) and `group.js` (`?kind=ref`), with their code in `_thumb.js`,
`_compare.js` and `_referral.js`. Add a new endpoint the same way, or check the count first (`tests/group.test.mjs`).

## Limits on AI spend (25 November 2026)

On top of `PLUS_LIMIT` a day, a paying learner (Plus, Examenpas or group) has `PLUS_MONTH` (default 200) checks per
Amsterdam month, shared by grading and conversations, and at most `OPUS_DAY` (default 2) proefexamens a day graded by
`GRADING_MODEL_EXAM`; after that `GRADING_MODEL` grades them. A conversation ticket allows `TURNS + 2` calls (say and end),
counted on the server, because the history comes from the page. All three are counters in table `ai_guard`
(`use_guard()`, migration `20261125090000_ai_guard.sql`, also in `schema.sql`, applied 25 November 2026); an unreachable
monthly or exam-model counter lets a paying learner through (logged), an unreachable ticket counter refuses the turn (503).
Once the model was called, a failure gives back only the daily check: the monthly and exam-model counters keep it. The monthly limit answers 429 `month`, the ticket limit 429 `turns`.
Timeouts: grading ends 110 s after the request arrived (no retry for a proefexamen, one otherwise; under 30 s left: 503 `timeout` before calling the model), conversation turns after 60 s, every Supabase and Stripe fetch in
`_supa.js` after 8 s, so a check is always given back instead of being lost with a killed function (504 `timeout`).
`max_tokens` is 8000 for one to three tasks and 12000 for a proefexamen. voorwaarden.html ("Redelijk gebruik") names
20 a day, 200 a month and two proefexamens on the strongest model: change it in all eight languages with these defaults.
Functions run in Frankfurt (`"regions": ["fra1"]` in `vercel.json`, next to the Supabase database); privacy.html says so.

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
  needs no verification; Supabase's Site URL and Redirect URLs are https://bittertalen.nl; Apple is on since 23 November 2026: Services ID
  `nl.bittertalen.web` (shown to users as "Bittertalen") with Supabase's callback, Client IDs `nl.bittertalen.web,nl.bittertalen.app`,
  key `6GMQ7P9JL6` in `~/.config/bittertalen/` (never in the repository); its client secret lasts six months, the current
  one until 22 May 2027: `node tools/apple-secret.mjs` puts a new one on the clipboard for Supabase's Apple provider), also in an iPhone home-screen
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
- Signing out uses `scope:"local"`: leaving Safari must not revoke the installed app or other devices. Deferred auth events carry a version so stale sign-out callbacks cannot overwrite newer sessions.
- Sync uses the account-scoped state and retry journal described above. Supabase RLS still limits reads and conditional updates to the signed-in user's row. No new table or privileged client API is needed.
- Free accounts get `FREE_ACCOUNT_CHECKS` (default 7) checks in all, never renewed (the user's wish, 19 November
  2026: the weekly seven replaced buying). The total is one `check_week_usage` row per user under the fixed bucket
  date 2000-01-03 (`window_kind 'once'`, migration `20261119140000_free_total_checks.sql`, also in `schema.sql`; run it
  in the SQL editor before deploying); old weekly rows stay as history. Writing and speaking share this allowance at levels not covered by Plus. Paid checks use a separate `PLUS_LIMIT`
  (default 20 since 25 November 2026, 60 before) daily ledger. `check_week_usage` and `check_day_usage` are server-written, with read-own RLS; daily
  `check_usage` still records all account usage for owner analytics. The server-only invoker RPC `use_plan_checks()`
  atomically reserves/refunds the budget. A captured timestamp keeps refunds in the original day/week.
- Without an account there are `FREE_CHECKS` (default 2) one-time trial checks in that browser, not a daily gift.
  `bt_trial` is a signed HttpOnly/Secure/SameSite=Lax functional cookie, valid up to 400 days. Only its hash and usage
  are stored in the service-only `trial_checks`; `trial_check_total` retains the daily global guest cap (`FREE_CAP`,
  default 50). Zero-cost lookups do not create usage rows. Deleting a browser's site data loses its trial identifier;
  anonymous trials cannot establish a person's identity. Privacy describes the cookie and retention.
- `GET /api/allowance` is never cached: an authenticated user gets only their own daily counter and free total (`totalUsed`); a guest gets
  the remaining browser trial. The config says `period:"once"` and `freePeriod:"once"`; new pages request the versioned
  config URL so a cached old daily plan is not used. The app tracks the two counters independently when switching levels.
- Invite a friend (19 November 2026): Profiel's account group has "Nodig een vriend uit" (`refScreen()` in `#talk`): the
  link `/?ref=<code>` to share or copy. A `?ref=` on the homepage or the app is kept in `ww-ref` until there is an
  account; `claimRef()` then posts it once to `/api/referral` (`api/_referral.js`, through `group.js`; GET gives `{code, invited, bonus}`).
  Only an account made in the last 14 days can claim (`REF_DAYS`), never its own code, once. Both get 3 extra free
  checks, the inviter for at most 10 friends (`referral_bonus()`); `api/check.js` and `/api/allowance` add `bonus` to
  the free limit, and the page's `myLimit()` follows. Tables `referral_codes` and `referrals`, server-only, migration
  `20261119160000_referrals.sql` (also in `schema.sql`; run it in the SQL editor before deploying). privacy.html says so.
- Groups for schools and employers (B2B, 19 November 2026): the owner makes a group in /admin ("Группы": name, level,
  places, end date, the teacher's e-mail; `api/group.js` `{go:"make"}`) and gives its 8-character code to the school.
  A learner enters it in Profiel ("Code van je school of werk", `groupScreen()`, which says first that the teacher will
  see their practice) and gets the Plus checks of the group's level until the end date: `plusFor()` returns the group
  (`pass:true`, `group:<name>`) when it covers more than a subscription or Examenpas. The teacher logs in with that
  e-mail (confirmed) and opens /docent (`docent.html`, Dutch, noindex, not linked): their groups and per member name,
  e-mail, level, last activity, practice time and answers in the last 7 days and the last proefexamen scores
  (`teacher_overview()`, the owner's summary without checks or Plus). Tables `groups` and `group_members`, server-only,
  migration `20261119170000_groups.sql` (also in `schema.sql`). privacy.html says what the teacher sees. Invoicing is by
  hand for now.
- One task costs 1 check, Schrijven A2 2, Schrijven B1 4, and Spreken A2/B1 6. All other practice and example answers
  stay free. Errors refund the learner; an uncertain paid provider outcome still retains its global spend reservation.
- Apply the reviewed migration `supabase/migrations/20261112192552_weekly_free_checks.sql` before releasing the new
  API. `tools/apply-weekly-checks.mjs --apply --project=bleeegmutxepidfkabgs` runs only inside an explicitly targeted
  Vercel build using its existing database connection, validates the project and schema, verifies quota behavior in a
  rolled-back savepoint, and records the migration checksum transactionally. It prints no credentials. Local tests use
  real Postgres via PGlite; `supabase/verify-weekly-checks.sql` checks limits, Monday resets, refunds and permissions.
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

The current pricing (12 November 2026): Plus A2 is €9,99/month and raises the daily AI allowance to `PLUS_LIMIT`
(default 20 since 25 November 2026, 60 before) on A2 only. Plus B1 is €14,99/month and includes A2. All practice and timed proefexamens remain free;
Seven checks in all remain available with a free account (`FREE_ACCOUNT_CHECKS`).
There is no trial or yearly price. Videos and podcasts remain free.
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE` (the existing A2 monthly price), `STRIPE_PRICE_B1` and `STRIPE_WEBHOOK_SECRET`
  enable billing. `STRIPE_PORTAL_CONFIG` identifies the portal configuration offering the two plans. A2 and B1 are
  separate Stripe products because the portal requires unique billing intervals within a product. Keep price IDs in
  environment configuration. Never retrieve, print or commit authentication secrets.
- `api/_supa.js` fixes the displayed amounts in cents (`PLANS`) and verifies the configured Stripe price's EUR amount
  and monthly interval before Checkout. `plusFor()` reads the actual subscription price to determine `level`, without
  changing the Supabase schema or storing entitlements in client-writable progress. Subscription metadata records
  ownership; it does not grant a level. Only the two configured price IDs can grant Plus.
- `api/plus.js`: authenticated GET returns only `{plus:{status,until,ends,level}|null}`. POST `{go:"buy",level:"A2"|"B1"}`
  starts Checkout for that plan; an omitted level from an old page buys A2. A current A2 subscriber choosing B1 gets a
  `subscription_update_confirm` portal flow for the same subscription item. Stripe shows the amount and requires their
  confirmation; this endpoint never updates or charges an existing subscription. POST `{go:"manage"}` opens the portal.
  A lower-price change is scheduled for period end; cancellation, invoices and payment-method changes remain available.
- `api/stripe.js`: the webhook (raw body, `bodyParser:false`), events `customer.subscription.created`, `.updated` and
  `.deleted` (Snapshot payloads). Every event reads the subscription from Stripe again and keeps the user's row of table
  `plus` (`supabase/schema.sql`; RLS: read own row; written only by the server): customer, sub, status, `until` (end of
  the paid month), `ends` (cancelled). An old subscription that ends never hides a newer one; an event for a deleted
  account cancels the subscription.
- `api/check.js`: an active subscription covering the requested part (`wb`/`sb` require B1) gets `PLUS_LIMIT`; Plus checks
  don't count against `CHECK_CAP`. `api/account.js` cancels the subscription at Stripe before it deletes the account.
- The page: `acc.plus` (verified through `/api/plus` in `usage()`), `isPlus(level)`, `myLimit(level)`, a "Bittertalen Plus" row in Profiel under the
  checks counter (`plusLine()`) and `plusScreen()` in `#talk` (the one entry point). `plusBack()` handles the return from
  Stripe and `plusWait()` looks again a few times, because the webhook may be later than the learner. Stripe's pages are
  navigations, so the CSP needs nothing new.
- The Examenpas (November 2026): one payment, no subscription, for `PASS_DAYS` (91) of the Plus checks at its level
  (A2 €19,99, B1 €24,99 incl. A2; `PASSES` in `api/_supa.js`; 91 days since 25 November 2026, 42 before, so a pass is clearly cheaper than three months of Plus). On only with `STRIPE_PRICE_PASS_A2` and
  `STRIPE_PRICE_PASS_B1` (one-time EUR prices of exactly those amounts, verified by `matchesPass()`). `api/plus.js`
  `{go:"pass",level}` opens a `mode:"payment"` Checkout (409 `already` when a subscription covers that level) with the
  withdrawal-consent text above the pay button. The webhook also takes `checkout.session.completed` and
  `.async_payment_succeeded` (add them in Stripe), reads the session again with its line items and writes a row of
  `exam_pass` (keyed by the session, so a repeat adds nothing; a new pass of the same level follows on from a running one;
  migration `supabase/migrations/20261119003000_exam_pass.sql`). `plusFor()` returns the pass (`pass:true`, `ends:true`)
  when it covers more than the subscription, so `api/check.js` needs nothing new. Refunds are not handled automatically:
  delete the row by hand. The homepage has an Examenpas card (`#pass-card`), the app's Plus screen its two cards
  (`data-pass-plan`), and voorwaarden.html an Examenpas section in all eight languages.
- privacy.html has a Stripe section (Stripe Payments Europe, seven years for payment records). Before taking real
  money: KVK (within a week of the start), Stripe's account verification, live keys, algemene voorwaarden and the right
  of withdrawal for digital services.

## Usage counts (anonymous)

To see what is used and where learners stop, the pages count a few events, and nothing more: per Amsterdam day one number
per event, level (`A2`, `B1`, or empty on the homepage) and menu language, in table `usage_counts` (`bump_event()` in
`supabase/schema.sql`, run it in the SQL editor; rows go after two years). No id, cookie, account, IP address or answer, so
a count can never be tied to a person. `track(ev)` in `oefenen.html` and `landing.js` posts `{ev, lvl, ui}` to
`/api/event` (`api/event.js`: same origin only, the events in `EVENTS`, `EVENT_CAP` a day per count, default 50 000), only
when `/api/config` says `events` (accounts on and `EVENTS` not `0`) and never with Global Privacy Control or Do Not Track.
Since 25 November 2026 also the way to paying: `plus` (the Plus screen, once per page load), `buy` and `pass` (Checkout started), `paid` and `stop` (back from Stripe), and `err`: an error on the page (`reportErr()`, at most five per load), whose technical message, file and line `api/event.js` writes only to the Vercel log (`client_error`), never to the table. The events: `open` (the app, once a day per device: `ww-day` keeps only the date, set only once the server kept the
count, so a lost one is sent again at the next start; asked again when a fresh config comes) and `new` (that first time,
with no progress yet), `home` (the homepage, once a day: `ww-day-home`, the same way), `begin` (a button from the homepage into the app, not
Inloggen or Plus), `quiz` (Vraag 4 answered), `test` (the starttest done), `day` (today's lesson done, with the ribbon), `ai` (an AI conversation started),
`exam_<part>` (a proefexamen started) and `done_<part>` (handed in: `keepRes()`). A new event goes in `EVENTS` too
(`tests/events.test.mjs` checks every `track("…")` in the pages against it). privacy.html describes this in "De website en
bezoekers tellen", "Cookies" and "Hoe lang", in all eight languages: change them with it. Vercel Web Analytics is not used
(the statement once said so; it was never on the pages). Read the counts in the SQL editor, for example
`select day, ev, sum(n) from public.usage_counts where day > current_date - 30 group by 1, 2 order by 1, 2;`.

## The owner's overview (admin)

`admin.html` (served as /admin, noindex, not linked anywhere, in Russian because only the owner reads it, light only)
works on phones and computers. Six totals lead into daily charts (7 days by default, switchable to 30); each line chart has a full-date readout changed by tapping, scrubbing, or arrow keys. Seven-day views label every date;
30-day views use four axis dates and an exact readout for every point. Tables include zero days and mark days before
11 November 2026 as unavailable instead of zero. The first chart counts distinct accounts with study time or answers per
day, not anonymous opens or devices. Anonymous event totals cannot identify unique people/devices and are labelled accordingly. The exact
period includes the year and notes that today is incomplete. Charts stack below 900px. Below are the accounts and the
anonymous 30-day event table, with a sticky date column. Accounts show name and e-mail, level, last activity, study time and
answers (with the share right) today / 7 days / in all, different questions, proefexamens per part (number and last score),
Claude checks and Plus; a row opens its minutes of the last 14 days and its exam history. Tables keep bordered, centred cells
(the user's wish); the measurement explanation is expandable. "Расход на ИИ" lists `ai_spend` (the last 30 days, per day and
model) in dollars from `PRICE` in the page (Anthropic's list prices, 18 November 2026: update them when they change), with
the 7- and 30-day totals. "Сравнение моделей" (a button, ~$0.25 a run) posts to `/api/compare` (`api/_compare.js`, through `admin.js`, owner
only, same origin): the ten made-up Schrijven A2 answers in `api/_samples.js` are graded by `GRADING_MODEL_FREE` and
`GRADING_MODEL` through `gradeWriting()` in `api/check.js` (the practice prompt, schema, clamping and pass rule), and the
table shows points, voldoende and error counts side by side, the rows where the verdicts differ highlighted. It loads the vendored Supabase library, reads the session the app left in
this browser and asks `/api/admin` (`api/admin.js`) with the access token; the server answers only a confirmed e-mail in
`ADMIN_EMAILS` (a Vercel env var, comma-separated; without it nobody gets in) and reads `admin_overview()` (in
`supabase/schema.sql`, run it in the SQL editor; it works out the summaries inside the database, so the large progress rows
never leave it) and `usage_counts`. Guests without an account appear only in the anonymous counts. Study time is `S.tm`
(day number → active seconds: the page visible and a tap, key or scroll in the last 90 s, or the app speaking; written to
`S` once a minute and when the page is hidden, days older than 400 dropped). It syncs with the progress, merged as a
counter per day (`rebaseProgress`, `mergeS` takes the larger), so two devices on one day add up. privacy.html says, in all
eight languages under "Met een account", that the progress includes the minutes per day and that the maker can see this
overview; change both with the page. Answers per day are `S.qd` (answered) and `S.qr` (right), counted in `record()` with
the totals in `S.items` (practice and proefexamens; a retry after a mistake in the same round doesn't count), merged and
pruned like `S.tm`; before 11 November 2026 only the totals exist. When `admin_overview()` in the database is older than the
page (a row without `qd`), the page says so in a notice: a new field in the function means running its block again. Profiel shows a row "Statistiek" to /admin only for the
owner: `adminCheck()` asks `/api/admin?me=1` once per login (200 only for an `ADMIN_EMAILS` account, without reading data).

## Audit follow-up validation

`supabase/calibration.sql` is a read-only owner report of self-reported real exam outcomes by practice-score band, with sample sizes and Wilson intervals. It does not expose a public view or change the schema. Do not claim the training targets have been empirically calibrated until this report and a qualified NT2 review have been completed against the correct project. Keep historical label changes in mind when analysing outcomes.

Signed-in exam grading accepts a request ID. Apply `20261125123000_grading_receipts.sql` before deploying the matching app and API revision. A server-only receipt claims the account, request ID and answer digest before reserving quota. The completed response is returned on a retry for 24 hours, without grading or charging again. Receipt requests prune expired rows. Account deletion removes receipts.
