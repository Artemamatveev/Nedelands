# App Store and Google Play: listing, review and what is still open (25 November 2026)

## Listing (ASO)

The home-screen name stays **Bittertalen** (`CFBundleDisplayName`). The store name and subtitle carry the search words,
as the competitors do ("Inburgering: DUO & NT2 examen", "Swipelijk: Inburgering Exam A2", "Tulp: Inburgering & KNM Prep").

| Field | Dutch (main) | English |
| --- | --- | --- |
| Name (30) | Bittertalen: Inburgering A2 KNM | Bittertalen: Dutch exam A2 KNM |
| Subtitle (30) | Proefexamen A2, KNM en NT2 B1 | Inburgering & NT2 B1 practice |
| Keywords (100, App Store) | inburgering,inburgeringsexamen,knm,nt2,staatsexamen,b1,a2,nederlands,naturalisatie,examen,oefenen | inburgering,dutch,exam,knm,nt2,a2,b1,citizenship,netherlands,naturalisation |
| Short description (80, Play) | Oefen gratis voor inburgering A2, KNM en Staatsexamen B1. AI kijkt je tekst na. | Free practice for the Dutch inburgering exam A2, KNM and NT2 B1, with AI feedback. |

Screenshots (6.9" and 6.5" iPhone, Play phone): a sentence of benefit on each, not a feature name.
1. "Je tekst nagekeken, met je fouten en waarom" (a graded Schrijven task with mistakes and why).
2. "Elke dag een les tot je examen" (Mijn dag with the countdown).
3. "Proefexamens met een timer" (Examen tab).
4. "400+ KNM-vragen met uitleg" (a KNM question after answering).
5. "Praat met Bittie" (a conversation with a fix).
6. "Menu in 8 talen" (Profiel in Arabic).

Never on a screenshot or in the text: a price, an offer, "koop", "abonnement" (Apple 3.1.1 while there is no in-app purchase), and never "DUO" as a word that suggests a link (5.2.1, Play impersonation). The description says once: "Bittertalen is niet van DUO."

## Review notes (App Store Connect → App Review Information)

- Demo account: make one with Plus via a group (`/admin` → group with one seat), so the reviewer sees grading.
- "Bittertalen works offline (open it in flight mode after one visit); speech recognition is iOS's own
  (SFSpeechRecognizer via the speech-recognition plugin, Apple's servers); a daily reminder is set in Profiel; Sign in with Apple is offered;
  accounts are deleted in Profiel → Account verwijderen. Before the first text goes to Anthropic the app asks for
  consent (guideline 5.1.2(i))."
- Native features to name against 4.2: offline start, the system's speech recognition, local notifications planned per day
  with the days until the exam, haptics, Sign in with Apple.

## Still open before submitting (needs the owner)

1. **Buying inside the app (Apple 3.1.1 / 3.1.3(b)).** Chosen 28 November 2026: In-App Purchase through RevenueCat
   (`docs/native.md` "Purchases in the apps", `docs/server.md`). Still to do by the owner: App Store Connect → Agreements
   (Paid Apps), the Small Business Program, the six products and a subscription group; Play Console → payments profile
   and the six products; a RevenueCat project with both apps, the webhook and the keys in Vercel (`REVENUECAT_SECRET`,
   `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_IOS_KEY`, `REVENUECAT_ANDROID_KEY`); run the `store_plus` migration; a new build
   with the plugin. The review note: purchases are In-App Purchase; Plus bought on the website also unlocks the app (3.1.3(b)).
2. **Android.** `cd native && npm install && npx cap add android && npx cap sync`, then target SDK 36, permissions
   `RECORD_AUDIO` and `POST_NOTIFICATIONS`, a monochrome notification icon. A new personal Play account needs a closed test
   with 12 testers for 14 days in a row: start it as soon as the build runs. Data safety: e-mail, user content (texts and
   transcripts go to Anthropic and, on Android, speech to Google), app interactions; no ads, no tracking.
3. **Speech plugin.** `native/package.json` now lists `@capacitor-community/speech-recognition`; run `npm install` and
   `npx cap sync` in `native/`, check that the plugin version supports Capacitor 8, and test Spreken and Gesprekken on a
   real iPhone and Android phone (the page falls back to the web API when the plugin is missing).
4. **Privacy manifest.** `native/ios/App/App/PrivacyInfo.xcprivacy` is in the Xcode project (Copy Bundle Resources);
   the App Store privacy labels must say the same.
5. **Account deletion for Google Play** needs a web address too: privacy.html's "Account verwijderen" section or a page
   that explains Profiel → Account verwijderen and offers hallo@bittertalen.nl.
6. **Seller details (EU DSA trader status).** The name and address in App Store Connect and Play Console are shown
   publicly; use the KvK details once registered. An organisation account needs a D-U-N-S number (1–4 weeks).

## Age rating and AI content (26 November 2026)

- App Store age rating questionnaire: answer that the app has an AI chatbot (unrestricted conversation with AI characters)
  and set **16+**, as privacy.html says the app is for people of 16 and older. Google Play IARC: declare AI interaction.
- Google Play AI-generated content policy: every AI character's answer has **Meld** (report) in Gesprekken; the answer
  and the character go to the server log (`ai_report` in Vercel's logs, api/event.js). Read them weekly.
- Privacy labels (App Store Connect) and Data safety (Play) say the same as `PrivacyInfo.xcprivacy`: e-mail and name,
  user content (texts, Bittie's memory; linked), audio (transcribed, not kept), purchase history, product interaction
  (anonymous counts, not linked), crash data (error messages, not linked). Third parties: Anthropic (AI), Google
  (voices; on Android also speech recognition), Stripe (payments, website only), Supabase and Vercel (hosting, EU).
