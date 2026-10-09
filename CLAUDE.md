# Nederlands A2

A single-page study app for the Dutch A2 integration exam (inburgeringsexamen).
Everything lives in `index.html` (styles, data, logic). Paintings are in `art/`.
Deployed on Vercel from `main`: every push to `main` goes live at https://nedelands.vercel.app.
The app's UI language is Dutch; the user talks to Claude in Russian.

## Design: Delfts blauw

The design should also teach Dutch culture. Keep it recognisably Dutch and avoid the
generic "AI app" look.

- **Colours**: tin-glaze white `--bg`, cobalt `--blue`, light wash `--wash`, and
  `--oranje` as the only accent (timer, today marker, selection, the streak stamp).
  Always use the tokens on `:root`; every colour has a dark-mode value.
- **Type**: the system font only (`-apple-system, system-ui`: SF Pro on iPhone), so the
  app reads like a native iPhone app. No web fonts; headings semibold (600–700), never 800.
  No handwriting or decorative fonts.
- **Shapes**: square or nearly square corners (2–4px), solid 1px separators, flat buttons.
- **Dutch motifs instead of decoration**:
  - Header: the painting of the day (`ART` + `paint()` in `index.html`), with a museum
    label underneath: artist, title, year, museum and one A2 sentence in Dutch (no
    translation). Tapping the painting shows it in full.
  - Tiles: "Je les van vandaag" (the numbered steps of today's plan, at the top of the home screen) is a Delft tile with corner motifs; timeline dots are tiles
    turned 45°.
  - Streak: a stamp, like on a Museumkaart.
- **Never use**: cream or beige backgrounds, handwriting fonts, wobbly hand-drawn
  border-radius, dashed lines, highlighter underlines under headings, decorative SVG
  squiggles, emoji as decoration.

## Home screen

One clear path, top to bottom: today's lesson (numbered steps; the next one is filled
cobalt), then choose yourself (exam parts with "Oefenen" + "Proefexamen", grammar), then
reading and progress. Every section appears once; don't add a second entry point to the
same exercise.

## Paintings

Only public-domain or CC0 images, downloaded from Wikimedia Commons into `art/`,
resized to max 1000px and compressed (~100–150 KB each). Record every new image in
`art/CREDITS.md`. To add one, append to `ART` with `f` (file name), `y` (vertical focus
in % for the header crop), artist, title, year, museum and an A2 sentence. Check facts in the sentences; they double as KNM material.

## Progress

Progress is per device: `localStorage` key `ww-v1`, mirrored to IndexedDB as a backup.
There is no server. Don't change the stored shape without migrating old data.

## Writing and speaking check (Schrijven, Spreken)

`api/check.js` is a Vercel function that grades writing with Claude (`claude-opus-5-5`,
structured JSON output, server-side refusal fallback). The page posts
`{tasks:[{task, form, text}]}` and gets `{tasks:[{passed, verdict, corrected, errors}]}`;
the prompt is built on the server, so the page can't send arbitrary prompts. It only
accepts requests whose Origin is the site itself. It needs `ANTHROPIC_API_KEY` in the
Vercel project's environment variables (the user adds it in the dashboard; never handle
the key in chat). Without it the page falls back to showing the example answer.

Spreken uses the same function with `{part:"sp", tasks:[{task, text}]}` (up to 16, for the
proefexamen). Claude can't take audio, so the phone writes the answer down first (Web Speech
API, `nl-NL`). Recording (`MediaRecorder`, to play the answer back) and transcribing are
separate takes, never at the same time: on iPhone they compete for the microphone. One
minute per answer. Recordings and transcripts stay in memory only.

`api/generate.js` writes new Lezen and Luisteren material (same key, same Origin check);
inside Claude the page uses `window.claude` instead. Generated items are kept in `S.gen`.

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
