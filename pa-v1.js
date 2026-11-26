// Plausible Analytics (plausible.io: an EU company, data in Germany, no cookies, nothing stored on the device, no
// personal data): page views, where visitors come from and the funnel events that track() in oefenen.html and
// landing.js also send. PA is the site's script id from Plausible's Site Installation (the <id> of "pa-<id>.js"); empty
// means off. Never with Global Privacy Control or Do Not Track, never on other hosts (the old vercel.app addresses, previews).
(function () {
  var PA = "";
  if (!PA || navigator.globalPrivacyControl || navigator.doNotTrack === "1" || !/(^|\.)bittertalen\.nl$/.test(location.hostname)) return;
  window.plausible = window.plausible || function () { (plausible.q = plausible.q || []).push(arguments) };
  plausible.init = plausible.init || function (o) { plausible.o = o || {} };
  plausible.init();
  var s = document.createElement("script");
  s.async = true; s.src = "https://plausible.io/js/pa-" + PA + ".js";
  document.head.appendChild(s);
})();
