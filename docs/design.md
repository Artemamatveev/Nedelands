# Design
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

## Design: Delfts blauw

The design should also teach Dutch culture. Keep it recognisably Dutch and avoid the
generic "AI app" look.

- **Colours**: tin-glaze white `--bg`, cobalt `--blue`, light wash `--wash`, and
  `--oranje` as the only accent (timer, selection, the bitterbal lens in the tab bar). Filled cobalt surfaces (`.btn`, the icon squares,
  chosen word tokens, photo numbers) use `--fill` with `--on-fill` text: in dark mode that stays a deep
  cobalt (`#2A4AAE`) with white text (7.8:1), because the light `--blue` read as a highlight rather than the main action.
  Dark mode is Delft at night: a blue-black page (`#0A0F1B`) with tiles a clear step lighter (`#131A2A`), so they don't
  melt into the page. A neutral graphite with a brighter blue button was tried and looked like a stock UI kit.
  Always use the tokens on `:root`; every colour has a dark-mode value.
- **Glass and tiles**: the page background is a Dutch landscape faintly seen through a frosted window: Ruisdael's
  windmill, pre-blurred in `art/molen-glass.jpg` (`body::before`), under a half-transparent wash (`--glass`). The content sits on plain white tiles with a soft shadow (`.tile`, `--card`, `--lift`), not
  ceramic Delft tiles: on the home tabs one per block (today's lesson, Naar het examen, Examenonderdelen, Grammatica en woorden, Lezen
  luisteren en spreken, Herhalen), and every inner screen is one tile. The museum label sits on the glass.
- **Type**: the system font only (`-apple-system, system-ui`: SF Pro on iPhone), so the
  app reads like a native iPhone app. No web fonts; headings semibold (600–700), never 800.
  No handwriting or decorative fonts.
- **The login window's look, everywhere** (the user liked its type and colours): headings in `--ink`, semibold (600),
  no diamond; small labels (`h3.lh`, `.ask`) in cobalt (`--blue`), sentence case, 15 px, never small capitals; cobalt only on the main action (`.btn`) and
  in icons; secondary buttons (`.ghost`, `.back`) are neutral: 1px `--line` border, `--ink` text; chevrons › in
  `--soft`; fields have a 1.5px `--ink` border, 52px high; the level switch (`.seg`) is a grey track with a white
  thumb, like iOS.
- **Type**: one scale, the iOS text styles, as tokens on `:root`: `--fs-xs` 12 (tab names), `--fs-s` 13 (small capitals
  labels, meta), `--fs-m` 15 (descriptions, notes, field labels, small buttons), `--fs-b` 17 (body, list titles,
  buttons, fields, documents), `--fs-l` 20 (options, long questions, feedback), `--fs-xl` 22 (h2), `--fs-xxl` 28 (today's
  lesson). Only display sizes stay their own (the logo, the big word 44, the score 72, the streak ribbon, the reader). Weights
  600, 700 only for the logo, the big word and the score. Headings a little tighter (-.01em to -.02em).
- **Shapes** ("Examenblad", the user's choice in November 2026, from four designs: it looks like the exam form and not
  generated): tiles and inner screens keep round corners (`--r` 20px; the login window 24px), everything inside is nearly
  square: `--rc` 4px for controls (buttons, fields, options, the level switch, documents, photos, icon squares), `--rs`
  3px for small things (letter boxes, word tokens, the timer); bars are pills, the feedback sheet has round top corners. Use the tokens, not new numbers. Solid 1px
  separators, flat buttons. The floating tab bar is a glass pill (like iOS 26 and Instagram); the login window
  (`#welcome`) is a card like Yandex ID (24px).
- **Logo**: the name "Bittertalen" in the system font, with a bitterbal (`--oranje`, light crumbs) as the dot on
  the i, the size and place of a normal dot (`h1 .idot`). The app icon is Bittie, the waving plush bitterbal
  in a Dutch scarf: `icon-1024.png` is the source; `manifest.json` lists 192 and 512 px versions and a maskable one (the picture inside the safe circle), and
  the pages use `favicon-32.png`. Make them again from the source when the icon changes.
- **Dutch motifs instead of decoration**:
  - Header: the painting of the day (`ART` + `paint()` in `oefenen.html`), with a museum
    label underneath: artist, title, year, museum and one A2 sentence in Dutch (no
    translation), all in one size (15px, no italics). The full painting and the label are on the Vandaag tab; the
    other tabs and inner screens get the narrow strip (`main.big` is only set on Vandaag), on a phone softened (blurred),
    so the crop never shows half a face. On a phone the language in the header is only a white globe on the painting, no pill (the
    cobalt pill weighed on the painting and crowded the logo): top left above the logo, the same on every tab and inner
    screen (the user's wish; a place on the right of the strip was tried); on the login card the same globe in ink.
    Profiel has a "Taal" row as well. Tapping the painting on a
    home tab opens its story (`story()`); on inner screens it shows the painting in full.
  - Streak: a ribbon in the Dutch flag (rood, wit, blauw, horizontal like the flag: `#AE1C28`, white, `#21468B`)
    hanging from the top of the painting, the number on the white band and "dagen op rij" under it (`.streak .lint`).
    The user chose it from 16 designs (a round stamp, glass pills, an enamel house number, turfjes, a spaarkaart…).
- **Never use**: cream or beige backgrounds, handwriting fonts, wobbly hand-drawn (uneven)
  border-radius, dashed lines, highlighter underlines under headings, decorative SVG
  squiggles, emoji as decoration.
