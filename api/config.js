// What the page needs for accounts: GET /api/config -> {url, anon, login:["google","apple","azure","facebook","email","passkey"], limit, free}
// (free: checks a day without an account, see FREE in _supa.js; plus: Bittertalen Plus when Stripe is set up,
// {month, year, trial, b1?: {month, year}}: the prices in cents from Stripe and the free days; b1 when B1 has its own)
// or {} when accounts are not set up. The anon key is public by design (row level security protects the data).
// Google, Apple, Microsoft (azure) and Facebook show when they are switched on in Supabase (Authentication → Sign In / Providers);
// the e-mail code only with LOGIN_EMAIL=1, because Supabase's own mail reaches only the project's team
// (real users need custom SMTP); passkeys (still experimental in Supabase) only with LOGIN_PASSKEY=1.
import { accounts, supaUrl, anonKey, LIMIT, FREE } from "./_supa.js";
import { pay, b1Priced, stripe, PRICES, TRIAL_DAYS } from "./_stripe.js";

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
  let plus;
  if (pay) {
    try {
      const ids = [PRICES.month, PRICES.year, ...(b1Priced ? [PRICES.b1month, PRICES.b1year] : [])];
      const [m, y, bm, by] = await Promise.all(ids.map((id) => stripe(`prices/${id}`)));
      plus = { month: m.unit_amount, year: y.unit_amount, trial: TRIAL_DAYS, ...(bm ? { b1: { month: bm.unit_amount, year: by.unit_amount } } : {}) };
    } catch {}
  }
  return res.status(200).json({ url: supaUrl, anon: anonKey, login, limit: LIMIT, free: FREE, ...(plus ? { plus } : {}) });
}
