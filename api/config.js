// What the page needs for accounts: GET /api/config -> {url, anon, login:["google","apple","email","passkey"], limit}
// or {} when accounts are not set up. The anon key is public by design (row level security protects the data).
// Google and Apple show when they are switched on in Supabase (Authentication → Sign In / Providers);
// the e-mail code only with LOGIN_EMAIL=1, because Supabase's own mail reaches only the project's team
// (real users need custom SMTP); passkeys (still experimental in Supabase) only with LOGIN_PASSKEY=1.
import { accounts, supaUrl, anonKey, LIMIT } from "./_supa.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  if (!accounts) return res.status(200).json({});
  let ext = {};
  try {
    const r = await fetch(`${supaUrl}/auth/v1/settings`, { headers: { apikey: anonKey } });
    if (r.ok) ext = (await r.json()).external || {};
  } catch {}
  const login = ["google", "apple"].filter((p) => ext[p]);
  if (process.env.LOGIN_EMAIL === "1" && ext.email !== false) login.push("email");
  if (process.env.LOGIN_PASSKEY === "1") login.push("passkey");
  return res.status(200).json({ url: supaUrl, anon: anonKey, login, limit: LIMIT });
}
