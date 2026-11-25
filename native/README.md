# Bittertalen in the App Store and Google Play

A Capacitor 8 shell around the website: it opens https://bittertalen.nl/oefenen, so every push to `main` reaches the
apps too (no new store release for content or fixes). Native parts: the daily reminder (local notifications), Apple's own login sheet
on iPhone, the launch image held until the page's Bittie is up, and the system browser for Google login. The page detects the app with `NATIVE` in `oefenen.html`.

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

The iOS project (`ios/`, Swift Package Manager, no CocoaPods) is committed and already set up: iPhone only, portrait,
iOS 15+, the icon from `../icon-1024.png`, a light and a dark launch image with Bittie (`art/bittie-loading-v1.webp` on
the app's `#FBFCFE` / `#1D2436`), the microphone and speech recognition texts that Spreken and Gesprekken need, and
`ITSAppUsesNonExemptEncryption` false (no export compliance question per upload). After `npm install` only
`npx cap sync ios` is needed. In Xcode: target App → Signing & Capabilities → Team, then Product → Archive →
Distribute App → App Store Connect. Raise `CURRENT_PROJECT_VERSION` (the build number) for every upload.

Android icons and splash: make them from `../icon-1024.png` with `npx @capacitor/assets generate --iconBackgroundColor '#EEF2FA'`
(put the source at `native/assets/icon.png` first). Android needs a white notification glyph `ic_stat_bittertalen` in
`android/app/src/main/res/drawable*`; without it Android shows a grey square.

## Before sending it to review

- Apple developer account ($99 a year) and Google Play console ($25 once), in the name that is on KVK.
- **Sign in with Apple** (Guideline 4.8, required next to Google): on since 23 November 2026, see CLAUDE.md (Accounts).
  Renew the Supabase client secret before 22 May 2027 with `node tools/apple-secret.mjs`.
- **Account deletion** is in Profiel (Account verwijderen): Apple requires it.
- Privacy labels (App Store) and Data safety (Google Play): the same as privacy.html. E-mail and name (account),
  progress and practice time (app functionality), the answers sent for checking (to Anthropic), no tracking, no ads.
- Review notes: give Apple a test account with a few free checks, and explain that the app has offline practice,
  a daily reminder and works without an account, so it is more than a website (Guideline 4.2).
- Age rating 4+, category Education.

## Updating

Offline works through the site's service worker, which iOS only allows for the App-Bound Domains in `Info.plist`
(`WKAppBoundDomains`, with `limitsNavigationsToAppBoundDomains` in `capacitor.config.json`): a site the app must show
inside itself goes on that list. The first start needs the internet; after that the app opens without it.

Content and code come from the website. A new store build is only needed for a new Capacitor version, a new
plugin, a change in the Swift code, icons, or a change in `capacitor.config.json`.
