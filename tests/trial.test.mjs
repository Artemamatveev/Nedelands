import test from 'node:test';
import assert from 'node:assert/strict';

// A new account's free days of Plus (api/_supa.js trialOf, 28 November 2026): B1 (so A2 too) for TRIAL_DAYS from the
// account's creation, counted over the whole trial with TRIAL_TOTAL checks; anything paid or a group comes first.
Object.assign(process.env,{SUPABASE_URL:'https://x.supabase.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc',
  STRIPE_SECRET_KEY:'sk_test_x',STRIPE_PRICE:'price_1',STRIPE_PRICE_B1:'price_b1',STRIPE_WEBHOOK_SECRET:'whsec_test'});
const DAY=864e5;let created=new Date().toISOString(),groups=[];
globalThis.fetch=async(url,init={})=>{url=String(url);
  const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
  if(url.endsWith('/auth/v1/user'))return J({id:'u1',email:'a@b.nl',created_at:created});
  if(url.includes('/auth/v1/settings'))return J({external:{}});
  if(url.includes('/rest/v1/plus?user_id'))return J([]);
  if(url.includes('/rest/v1/exam_pass?user_id'))return J([]);
  if(url.endsWith('/rest/v1/rpc/group_access'))return J(groups);
  return J([]);
};
const {trialOf,plusFor,coversLevel,TRIAL_DAYS,TRIAL_TOTAL}=await import('../api/_supa.js');
const plus=(await import('../api/plus.js')).default,config=(await import('../api/config.js')).default;
const res=()=>({statusCode:200,headers:{},status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(k,v){this.headers[k]=v}});
const H={host:'bittertalen.nl',origin:'https://bittertalen.nl',authorization:'Bearer t'};

test('Seven days from the account\'s creation, then nothing', ()=>{
  assert.equal(TRIAL_DAYS,7);assert.equal(TRIAL_TOTAL,30);
  const now=Date.now(),t=trialOf({created_at:new Date(now-2*DAY).toISOString()},now);
  assert.equal(t.level,'B1');assert.equal(t.trial,true);assert.equal(t.pass,true,'counted over its whole term');
  assert.equal(Date.parse(t.until),Date.parse(new Date(now-2*DAY).toISOString())+7*DAY);
  assert.equal(trialOf({created_at:new Date(now-8*DAY).toISOString()},now),null);
  assert.equal(trialOf({},now),null);
});

test('plusFor gives the trial only with the user, after anything paid or a group', async()=>{
  created=new Date(Date.now()-DAY).toISOString();
  assert.equal(await plusFor('u1'),null,'without the user there is no trial');
  const p=await plusFor('u1',false,{id:'u1',created_at:created});
  assert.ok(coversLevel(p,'B1'));assert.equal(p.trial,true);
  groups=[{name:'Taalschool',level:'A2',until:'2099-01-01'}];
  const g=await plusFor('u1',false,{id:'u1',created_at:created});
  assert.equal(g.group,'Taalschool');assert.equal(g.trial,undefined,'a group is not replaced');groups=[];
  const r=res();await plus({method:'GET',headers:H},r);
  assert.equal(r.body.plus.trial,true);assert.equal(r.body.plus.level,'B1');
});

test('Config tells the pages about the trial; check and talk count it like free checks', async()=>{
  const r=res();await config({method:'GET',headers:H},r);
  assert.deepEqual(r.body.plus.trial,{days:7,total:30});
  const fs=await import('node:fs');
  const check=fs.readFileSync(new URL('../api/check.js',import.meta.url),'utf8'),talk=fs.readFileSync(new URL('../api/_talk.js',import.meta.url),'utf8');
  assert.match(check,/plusFor\(uid, true, user\)/);assert.match(check,/plus && !plan\?\.trial \|\| who \? 0 : await useTotal/);
  assert.match(check,/plan\.trial \? TRIAL_TOTAL/);assert.match(check,/plan\.trial \? TRIAL_OPUS/);
  assert.match(talk,/plusFor\(user\.id, true, user\)/);assert.match(talk,/plan\.trial \? TRIAL_TOTAL/);
});
