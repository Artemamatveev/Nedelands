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
- **Type**: Proza Libre (by Dutch designer Jasper de Waard). One family, no
  handwriting or decorative fonts.
- **Shapes**: square or nearly square corners (2–4px), solid 1px separators, flat buttons.
- **Dutch motifs instead of decoration**:
  - Header: the painting of the day (`ART` + `paint()` in `index.html`), with a museum
    label underneath: artist, title, year, museum, one A2 sentence in Dutch and a Russian
    translation behind "Vertaling". Tapping the painting shows it in full.
  - Tiles: "Mix van de dag" is a Delft tile with corner motifs; the verb wall is a tile wall
    whose tiles get painted blue as verbs are learned; timeline dots are tiles turned 45°.
  - Streak: a stamp, like on a Museumkaart.
- **Never use**: cream or beige backgrounds, handwriting fonts, wobbly hand-drawn
  border-radius, dashed lines, highlighter underlines under headings, decorative SVG
  squiggles, emoji as decoration.

## Paintings

Only public-domain or CC0 images, downloaded from Wikimedia Commons into `art/`,
resized to max 1000px and compressed (~100–150 KB each). Record every new image in
`art/CREDITS.md`. To add one, append to `ART` with `f` (file name), `y` (vertical focus
in % for the header crop), artist, title, year, museum, and an A2 sentence with its
Russian translation. Check facts in the sentences; they double as KNM material.

## Progress

Progress is per device: `localStorage` key `ww-v1`, mirrored to IndexedDB as a backup.
There is no server. Don't change the stored shape without migrating old data.
