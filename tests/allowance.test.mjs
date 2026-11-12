import test from 'node:test';
import assert from 'node:assert/strict';

Object.assign(process.env,{SUPABASE_URL:'https://quota.supabase.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'quota-test-only-secret'});
const calls=[];
globalThis.fetch=async (url,init={})=>{
  calls.push({url:String(url),body:init.body&&JSON.parse(init.body)});
  const data=String(url).endsWith('/auth/v1/user')?(init.headers.authorization==='Bearer valid'?{id:'account-1'}:null)
    :String(url).includes('check_day_usage?')?[{n:12}]
    :String(url).includes('check_week_usage?')?[{n:3}]:2;
  return new Response(JSON.stringify(data),{status:data==null?401:200});
};
const {visitor,useChecks,useFree,amsterdamDay,amsterdamWeek}=await import('../api/_supa.js');
const {default:allowance}=await import('../api/allowance.js');
const response=()=>({headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},status(n){this.statusCode=n;return this},json(body){this.body=body;return this}});

test('A signed trial identifier survives reload and IP changes; an invalid signature starts a distinct browser trial',()=>{
  const first=response(),id=visitor({headers:{}},first),cookie=first.headers['set-cookie'];
  assert.match(cookie,/HttpOnly; Secure; SameSite=Lax/);assert.match(cookie,/Max-Age=34560000/);
  assert.match(id,/^[0-9a-f]{64}$/);
  const again=response();
  assert.equal(visitor({headers:{cookie:cookie.split(';')[0],'x-real-ip':'203.0.113.9'}},again),id);
  assert.equal(again.headers['set-cookie'],undefined);
  const forged=response();assert.notEqual(visitor({headers:{cookie:cookie.split(';')[0].slice(0,-1)+'X'}},forged),id);
});

test('Reservation and refund carry the original week or day timestamp to Postgres',async()=>{
  const at='2026-10-25T22:59:59.000Z';
  calls.length=0;await useChecks('account-1',6,7,'week',at);await useChecks('account-1',-6,7,'week',at);
  assert.ok(calls.every(c=>c.url.endsWith('/rpc/use_plan_checks')&&c.body.window_kind==='week'&&c.body.checked_at===at));
  await useChecks('account-1',1,60,'day',at);assert.equal(calls.at(-1).body.window_kind,'day');
  await useFree('a'.repeat(64),1,at);await useFree('a'.repeat(64),-1,at);
  assert.ok(calls.slice(-2).every(c=>c.url.endsWith('/rpc/use_trial_checks')&&c.body.checked_at===at));
});

test('The Amsterdam weekly boundary follows local Monday, including DST changes',()=>{
  assert.equal(amsterdamWeek(new Date('2026-10-25T22:59:59Z')),'2026-10-19');
  assert.equal(amsterdamWeek(new Date('2026-10-25T23:00:00Z')),'2026-10-26');
  assert.equal(amsterdamDay(new Date('2026-03-29T22:00:00Z')),'2026-03-30');
  assert.equal(amsterdamWeek(new Date('2026-03-29T22:00:00Z')),'2026-03-30');
});

test('Personal allowance responses are not cached, authenticate the owner, and keep browser trials separate',async()=>{
  const own=response();await allowance({method:'GET',headers:{authorization:'Bearer valid'}},own);
  assert.equal(own.statusCode,200);assert.equal(own.headers['cache-control'],'no-store');
  assert.equal(own.body.dailyUsed,12);assert.equal(own.body.weeklyUsed,3);
  assert.equal(own.headers['set-cookie'],undefined);
  const bad=response();await allowance({method:'GET',headers:{authorization:'Bearer invalid'}},bad);
  assert.equal(bad.statusCode,401);assert.equal(bad.headers['set-cookie'],undefined);
  const guest=response();await allowance({method:'GET',headers:{}},guest);
  assert.deepEqual(guest.body,{free:2,period:'once'});assert.ok(guest.headers['set-cookie']);
  assert.equal(calls.at(-1).body.cost,0);
});
