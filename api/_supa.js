// Supabase from the server, by plain fetch (no SDK): who is calling, the daily check allowance, deleting an account.
// Files starting with _ are not routes on Vercel. The env vars come from the Supabase integration in the Vercel
// Marketplace; without them accounts are off and everything works as before (no login needed for grading).
const URL_ = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const ANON = (process.env.SUPABASE_ANON_KEY || "").trim();
const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

export const accounts = !!(URL_ && ANON && SERVICE);
export const supaUrl = URL_;
export const anonKey = ANON;
// Claude checks per person per day; a proefexamen costs more than one task (see checkCost)
export const LIMIT = Math.max(1, parseInt(process.env.CHECK_LIMIT, 10) || 20);
// One task is 1; a proefexamen Schrijven (4 tasks) 2, Spreken (16 answers) 6: roughly what they cost in tokens
export const checkCost = (tasks) => Math.max(1, Math.ceil(tasks / 3));

// The user behind "Authorization: Bearer <access token>", or null
export async function caller(req) {
  const m = String(req.headers.authorization || "").match(/^Bearer\s+(\S+)$/);
  if (!accounts || !m) return null;
  const r = await fetch(`${URL_}/auth/v1/user`, { headers: { apikey: ANON, authorization: `Bearer ${m[1]}` } });
  if (!r.ok) return null;
  const u = await r.json().catch(() => null);
  return u && u.id ? u : null;
}

// Takes `cost` checks from today's allowance (negative gives them back); returns what is left, -1 when not enough
export async function useChecks(uid, cost) {
  const r = await fetch(`${URL_}/rest/v1/rpc/use_checks`, {
    method: "POST",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}`, "content-type": "application/json" },
    body: JSON.stringify({ uid, cost, lim: LIMIT }),
  });
  if (!r.ok) throw new Error(`use_checks ${r.status}`);
  return Number(await r.json());
}

// Deletes the user; their progress and usage rows go with them (on delete cascade)
export async function deleteUser(uid) {
  const r = await fetch(`${URL_}/auth/v1/admin/users/${encodeURIComponent(uid)}`, {
    method: "DELETE",
    headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` },
  });
  return r.ok;
}

// Only this site's own pages may call the api
export const sameOrigin = (req) => {
  let host = "";
  try { host = new URL(req.headers.origin).host; } catch {}
  return host === req.headers.host;
};
