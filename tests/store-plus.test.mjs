import test from 'node:test';
import assert from 'node:assert/strict';

// Store purchases end to end against a fake Supabase, Stripe and RevenueCat: the webhook (/api/store → /api/stripe?src=rc),
// POST /api/plus {go:"store"} after buying in the app, plusFor()'s choice and what /api/config tells the app.
Object.assign(process.env,{SUPABASE_URL:'https://x.supabase.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc',
  STRIPE_SECRET_KEY:'sk_test_x',STRIPE_PRICE:'price_1',STRIPE_PRICE_B1:'price_b1',STRIPE_WEBHOOK_SECRET:'whsec_test',
  REVENUECAT_SECRET:'sk_rc_test',REVENUECAT_WEBHOOK_AUTH:'Bearer rc-hook-test',REVENUECAT_IOS_KEY:'appl_public_test',REVENUECAT_ANDROID_KEY:'goog_public_test'});
const UID='0b6f2a4e-1c3d-4e5f-8a9b-0c1d2e3f4a5b',DAY=864e5;
const db={plus:null,store:null,rc:{}},calls=[];
globalThis.fetch=async(url,init={})=>{
  url=String(url);const m=init.method||'GET';calls.push(`${m} ${url}`);
  const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
  if(url.endsWith('/auth/v1/user'))return J({id:UID,email:'a@b.nl'});
  if(url.includes('/auth/v1/settings'))return J({external:{}});
  if(url.includes('/rest/v1/plus?user_id'))return J(db.plus?[db.plus]:[]);
  if(url.includes('/rest/v1/store_plus?user_id')&&m==='DELETE'){db.store=null;return new Response(null,{status:204})}
  if(url.includes('/rest/v1/store_plus?user_id'))return J(db.store?[db.store]:[]);
  if(url.endsWith('/rest/v1/store_plus')&&m==='POST'){db.store=JSON.parse(init.body);return new Response(null,{status:201})}
  if(url.endsWith('/rest/v1/rpc/group_access'))return J([]);
  if(url.endsWith('/rest/v1/rpc/use_guard'))return J(1);
  if(url.startsWith('https://api.revenuecat.com/v1/subscribers/')){
    if(init.headers?.authorization!=='Bearer sk_rc_test')return J({},401);
    return J({subscriber:db.rc})}
  return J({error:{code:'unknown'}},404);
};
const res=()=>({statusCode:200,headers:{},status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(k,v){this.headers[k]=v}});
const H={host:'bittertalen.nl',origin:'https://bittertalen.nl',authorization:'Bearer t'};
const plus=(await import('../api/plus.js')).default,hook=(await import('../api/stripe.js')).default,config=(await import('../api/config.js')).default;
const {plusFor,coversLevel}=await import('../api/_supa.js');
const send=async(body,auth='Bearer rc-hook-test')=>{const raw=JSON.stringify(body),r=res();
  await hook({method:'POST',query:{src:'rc'},headers:{authorization:auth},body:raw},r);return r};

test('Config gives the app RevenueCat\'s public keys and the product identifiers, never the secret',async()=>{
  const r=res();await config({method:'GET',headers:H},r);
  assert.equal(r.body.store.ios,'appl_public_test');assert.equal(r.body.store.android,'goog_public_test');
  assert.deepEqual(r.body.store.products.map(p=>p.id),['plus_a2','plus_b1','pass_a2','pass_b1','year_a2','year_b1']);
  assert.ok(!JSON.stringify(r.body).includes('sk_rc_test'));
});

test('A purchase in the app gives Plus at once through go:"store", and the webhook keeps it up to date',async()=>{
  db.rc={subscriptions:{plus_b1:{expires_date:new Date(Date.now()+30*DAY).toISOString(),store:'app_store'}}};
  const r=res();await plus({method:'POST',headers:H,body:{go:'store'}},r);
  assert.equal(r.statusCode,200);assert.equal(r.body.plus.level,'B1');assert.equal(r.body.plus.store,'app_store');assert.equal(r.body.plus.pass,undefined);
  assert.ok(coversLevel(await plusFor(UID),'B1'));
  // refunded: RevenueCat's record says so, the webhook removes the access
  db.rc={subscriptions:{plus_b1:{expires_date:new Date(Date.now()+30*DAY).toISOString(),refunded_at:new Date().toISOString(),store:'app_store'}}};
  assert.equal((await send({event:{type:'CANCELLATION',app_user_id:UID}},'Bearer nope')).statusCode,401);
  assert.ok(db.store,'an unauthorized call changes nothing');
  assert.equal((await send({event:{type:'CANCELLATION',app_user_id:UID}})).statusCode,200);
  assert.equal(db.store,null);assert.equal(await plusFor(UID),null);
});

test('A store pass shows as an Examenpas of 119 days, with the store it came from',async()=>{
  db.rc={non_subscriptions:{pass_a2:[{purchase_date:new Date().toISOString(),store:'play_store'}]}};
  await send({event:{type:'NON_RENEWING_PURCHASE',app_user_id:UID}});
  const g=res();await plus({method:'GET',headers:H},g);
  assert.equal(g.body.plus.level,'A2');assert.equal(g.body.plus.pass,true);assert.equal(g.body.plus.store,'play_store');
  assert.ok(Math.abs(Date.parse(g.body.plus.until)-(Date.now()+119*DAY))<60e3);
});
