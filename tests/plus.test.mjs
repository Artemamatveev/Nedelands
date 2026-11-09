import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Bittertalen Plus (api/plus.js, api/stripe.js, api/account.js, api/config.js) against a fake Supabase and Stripe
Object.assign(process.env,{SUPABASE_URL:'https://x.supabase.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc',
  STRIPE_SECRET_KEY:'sk_test_x',STRIPE_PRICE:'price_1',STRIPE_WEBHOOK_SECRET:'whsec_test'});
const FUTURE=Math.floor(Date.now()/1000)+20*864e2;
const db={plus:null,gone:false,subStatus:'active'},calls=[];
globalThis.fetch=async(url,init={})=>{
  url=String(url);const m=init.method||'GET';calls.push(`${m} ${url} ${init.body||''}`);
  const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
  if(url.endsWith('/auth/v1/user'))return J({id:'u1',email:'a@b.nl'});
  if(url.includes('/rest/v1/plus?user_id'))return J(db.plus?[db.plus]:[]);
  if(url.endsWith('/rest/v1/plus')&&m==='POST'){if(db.gone)return J({code:'23503'},409);db.plus=JSON.parse(init.body);return new Response(null,{status:201})}
  if(url.includes('/v1/checkout/sessions'))return J({url:'https://checkout.stripe.test/1'});
  if(url.includes('/v1/billing_portal/sessions'))return J({url:'https://billing.stripe.test/1'});
  if(url.includes('/v1/subscriptions/sub_1'))return m==='DELETE'?J({id:'sub_1',status:'canceled'})
    :J({id:'sub_1',customer:'cus_1',status:db.subStatus,metadata:{uid:'u1'},cancel_at_period_end:false,items:{data:[{current_period_end:FUTURE}]}});
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

test('Config offers Plus with its allowance; the free allowance drops to 5',async()=>{
  const r=res();await config({method:'GET',headers:H},r);
  assert.deepEqual(r.body.plus,{limit:60,price:'9,99'});assert.equal(r.body.limit,5);
});
test('Buying opens Checkout for the monthly price with the user in the subscription',async()=>{
  const r=res();await plus({method:'POST',headers:H,body:{go:'buy'}},r);
  assert.equal(r.body.url,'https://checkout.stripe.test/1');
  const q=new URLSearchParams(last('checkout/sessions').split(' ').pop());
  assert.equal(q.get('mode'),'subscription');assert.equal(q.get('line_items[0][price]'),'price_1');
  assert.equal(q.get('subscription_data[metadata][uid]'),'u1');assert.equal(q.get('customer_email'),'a@b.nl');
  assert.equal(q.get('success_url'),'https://bittertalen.nl/?plus=ok');
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
