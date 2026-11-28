// What the page needs for accounts: GET /api/config -> {url, anon, login:["google","apple","azure","facebook","email","passkey"], limit, free, plus?}
// (limit: free account checks in all; free: one-time browser trial; Plus keeps daily checks;
// events: the anonymous usage counts are on, see api/event.js; pron: Zeg het na scores pronunciation, api/_pron.js)
// or {} when accounts are not set up. The anon key is public by design (row level security protects the data).
// Google, Apple, Microsoft (azure) and Facebook show when they are switched on in Supabase (Authentication → Sign In / Providers);
// the e-mail code only with LOGIN_EMAIL=1, because Supabase's own mail reaches only the project's team
// (real users need custom SMTP); passkeys (still experimental in Supabase) only with LOGIN_PASSKEY=1.
import { accounts, supaUrl, anonKey, LIMIT, FREE, plusOn, PLUS, PLUS_MONTH, TALK_PLUS, PLUS_PRICE, PLANS, passOn, PASSES, PASS_TOTAL, PASS_DAYS, yearOn, YEARS, YEAR_DAYS, YEAR_TOTAL } from "./_supa.js";
import { eventsOn } from "./event.js";
import { pronOn, PRON_DAY, PRON_SECONDS, FREE_SECONDS, STT_DAY } from "./_pron.js";
import { sayOn } from "./_say.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  if (!accounts) return res.status(200).json({});
  let ext = {};
  try {
    const r = await fetch(`${supaUrl}/auth/v1/settings`, { headers: { apikey: anonKey } });
    if (r.ok) ext = (await r.json()).external || {};
  } catch {}
  const login = ["google", "apple", "azure", "facebook"].filter((p) => ext[p]); // azure = Microsoft
  if (process.env.LOGIN_EMAIL === "1" && ext.email !== false) login.push("email");
  if (process.env.LOGIN_PASSKEY === "1") login.push("passkey");
  return res.status(200).json({
    url: supaUrl, anon: anonKey, login, limit: LIMIT, period: "once", free: FREE, freePeriod: "once",
    ...(plusOn ? { plus: { limit: PLUS, month: PLUS_MONTH, talk: TALK_PLUS, price: PLUS_PRICE, plans: Object.fromEntries(Object.entries(PLANS).map(([level, p]) => [level, { price: p.price }])) } } : {}),
    // the Examenpas: one payment for PASS_DAYS of Plus at that level, only when its prices are configured
    ...(passOn ? { pass: { days: PASS_DAYS, total: PASS_TOTAL, plans: Object.fromEntries(Object.entries(PASSES).map(([level, p]) => [level, { price: p.price }])) } } : {}),
    // the Jaarpas: the same for YEAR_DAYS, only when its prices are configured
    ...(yearOn ? { year: { days: YEAR_DAYS, total: YEAR_TOTAL, plans: Object.fromEntries(Object.entries(YEARS).map(([level, p]) => [level, { price: p.price }])) } } : {}),
    ...(eventsOn() ? { events: 1 } : {}),
    // Azure Speech (api/_pron.js): Zeg het na and Spreken practice; day takes a day, seconds of audio for Zeg het na, free for an answer
    ...(pronOn ? { pron: { day: PRON_DAY, seconds: PRON_SECONDS, free: FREE_SECONDS, stt: STT_DAY } } : {}),
    // Azure says the lines the app has no recording of (api/_say.js), so the phone's voice is only a fallback
    ...(sayOn ? { say: 1 } : {}),
  });
}
