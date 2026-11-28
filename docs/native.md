# App Store and Google Play
Part of the project notes; CLAUDE.md is the short index. Keep these true when the code changes.

## App Store and Google Play (native/)

`native/` is a Capacitor 8 shell that loads https://bittertalen.nl/oefenen (`capacitor.config.json` `server.url`), so the
website deploy updates the apps. Offline: a web view only runs the site's service worker (`sw.js`) for App-Bound Domains,
so `WKAppBoundDomains` in `Info.plist` lists bittertalen.nl, www.bittertalen.nl, localhost (Capacitor's own pages, such
as `offline.html`) and www.youtube-nocookie.com (the video player), and `ios.limitsNavigationsToAppBoundDomains` is true
(since build 1.0 (4), 25 November 2026; before that the app needed the internet at every start). The web view then
can't open other sites itself (Capacitor sends them to Safari); a new host the page shows inside the app must be added
there too (at most 10). After the first start online the app opens offline, and Profiel's "Alles downloaden voor
offline" is shown in the app as well; `native/README.md` has the build and review steps (the user builds on a Mac). The page
knows it runs there by `NATIVE` (`Capacitor.isNativePlatform()`), which counts as an installed app (`inApp()`): OAuth
opens in the system browser (`skipBrowserRedirect`, `Capacitor.Plugins.Browser`) and comes back through the existing
`/api/handoff` flow; inside the apps only the store's own purchase (see "Purchases in the apps" below; Plus, passes and groups bought on the
website work too), and no way to the website's prices (Apple 3.1.1): no "Naar de website" row, the FAQ says only that practice is free
(no Plus sentence, no subscription question), the out-of-checks message doesn't name Plus, no offer banners
(`canOffer()`), and `index.html` counts the app as installed, so the "← Bittertalen" links of /over, /privacy and
/contact lead back to practice, never to the homepage's prices. The web view runs under the status bar, so the page adds a frosted strip there (`#sbar`,
`data-native` on `<html>`). On the iPhone app Apple login is Apple's own sheet (Face ID), not the browser:
`appleNative()` (plugin `@capacitor-community/apple-sign-in`, entitlement in `App.entitlements`) sends the ID token with a
nonce to `signInWithIdToken` (client ID `nl.bittertalen.app`); builds without the plugin keep the browser. The native
launch image stays until the page's own Bittie has loaded (`@capacitor/splash-screen`, hidden by the inline script after
`#app-loading`, at most 3 s), so no white screen between them. Profiel shows "Dagelijkse herinnering" (`remindRow()`, local notifications, `ww-remind`). Keep these when changing
login, Plus or Profiel. `native/` is not deployed as part of the site (`.vercelignore`). The iOS project
(`native/ios`, committed) is signed with the user's Individual team `GW742K94US`, bundle ID `nl.bittertalen.app`; the app
"Bittertalen" exists in App Store Connect and build 1.0 (1) went to TestFlight on 23 November 2026, 1.0 (2) (Apple sheet, launch image) the same evening, 1.0 (3) (native haptics:
`BittertalenHapticsPlugin` in `SceneDelegate.swift`, which `buzz()` uses in the app) on 24 November.

## Purchases in the apps (28 November 2026)

The user's choice: In-App Purchase through RevenueCat (free up to $2,500 tracked revenue a month, then 1%), with the same
products as the website, because Apple's 3.1.3(b) allows using a purchase from the website only when the same is also
sold in the app. Apple's Small Business Program and Google's subscription rate take 15%.

- Products, the same identifiers in App Store Connect, Play Console and RevenueCat: `plus_a2`, `plus_b1` (auto-renewing,
  monthly; one subscription group "Bittertalen Plus" in App Store Connect so A2 → B1 is an upgrade), `pass_a2`, `pass_b1`
  (Examenpas) and `year_a2`, `year_b1` (Jaarpas): non-renewing subscriptions in App Store Connect, one-time (consumable)
  products in Play Console. The server gives a pass its days itself (`PASS_DAYS`, `YEAR_DAYS`), so no entitlement
  durations are needed in RevenueCat.
- The page (`storeScreen()` in `oefenen.html`, reached from `plusScreen()` when `storeOK()`: the plugin `Purchases`
  is in the build and `/api/config` sends `store` with this platform's public key): `Purchases.configure` with the
  learner's account id (`appUserID`, so purchases follow the account, never an anonymous id; buying needs an account),
  the products and prices from the store (`getProducts`, `priceString`), `purchaseStoreProduct`, then
  `POST /api/plus {go:"store"}`, which reads RevenueCat's record at once (the webhook may come later). "Aankopen
  herstellen" (Apple requires it), "Abonnement beheren" opens the store's subscription page, the renewal text Apple asks
  for (3.1.2) and links to /voorwaarden and /privacy. One filled button: the recommended plan (the Examenpas of the
  learner's level). Builds without the plugin keep the screen without prices.
- The server: `api/_store.js` (see `docs/server.md`). Deleting the account asks RevenueCat to delete the customer; a store
  subscription can only be cancelled in the store, which the delete button says first.
- To do on the Mac: `npm install` in `native/` (check that `@revenuecat/purchases-capacitor` supports Capacitor 8),
  `npx cap sync`, the In-App Purchase capability in Xcode (Signing & Capabilities); Android adds the billing permission
  itself. Test with a sandbox account (iOS) and a licence tester (Play).
