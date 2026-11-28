// Purchases in the App Store and Google Play (api/_store.js): the server works out the access from RevenueCat's own
// record, the webhook is only a signal with the right authorization, and the access joins plusFor()'s choice.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const root=new URL('../',import.meta.url);

const UID='0b6f2a4e-1c3d-4e5f-8a9b-0c1d2e3f4a5b';
async function load(options={}){
  const rows=new Map(),fetches=[];
  const values={storeOn:options.off?false:true,PASS_DAYS:119,YEAR_DAYS:365,
    putStore:async r=>{rows.set(r.user_id,r);return true},dropStore:async uid=>{rows.delete(uid)}};
  const context=vm.createContext({process:{env:{REVENUECAT_SECRET:'sk_test-only',REVENUECAT_WEBHOOK_AUTH:'Bearer hook-test-only',...(options.env||{})}},
    Buffer,AbortSignal,console:{error(){}},URL,
    fetch:async(url,init)=>{fetches.push([url,init]);if(options.fail)return{ok:false,status:500};return{ok:true,json:async()=>({subscriber:options.subscriber||{}})}}});
  const supa=new vm.SyntheticModule(Object.keys(values),function(){for(const [k,v]of Object.entries(values))this.setExport(k,v)},{context});
  const crypto=await import('node:crypto');
  const nodeCrypto=new vm.SyntheticModule(['createHash','timingSafeEqual'],function(){this.setExport('createHash',crypto.createHash);this.setExport('timingSafeEqual',crypto.timingSafeEqual)},{context});
  const mod=new vm.SourceTextModule(fs.readFileSync(new URL('api/_store.js',root),'utf8'),{context});
  await mod.link(n=>n==='node:crypto'?nodeCrypto:supa);await mod.evaluate();
  const hook=async(body,auth)=>{const res={statusCode:200,status(n){this.statusCode=n;return this},json(b){this.body=b;return this}};
    await mod.namespace.storeHook(JSON.stringify(body),auth,res);return res};
  return {m:mod.namespace,rows,fetches,hook};
}
const day=864e5,NOW=Date.parse('2026-12-01T12:00:00Z'),iso=t=>new Date(t).toISOString();

test('A running subscription gives its level until it expires; refunded, expired or unknown ones give nothing', async()=>{
  const {m}=await load();
  const a=m.storeAccess({subscriptions:{plus_a2:{expires_date:iso(NOW+10*day),store:'app_store',unsubscribe_detected_at:null}}},NOW);
  assert.equal(a.level,'A2');assert.equal(a.kind,'sub');assert.equal(a.store,'app_store');assert.equal(a.ends,false);
  assert.equal(a.until,iso(NOW+10*day));
  const g=m.storeAccess({subscriptions:{'plus_b1:monthly':{expires_date:iso(NOW+3*day),store:'play_store',unsubscribe_detected_at:iso(NOW)}}},NOW);
  assert.equal(g.level,'B1','Google sends "product:base plan"');assert.equal(g.ends,true,'cancelled: runs to the end');
  assert.equal(m.storeAccess({subscriptions:{plus_a2:{expires_date:iso(NOW-day)}}},NOW),null);
  assert.equal(m.storeAccess({subscriptions:{plus_a2:{expires_date:iso(NOW+day),refunded_at:iso(NOW)}}},NOW),null);
  assert.equal(m.storeAccess({subscriptions:{other_app_pro:{expires_date:iso(NOW+day)}}},NOW),null);
  const grace=m.storeAccess({subscriptions:{plus_a2:{expires_date:iso(NOW-day),grace_period_expires_date:iso(NOW+2*day)}}},NOW);
  assert.equal(grace?.until,iso(NOW+2*day),'the store\'s grace period keeps access while it retries the payment');
});

test('Passes run their days from purchase, follow on from a running one, and B1 wins over A2', async()=>{
  const {m}=await load();
  const one=m.storeAccess({non_subscriptions:{pass_a2:[{purchase_date:iso(NOW-10*day),store:'app_store'}]}},NOW);
  assert.equal(one.kind,'pass');assert.equal(one.ends,true);assert.equal(one.until,iso(NOW-10*day+119*day));
  const two=m.storeAccess({non_subscriptions:{pass_a2:[{purchase_date:iso(NOW-10*day)},{purchase_date:iso(NOW-5*day)}]}},NOW);
  assert.equal(two.until,iso(NOW-10*day+238*day),'a second pass follows on');
  const year=m.storeAccess({non_subscriptions:{year_a2:[{purchase_date:iso(NOW-400*day)}]}},NOW);
  assert.equal(year,null,'a year has ended after 365 days');
  const both=m.storeAccess({subscriptions:{plus_a2:{expires_date:iso(NOW+300*day)}},non_subscriptions:{pass_b1:[{purchase_date:iso(NOW)}]}},NOW);
  assert.equal(both.level,'B1');
  assert.equal(m.storeAccess({non_subscriptions:{pass_a2:[{purchase_date:iso(NOW),is_sandbox:true}]}},NOW,false),null,'STORE_SANDBOX=0 ignores sandbox');
});

test('Syncing keeps or removes the learner\'s row from RevenueCat\'s record, read with the secret key', async()=>{
  const t=await load({subscriber:{subscriptions:{plus_b1:{expires_date:iso(Date.now()+5*day),store:'play_store'}}}});
  const a=await t.m.syncStore(UID);
  assert.equal(a.level,'B1');assert.equal(t.rows.get(UID).level,'B1');
  assert.match(t.fetches[0][0],new RegExp(`/v1/subscribers/${UID}$`));assert.equal(t.fetches[0][1].headers.authorization,'Bearer sk_test-only');
  assert.equal(await t.m.syncStore('not-a-uuid'),null);assert.equal(t.fetches.length,1,'only account ids are looked up');
  const none=await load({subscriber:{}});none.rows.set(UID,{level:'A2'});await none.m.syncStore(UID);
  assert.equal(none.rows.has(UID),false,'no access: the row goes');
});

test('The webhook needs the configured authorization and asks again on failure', async()=>{
  const t=await load({subscriber:{subscriptions:{plus_a2:{expires_date:iso(Date.now()+5*day)}}}});
  assert.equal((await t.hook({event:{type:'INITIAL_PURCHASE',app_user_id:UID}},'Bearer wrong')).statusCode,401);
  assert.equal((await t.hook({event:{type:'INITIAL_PURCHASE',app_user_id:UID}},undefined)).statusCode,401);
  assert.equal(t.fetches.length,0);
  const ok=await t.hook({event:{type:'RENEWAL',app_user_id:UID,aliases:['$RCAnonymousID:abc',UID]}},'Bearer hook-test-only');
  assert.equal(ok.statusCode,200);assert.equal(t.fetches.length,1,'one lookup per account id');assert.equal(t.rows.get(UID).level,'A2');
  assert.equal((await t.hook({event:{type:'TEST'}},'Bearer hook-test-only')).statusCode,200);
  const bad=await load({fail:true});
  assert.equal((await bad.hook({event:{type:'CANCELLATION',app_user_id:UID}},'Bearer hook-test-only')).statusCode,500,'RevenueCat retries');
  const off=await load({off:true});
  assert.equal((await off.hook({event:{type:'TEST'}},'Bearer hook-test-only')).statusCode,503);
});
