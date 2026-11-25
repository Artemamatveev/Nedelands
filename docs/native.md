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
`/api/handoff` flow; no purchases, prices or offers inside the apps (Plus, passes and groups from the website still
work; the user's choice, 23 November 2026: no In-App Purchase for now, perhaps later with Apple's 15% Small Business
rate if many learners come through the app), and no way to them either (Apple 3.1.1): no "Naar de website" row, the FAQ says only that practice is free
(no Plus sentence, no subscription question), the out-of-checks message doesn't name Plus, and `index.html` counts the
app as installed, so the "← Bittertalen" links of /over, /privacy and /contact lead back to practice, never to the
homepage's prices. The web view runs under the status bar, so the page adds a frosted strip there (`#sbar`,
`data-native` on `<html>`). On the iPhone app Apple login is Apple's own sheet (Face ID), not the browser:
`appleNative()` (plugin `@capacitor-community/apple-sign-in`, entitlement in `App.entitlements`) sends the ID token with a
nonce to `signInWithIdToken` (client ID `nl.bittertalen.app`); builds without the plugin keep the browser. The native
launch image stays until the page's own Bittie has loaded (`@capacitor/splash-screen`, hidden by the inline script after
`#app-loading`, at most 3 s), so no white screen between them. Profiel shows "Dagelijkse herinnering" (`remindRow()`, local notifications, `ww-remind`). Keep these when changing
login, Plus or Profiel. `native/` is not deployed as part of the site (`.vercelignore`). The iOS project
(`native/ios`, committed) is signed with the user's Individual team `GW742K94US`, bundle ID `nl.bittertalen.app`; the app
"Bittertalen" exists in App Store Connect and build 1.0 (1) went to TestFlight on 23 November 2026, 1.0 (2) (Apple sheet, launch image) the same evening, 1.0 (3) (native haptics:
`BittertalenHapticsPlugin` in `SceneDelegate.swift`, which `buzz()` uses in the app) on 24 November.
