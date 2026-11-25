# Bittertalen

Bittertalen (a pun on bitterballen: "bitter languages") is a study app for the Dutch A2 integration exam
(inburgeringsexamen) and the Staatsexamen NT2 B1, at https://bittertalen.nl. This file is the short index: the full notes
are in `docs/`, one file per area. Read the one for the area you change, and keep it true in the same commit.

| File | What is in it |
| --- | --- |
| `docs/site.md` | the homepage, its language pages, the public pages (over, privacy, voorwaarden, contact, nakijken), search, deploy, the app's startup and splash |
| `docs/design.md` | Delfts blauw: colours, glass and tiles, type scale, shapes, logo, what never to use |
| `docs/app-ui.md` | the five tabs, Profiel, navigation rules, words, motion and touch |
| `docs/content.md` | the data files and their shapes, B1, Beginnen, books, history, paintings, photos, voices, media |
| `docs/progress.md` | progress, account scopes, sync and merges, the service worker and offline |
| `docs/server.md` | the 12 functions, accounts, free checks, AI spend limits, Plus and the Examenpas, groups, counts, admin |
| `docs/ai.md` | grading of writing and speaking, conversations with Claude (Saskia and situations) |
| `docs/native.md` | the Capacitor apps for the App Store and Google Play |

## Map

- `index.html` + `landing.js` + `landing.css`: the homepage. `en.html` … `ru.html` are generated from it.
- `oefenen.html`: the study app (code, styles, small tables), served at `/oefenen`.
- `data/*.js`: the large content (`knm.js`, `a2.js`, `b1.js`, `extra.js`) and `ui.js`, the menu translations.
- `study/*.js`: stable language data and logic loaded by the app. `lib/`: the vendored Supabase client.
- `api/*.js`: Vercel functions; files starting with `_` are helpers, not routes. `supabase/`: schema and migrations.
- `art/`, `foto/`, `audio/`, `dict/`: paintings, photos, recorded voices, the Dutch–English dictionary.
- `tools/`: build and check scripts. `tests/`: `node --test`. `native/`: the store apps (not deployed).
- `admin.html` (/admin, Russian, owner only) and `docent.html` (/docent, teachers).

## Rules that always apply

- **Deploy**: every push to `main` goes live. Push `main` first, then a working branch (see `docs/site.md`).
- **Tests**: `npm ci --ignore-scripts` and `npm test` after changes; CI (`.github/workflows/check.yml`) also runs the
  browser tests and must pass.
- **Versions**: after editing `data/`, `study/` or the dictionary run `node tools/stamp.mjs`. After editing `index.html`
  or `copy` in `landing.js` run `node tools/build-lang.mjs`; never edit `en.html` … `ru.html` by hand. Change the
  `?v=` name of `landing.js`/`landing.css` in `index.html` when they change: the service worker keeps every version.
- **Languages**: the menus exist in Dutch plus `[en, ar, tr, hi, zh, es, ru]`. Every new menu string needs all seven
  translations (`UI`/`UIR` in `data/ui.js`, `copy` in `landing.js`). Exercises, conversations and reading stay Dutch
  (`lang="nl"`). Arabic is right to left: use logical CSS. privacy.html, over.html, voorwaarden.html and nakijken.html
  have one article per language: change all eight together.
- **Keys are progress**: item keys (`knm|3`, `lz|3.1`, `gs|<id>.<n>` …) are stored. Append items; never reorder or rename.
- **Content**: original texts only (DUO's exams are copyrighted); check every fact, they double as KNM material. Wrong
  options must be plausible, never also correct, and about as long as the right one (`node tools/answer-length.mjs`,
  `tests/answer-length.test.mjs`). KNM and Luisteren options are recorded: after changing them run `audio/build.mjs`.
- **Privacy stays true**: when data goes somewhere new (a service, a field, an event), update privacy.html in all eight
  languages and its date. No analytics beyond the anonymous counts in `docs/server.md`.
- **Secrets**: never handle, print or commit API keys (Anthropic, Stripe, Google, Supabase service role); the user sets
  them in Vercel. A new outside host needs its place in the CSP in `vercel.json`.
- **Functions**: at most 12 deployed files in `api/` (Hobby plan); add endpoints as rewrites (`docs/server.md`).
- **AI cost**: every model call goes through the allowances in `docs/server.md` (free total, `PLUS_LIMIT` a day,
  `PLUS_MONTH` a month, `OPUS_MONTH`, `PASS_TOTAL`/`PASS_OPUS` per Examenpas, `CHECK_CAP`) and has a timeout. Prompts are built on the server only.
- **Store apps**: no prices, offers or links to buying inside the native apps (Apple 3.1.1).
- **Design**: Delfts blauw tokens only; never cream backgrounds, handwriting fonts, wobbly borders, dashed lines,
  squiggles or emoji as decoration (`docs/design.md`). One `h2` per screen; one filled `.btn` per screen.
- **Truth on screen**: Bittertalen is not DUO; scores are practice results, never a prediction or a pass guarantee;
  Saskia is an AI character.
- **Search**: until the public launch every address sends `X-Robots-Tag: noindex` (`vercel.json`). The user decides when
  to lift it; then limit the rule to the old vercel.app hosts (`docs/site.md`).

## Open items (25 November 2026)

- KVK and BTW numbers are placeholders in voorwaarden.html and the footer until the KvK registration.
- Luisteren is all Google voices. Real people can record lines: `node audio/build.mjs --dry --script` gives the
  script, the file goes to `audio/<key>.mp3` and the key into `audio/live.json` (never recorded over). None yet.
- The model prices in `admin.html` (`PRICE`) must be checked against Anthropic's price list when they change.
- Grading has not yet been compared with an NT2 examiner (`supabase/calibration.sql`, `docs/ai.md`).
