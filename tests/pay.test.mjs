import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url);

const ENV={STRIPE_SECRET_KEY:'sk_test_x',STRIPE_WEBHOOK_SECRET:'whsec_test',STRIPE_PRICE_MONTH:'price_m',STRIPE_PRICE_YEAR:'price_y'};
// Loads an api file with a fake _supa.js and a real _stripe.js whose fetch goes to `stripeApi`
async function load(file,{plans={},user={id:'u1',email:'a@b.nl'},stripeApi=()=>({})}={}){
  const calls=[],saved=[];
  const fetch=async(url,init={})=>{const path=url.replace('https://api.stripe.com/v1/','');calls.push({path,method:init.method,body:init.body?Object.fromEntries(new URLSearchParams(init.body)):null});
    const j=await stripeApi(path,init);return {ok:!j.error,status:j.error?400:200,json:async()=>j}};
  const context=vm.createContext({process:{env:ENV},fetch,Buffer,URLSearchParams,console:{error(){}},Date});
  const supa={accounts:true,caller:async()=>user,sameOrigin:()=>true,
    getPlan:async uid=>plans[uid]||null,planByCustomer:async c=>Object.values(plans).find(p=>p.customer===c)||null,
    putPlan:async row=>{saved.push(row);plans[row.user_id]={...plans[row.user_id],...row}},
    plusRow:p=>!!p&&['active','trialing','past_due'].includes(p.status)};
  const mods={'./_supa.js':new vm.SyntheticModule(Object.keys(supa),function(){for(const[k,v]of Object.entries(supa))this.setExport(k,v)},{context}),
    'node:crypto':new vm.SyntheticModule(['createHmac','timingSafeEqual'],function(){this.setExport('createHmac',crypto.createHmac);this.setExport('timingSafeEqual',crypto.timingSafeEqual)},{context})};
  const stripeSrc=new vm.SourceTextModule(fs.readFileSync(new URL('api/_stripe.js',root),'utf8'),{context});
  mods['./_stripe.js']=stripeSrc;
  const m=new vm.SourceTextModule(fs.readFileSync(new URL(file,root),'utf8'),{context});
  const link=name=>mods[name];
  await stripeSrc.link(link);await m.link(link);await m.evaluate();
  return {m:m.namespace,stripe:stripeSrc.namespace,calls,saved,plans};
}
const res=()=>({statusCode:200,status(n){this.statusCode=n;return this},json(b){this.body=b;return this}});
const sign=(raw,secret='whsec_test',t=Math.floor(Date.now()/1000))=>`t=${t},v1=${crypto.createHmac('sha256',secret).update(`${t}.${raw}`).digest('hex')}`;

test('Stripe signatures: a valid one passes, a wrong secret, a changed body or an old one does not',async()=>{
  const {stripe}=await load('api/stripe.js');const raw='{"id":"evt_1"}';
  assert.equal(stripe.verify(raw,sign(raw)),true);
  assert.equal(stripe.verify(raw,sign(raw,'whsec_other')),false);
  assert.equal(stripe.verify(raw+' ',sign(raw)),false);
  assert.equal(stripe.verify(raw,sign(raw,'whsec_test',Math.floor(Date.now()/1000)-600)),false);
  assert.equal(stripe.verify(raw,''),false);
});
test('The first checkout gets the free week; a second one does not, and Plus goes to the portal instead',async()=>{
  const api=path=>path.startsWith('checkout')?{url:'https://checkout.stripe.test/1'}:{url:'https://portal.stripe.test/1'};
  const req=body=>({method:'POST',headers:{host:'bittertalen.nl',origin:'https://bittertalen.nl',authorization:'Bearer t'},body});
  let a=await load('api/pay.js',{stripeApi:api});let r=res();await a.m.default(req({action:'checkout',period:'year'}),r);
  assert.equal(r.body.url,'https://checkout.stripe.test/1');
  const c=a.calls[0].body;assert.equal(c['line_items[0][price]'],'price_y');assert.equal(c['subscription_data[trial_period_days]'],'7');
  assert.equal(c['subscription_data[metadata][user_id]'],'u1');assert.equal(c.client_reference_id,'u1');assert.equal(c.customer_email,'a@b.nl');
  a=await load('api/pay.js',{stripeApi:api,plans:{u1:{user_id:'u1',customer:'cus_1',status:'canceled',trial_used:true}}});r=res();await a.m.default(req({action:'checkout',period:'month'}),r);
  const c2=a.calls[0].body;assert.equal(c2['line_items[0][price]'],'price_m');assert.equal(c2['subscription_data[trial_period_days]'],undefined);assert.equal(c2.customer,'cus_1');
  a=await load('api/pay.js',{stripeApi:api,plans:{u1:{user_id:'u1',customer:'cus_1',status:'active'}}});r=res();await a.m.default(req({action:'checkout',period:'month'}),r);
  assert.equal(a.calls[0].path,'billing_portal/sessions');assert.equal(r.body.url,'https://portal.stripe.test/1');
});
test('The webhook saves the subscription as Stripe has it now, for the user in its metadata',async()=>{
  const sub={id:'sub_1',customer:'cus_1',status:'trialing',trial_start:1793800000,trial_end:1794400000,metadata:{user_id:'u1'},items:{data:[{price:{id:'price_m',recurring:{interval:'month'}}}]}};
  const a=await load('api/stripe.js',{stripeApi:p=>p==='subscriptions/sub_1'?sub:{error:{type:'x'}}});
  const raw=JSON.stringify({type:'customer.subscription.updated',data:{object:{id:'sub_1',status:'active'}}});
  const req={method:'POST',headers:{'stripe-signature':sign(raw)},body:raw};
  const r=res();await a.m.default(req,r);
  assert.equal(r.statusCode,200);
  assert.deepEqual({...a.saved[0],updated_at:undefined},{user_id:'u1',customer:'cus_1',sub:'sub_1',status:'trialing',period:'month',ends_at:new Date(1794400000*1000).toISOString(),cancel_at_end:false,trial_used:true,updated_at:undefined});
  const bad=res();await a.m.default({method:'POST',headers:{'stripe-signature':sign(raw,'whsec_other')},body:raw},bad);
  assert.equal(bad.statusCode,400);assert.equal(a.saved.length,1);
});
