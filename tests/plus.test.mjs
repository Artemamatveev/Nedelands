import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Bittertalen Plus (api/plus.js, api/stripe.js, api/account.js, api/config.js) against a fake Supabase and Stripe
Object.assign(process.env,{SUPABASE_URL:'https://x.supabase.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc',
  STRIPE_SECRET_KEY:'sk_test_x',STRIPE_PRICE:'price_1',STRIPE_PRICE_B1:'price_b1',STRIPE_PORTAL_CONFIG:'bpc_tiers',STRIPE_WEBHOOK_SECRET:'whsec_test'});
const FUTURE=Math.floor(Date.now()/1000)+20*864e2;
const db={plus:null,gone:false,subStatus:'active',level:'A2',priceAmount:null},calls=[];
globalThis.fetch=async(url,init={})=>{
  url=String(url);const m=init.method||'GET';calls.push(`${m} ${url} ${init.body||''}`);
  const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
  if(url.endsWith('/auth/v1/user'))return J({id:'u1',email:'a@b.nl'});
  if(url.includes('/rest/v1/plus?user_id'))return J(db.plus?[db.plus]:[]);
  if(url.endsWith('/rest/v1/plus')&&m==='POST'){if(db.gone)return J({code:'23503'},409);db.plus=JSON.parse(init.body);return new Response(null,{status:201})}
  if(url.includes('/v1/prices/')){const b1=url.endsWith('price_b1');return J({id:b1?'price_b1':'price_1',active:true,product:b1?'prod_b1':'prod_1',currency:'eur',unit_amount:db.priceAmount??(b1?1499:999),recurring:{interval:'month',interval_count:1,usage_type:'licensed'}})}
  if(url.includes('/v1/billing_portal/configurations/'))return J({id:'bpc_tiers',active:true,features:{subscription_update:{enabled:true,default_allowed_updates:['price'],products:[{product:'prod_1',prices:['price_1']},{product:'prod_b1',prices:['price_b1']}]}}});
  if(url.includes('/v1/checkout/sessions'))return J({url:'https://checkout.stripe.test/1'});
  if(url.includes('/v1/billing_portal/sessions'))return J({url:'https://billing.stripe.test/1'});
  if(url.includes('/v1/subscriptions/sub_1'))return m==='DELETE'?J({id:'sub_1',status:'canceled'})
    :J({id:'sub_1',customer:'cus_1',status:db.subStatus,metadata:{uid:'u1'},cancel_at_period_end:false,items:{data:[{id:'si_1',quantity:1,current_period_end:FUTURE,price:{id:db.level==='B1'?'price_b1':'price_1',product:db.level==='B1'?'prod_b1':'prod_1',currency:'eur',unit_amount:db.level==='B1'?1499:999,recurring:{interval:'month',interval_count:1}}}]}});
  if(url.includes('/auth/v1/settings'))return J({external:{}});
  if(url.includes('/auth/v1/admin/users/'))return new Response(null,{status:200});
  return J({error:{code:'unknown'}},404);
};
const res=()=>({statusCode:200,headers:{},status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(k,v){this.headers[k]=v}});
const H={host:'bittertalen.nl',origin:'https://bittertalen.nl',authorization:'Bearer t'};
const sign=(raw,secret='whsec_test',t=Math.floor(Date.now()/1000))=>`t=${t},v1=${crypto.createHmac('sha256',secret).update(`${t}.${raw}`).digest('hex')}`;
const plus=(await import('../api/plus.js')).default,hook=(await import('../api/stripe.js')).default;
const account=(await import('../api/account.js')).default,config=(await import('../api/config.js')).default;
const send=async(type,secret,age=0)=>{const raw=JSON.stringify({type,data:{object:{id:'sub_1'}}});const r=res();
  await hook({method:'POST',headers:{'stripe-signature':sign(raw,secret,Math.floor(Date.now()/1000)-age)},body:raw},r);return r};
const last=s=>calls.filter(c=>c.includes(s)).pop();

test('Config offers seven weekly free checks, a one-time trial, and the paid daily allowance',async()=>{
  const r=res();await config({method:'GET',headers:H},r);
  assert.deepEqual(r.body.plus,{limit:60,price:'9,99',plans:{A2:{price:'9,99'},B1:{price:'14,99'}}});assert.equal(r.body.limit,7);assert.equal(r.body.period,'week');assert.equal(r.body.freePeriod,'once');
});
test('Buying opens Checkout for the monthly price with the user in the subscription',async()=>{
  const r=res();await plus({method:'POST',headers:H,body:{go:'buy'}},r);
  assert.equal(r.body.url,'https://checkout.stripe.test/1');
  const q=new URLSearchParams(last('checkout/sessions').split(' ').pop());
  assert.equal(q.get('mode'),'subscription');assert.equal(q.get('line_items[0][price]'),'price_1');
  assert.equal(q.get('subscription_data[metadata][uid]'),'u1');assert.equal(q.get('customer_email'),'a@b.nl');
  assert.equal(q.get('success_url'),'https://bittertalen.nl/?plus=ok&plan=A2');
  const other=res();await plus({method:'POST',headers:{...H,origin:'https://evil.test'},body:{go:'buy'}},other);assert.equal(other.statusCode,403);
});
test('The webhook refuses a wrong or old signature and keeps the subscription as Stripe has it',async()=>{
  assert.equal((await send('customer.subscription.created','whsec_other')).statusCode,400);
  assert.equal((await send('customer.subscription.created','whsec_test',600)).statusCode,400);
  assert.equal(db.plus,null);
  assert.equal((await send('customer.subscription.created')).statusCode,200);
  assert.equal(db.plus.user_id,'u1');assert.equal(db.plus.status,'active');assert.equal(db.plus.customer,'cus_1');
  assert.equal(db.plus.until,new Date(FUTURE*1000).toISOString());
});
test('With Plus, buying again opens the portal; after cancelling, a new Checkout reuses the customer',async()=>{
  let r=res();await plus({method:'POST',headers:H,body:{go:'buy'}},r);assert.equal(r.body.url,'https://billing.stripe.test/1');
  db.subStatus='canceled';await send('customer.subscription.deleted');assert.equal(db.plus.status,'canceled');
  r=res();await plus({method:'POST',headers:H,body:{go:'buy'}},r);
  const q=new URLSearchParams(last('checkout/sessions').split(' ').pop());assert.equal(q.get('customer'),'cus_1');assert.equal(q.get('customer_email'),null);
});
test('Deleting the account cancels the subscription first; an event for a deleted account cancels it too',async()=>{
  db.subStatus='active';await send('customer.subscription.updated');
  const r=res();await account({method:'DELETE',headers:H},r);
  assert.equal(r.statusCode,200);assert.ok(calls.some(c=>c.startsWith('DELETE https://api.stripe.com/v1/subscriptions/sub_1')));
  db.gone=true;const n=calls.length;assert.equal((await send('customer.subscription.updated')).statusCode,200);
  assert.ok(calls.slice(n).some(c=>c.startsWith('DELETE https://api.stripe.com/v1/subscriptions/sub_1')));
});


test('B1 Checkout uses the EUR 14.99 monthly price and rejects client-provided unknown levels',async()=>{
  db.plus=null;db.subStatus='active';db.level='B1';
  const r=res();await plus({method:'POST',headers:H,body:{go:'buy',level:'B1',price:'price_1',amount:1}},r);
  assert.equal(r.statusCode,200);
  const q=new URLSearchParams(last('checkout/sessions').split(' ').pop());
  assert.equal(q.get('line_items[0][price]'),'price_b1');assert.equal(q.get('subscription_data[metadata][level]'),'B1');
  assert.equal(q.get('subscription_data[trial_period_days]'),null);
  const n=calls.length,bad=res();await plus({method:'POST',headers:H,body:{go:'buy',level:'FREE'}},bad);
  assert.equal(bad.statusCode,400);assert.equal(calls.slice(n).filter(c=>c.includes('checkout/sessions')).length,0);
});
test('A2 to B1 opens a Stripe confirmation for the same subscription, without an update or second Checkout',async()=>{
  db.gone=false;db.level='A2';db.subStatus='active';await send('customer.subscription.updated');
  const n=calls.length,r=res();await plus({method:'POST',headers:H,body:{go:'buy',level:'B1'}},r);
  assert.equal(r.statusCode,200);assert.equal(r.body.url,'https://billing.stripe.test/1');
  const q=new URLSearchParams(last('billing_portal/sessions').split(' ').pop());
  assert.equal(q.get('configuration'),'bpc_tiers');assert.equal(q.get('flow_data[type]'),'subscription_update_confirm');
  assert.equal(q.get('flow_data[subscription_update_confirm][subscription]'),'sub_1');
  assert.equal(q.get('flow_data[subscription_update_confirm][items][0][id]'),'si_1');
  assert.equal(q.get('flow_data[subscription_update_confirm][items][0][price]'),'price_b1');
  assert.ok(!calls.slice(n).some(c=>c.includes('checkout/sessions')||c.startsWith('POST https://api.stripe.com/v1/subscriptions/')));
});
test('The authenticated entitlement endpoint follows the actual subscribed price and exposes no billing identifiers',async()=>{
  for(const level of ['A2','B1']){
    db.level=level;const r=res();await plus({method:'GET',headers:H},r);
    assert.equal(r.statusCode,200);assert.equal(r.body.plus.level,level);
    assert.equal(r.body.plus.customer,undefined);assert.equal(r.body.plus.sub,undefined);
  }
});
test('An incorrect configured B1 amount cannot reach Checkout',async()=>{
  db.plus=null;db.priceAmount=999;const n=calls.length,r=res();
  await plus({method:'POST',headers:H,body:{go:'buy',level:'B1'}},r);
  assert.equal(r.statusCode,502);assert.ok(!calls.slice(n).some(c=>c.includes('checkout/sessions')));db.priceAmount=null;
});

test('Plus screen lists both prices, sends the chosen level, and recalculates allowances when levels change',async()=>{
  const {app}=await import('./app-harness.mjs');
  const a=await app();
  a.run(`acc.cfg={limit:7,period:'week',plus:{limit:60,price:'9,99',plans:{A2:{price:'9,99'},B1:{price:'14,99'}}}};plusScreen()`);
  assert.equal(a.document.querySelectorAll('[data-plus-plan]').length,2);
  assert.match(a.document.querySelector('[data-plus-plan="A2"]').textContent,/9,99/);
  assert.match(a.document.querySelector('[data-plus-plan="B1"]').textContent,/14,99/);
  a.run(`acc.user={id:'u1'};acc.plus={status:'active',level:'A2'};acc.used=3;acc.weekUsed=1;S.lvl='B1';plusScreen()`);
  assert.equal(a.run('myLimit()'),7);assert.equal(a.run('checksLeft()'),6);
  assert.equal(a.run('myLimit("A2")'),60);assert.equal(a.run('checksLeft("wr")'),57);
  assert.equal(a.document.querySelector('[data-plus-buy="A2"]'),null);
  assert.ok(a.document.querySelector('[data-plus-buy="B1"]'));
  a.run(`acc.plus.level='B1';plusScreen()`);
  assert.equal(a.run('myLimit()'),60);assert.equal(a.document.querySelector('[data-plus-buy]'),null);
});

test('Only the two configured monthly prices grant their level, with no access from metadata or another price',async()=>{
  const {subscriptionLevel,coversLevel}=await import('../api/_supa.js');
  const sub=price=>({items:{data:[{quantity:1,price}]}});
  const monthly=(id,cents)=>({id,product:'prod_1',currency:'eur',unit_amount:cents,recurring:{interval:'month',interval_count:1}});
  assert.equal(await subscriptionLevel(sub(monthly('price_1',999))),'A2');
  assert.equal(await subscriptionLevel(sub(monthly('price_b1',1499))),'B1');
  assert.equal(await subscriptionLevel(sub(monthly('unknown',1499))),null);
  assert.equal(await subscriptionLevel(sub({...monthly('price_b1',1499),currency:'usd'})),null);
  assert.equal(await subscriptionLevel(sub({...monthly('price_b1',1499),recurring:{interval:'year',interval_count:1}})),null);
  assert.equal(coversLevel({status:'active',level:'A2'},'B1'),false);
  assert.equal(coversLevel({status:'active',level:'B1'},'A2'),true);
  assert.equal(coversLevel({status:'canceled',level:'B1'},'B1'),false);
});
