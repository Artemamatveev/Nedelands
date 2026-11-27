# Homepage, public pages, languages, deploy and search
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

## Homepage and public pages
Bittertalen (a pun on bitterballen: "bitter languages", self-irony about learning Dutch) is a single-page study app for the Dutch A2 integration exam (inburgeringsexamen).
The homepage says “Word thuis in Nederland”, with free A2 and B1 exam preparation in the subtitle and separate buttons for each level. The level cards, KNM
question and writing feedback example come before the sections on features and culture. The example explains the spelling
score, shows a new sentence on the same rule and opens the corresponding A2 exercise. The FAQ keeps the naturalisation
information. Never promise a passport, a pass or that B1 is required for naturalisation.
The public homepage is `index.html` (`landing.js` translates it: every `data-t` text and `data-alt` alt text needs all
eight translations in `copy`, which `tests/site.test.mjs` checks) and reads Plus pricing from `/api/config`. Its main
button, "Begin met oefenen" in the bar (`#enter`), opens `/oefenen?open=today`; the hero has the heading, one paragraph, the install button with the Apple logo and the app in a phone (the A2/B1 buttons, the Schrijven link and the "Gratis en zonder account" note were taken out at the user's wish, 27 November 2026; the levels are in "Niveaus" below). Pricing links focus the selected offer in the app. On a phone (≤640 px) the price cards are one swipeable row (CSS scroll snap, the next card peeking in at the edge; the user's wish, 27 November 2026). The download button uses the browser install
prompt when available, otherwise links to #install-app with instructions for iOS, Android and desktop (November 2026). The bar: the name (30 px, 28 on a phone), the page's links, the language, Inloggen and the main button;
on a phone two straight rows, the name with the button, then the links with the language and Inloggen (two wrapping flex
rows: a grid tied the second row to the button's width; the type follows the screen's width and the narrowest phones leave
out the middle link; the browser test measures it in the longest languages). The exam card's details (`#module-exam`, 27 November 2026, at the user's wish) are an infographic: six tiles in one
style (`.exam-facts`, id `niveaus` for the Niveaus link): A2 · B1 with the two level buttons, 6000+ questions, 5 timed
proefexamens (one per exam part, new questions each time), 400+ KNM questions, 30+ conversations and one lesson a day.
Under "Probeer het zelf" one example per exam part in `details`: Lezen and Luisteren (a real question; Luisteren plays
its recorded fragment) and KNM are marked on the page like in the app by one script for every `.quiz` (`data-why` holds
the explanation); Schrijven and Spreken show the check as in the app (made-up answers, the page says so; Spreken says
that pronunciation and pace are not judged). The former four learning-feature cards and "Oefen voor je examen" are gone.
