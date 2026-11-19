# Bittertalen in the App Store and Google Play

A Capacitor 8 shell around the website: it opens https://bittertalen.nl/oefenen, so every push to `main` reaches the
apps too (no new store release for content or fixes). Native parts: the daily reminder (local notifications) and the
system browser for Google/Apple login. The page detects the app with `NATIVE` in `oefenen.html`.

## What the page does differently in the app

- Login with Google, Apple, Microsoft or Facebook opens in the system browser (Google refuses logins inside a web
  view). The browser leaves the one-time code at `/api/handoff` and the app takes it when it comes back (`claimHand`).
- No purchases and no prices: no Plus/Examenpas buttons or offers, Profiel hides Prijzen and Abonnement opzeggen.
  Plus, an Examenpas or a school group bought or given on the website still works after logging in (Apple 3.1.3(b),
  "multiplatform services"; Google Play's equivalent). Selling inside the apps would need Apple In-App Purchase /
  Google Play Billing (15% for small developers) or the EU link-out entitlement.
- Profiel shows "Dagelijkse herinnering" (Uit, 08:00, 12:00, 19:00, 21:00): one local notification a day, nothing on a server.

## Build (on a Mac)

Needs Node 22+, Xcode (iOS) and Android Studio (Android).

```sh
cd native
npm install
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios       # Xcode: set the team and signing, then Product → Archive
npx cap open android   # Android Studio: Build → Generate Signed App Bundle
```

Icons and splash: make them from `../icon-1024.png` with `npx @capacitor/assets generate --iconBackgroundColor '#EEF2FA'`
(put the source at `native/assets/icon.png` first). Android needs a white notification glyph `ic_stat_bittertalen` in
`android/app/src/main/res/drawable*`; without it Android shows a grey square.

## Before sending it to review

- Apple developer account ($99 a year) and Google Play console ($25 once), in the name that is on KVK.
- **Sign in with Apple**: Apple requires it when Google or Facebook login is offered (Guideline 4.8). Switch the
  Apple provider on in Supabase so the page shows it.
- **Account deletion** is in Profiel (Account verwijderen): Apple requires it.
- Privacy labels (App Store) and Data safety (Google Play): the same as privacy.html. E-mail and name (account),
  progress and practice time (app functionality), the answers sent for checking (to Anthropic), no tracking, no ads.
- Review notes: give Apple a test account with a few free checks, and explain that the app has offline practice,
  a daily reminder and works without an account, so it is more than a website (Guideline 4.2).
- Age rating 4+, category Education.

## Updating

Content and code come from the website. A new store build is only needed for a new Capacitor version, a new
plugin, icons, or a change in `capacitor.config.json`.
