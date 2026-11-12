// Explicit, one-time Vercel build command for the reviewed migration; never a public HTTP endpoint.
// Uses the project's existing database connection inside Vercel. No credential is printed or exported.
import fs from 'node:fs';
import crypto from 'node:crypto';
import pg from 'pg';

const ref = 'bleeegmutxepidfkabgs';
const version = '20261112192552_weekly_free_checks';
let client, phase = 'target';
try {
  if (process.env.VERCEL !== '1' || !process.argv.includes('--apply') || !process.argv.includes(`--project=${ref}`)) throw Error('explicit_target_required');
  if (new URL(process.env.SUPABASE_URL).hostname !== `${ref}.supabase.co`) throw Error('project_mismatch');
  const url = new URL(process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING);
  if (url.hostname !== `db.${ref}.supabase.co` && !decodeURIComponent(url.username).endsWith('.' + ref)) throw Error('database_mismatch');
  client = new pg.Client({
    host: url.hostname, port: Number(url.port || 5432), user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password), database: decodeURIComponent(url.pathname.slice(1)),
    ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15000, query_timeout: 30000,
    application_name: 'bittertalen-weekly-allowance-migration'
  });
  phase = 'connect'; await client.connect();
  phase = 'inspect';
  const before = await client.query(`select table_name, column_name from information_schema.columns
    where table_schema='public' and table_name in ('check_usage','plus')`);
  if (!before.rows.some(r => r.table_name === 'check_usage' && r.column_name === 'day') ||
      !before.rows.some(r => r.table_name === 'plus' && r.column_name === 'user_id')) throw Error('unexpected_schema');
  const sql = fs.readFileSync(new URL(`../supabase/migrations/${version}.sql`, import.meta.url), 'utf8');
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  await client.query('begin');
  await client.query(`select pg_advisory_xact_lock(hashtext('bittertalen-weekly-allowance'))`);
  await client.query(`create schema if not exists private;
    create table if not exists private.bittertalen_migrations(version text primary key, checksum text not null, applied_at timestamptz not null default now());
    alter table private.bittertalen_migrations enable row level security;
    revoke all on private.bittertalen_migrations from public, anon, authenticated, service_role;`);
  const prior = await client.query('select checksum from private.bittertalen_migrations where version=$1', [version]);
  if (prior.rows.length && prior.rows[0].checksum !== checksum) throw Error('migration_checksum_mismatch');
  phase = 'migration'; if (!prior.rows.length) await client.query(sql);
  phase = 'verification';
  await client.query('savepoint quota_verification');
  await client.query(fs.readFileSync(new URL('../supabase/verify-weekly-checks.sql', import.meta.url), 'utf8'));
  await client.query('rollback to savepoint quota_verification');
  if (!prior.rows.length) await client.query('insert into private.bittertalen_migrations(version,checksum) values($1,$2)', [version,checksum]);
  phase = 'commit'; await client.query('commit');
  console.log(JSON.stringify({event:'weekly_allowance_migration',project:ref,version,action:prior.rows.length?'verified':'applied',verified:true}));
} catch (error) {
  if (client) await client.query('rollback').catch(() => {});
  console.error(JSON.stringify({event:'weekly_allowance_migration_failed',phase,code:error.code||'migration_failed'}));
  process.exitCode = 1;
} finally { if (client) await client.end().catch(() => {}); }
