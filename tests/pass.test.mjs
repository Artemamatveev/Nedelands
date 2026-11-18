import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// The Examenpas (api/plus.js go:"pass", api/stripe.js checkout events, plusFor in api/_supa.js) against a fake Supabase
// and Stripe. A one-time payment gives the Plus checks of its level for PASS_DAYS; no subscription.
Object.assign(process.env,{SUPABASE_URL:'https://x.supabase.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc',
  STRIPE_SECRET_KEY:'sk_test_x',STRIPE_PRICE:'price_1',STRIPE_PRICE_B1:'price_b1',STRIPE_WEBHOOK_SECRET:'whsec_test',
  STRIPE_PRICE_PASS_A2:'price_pa2',STRIPE_PRICE_PASS_B1:'price_pb1'});
const DAY=864e5;
const db={plus:null,passes:[],session:null,gone:false},calls=[];
const passPrice=id=>({id,active:true,currency:'eur',unit_amount:id==='price_pb1'?2499:1999,recurring:null,type:'one_time'});
globalThis.fetch=async(url,init={})=>{
  url=String(url);const m=init.method||'GET';calls.push(`${m} ${url} ${init.body||''}`);
  const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json'}});
  if(url.endsWith('/auth/v1/user'))return J({id:'u1',email:'a@b.nl'});
  if(url.includes('/rest/v1/plus?user_id'))return J(db.plus?[db.plus]:[]);
  if(url.includes('/rest/v1/exam_pass?user_id')){const since=decodeURIComponent(url.match(/until=gt\.([^&]+)/)[1]);
    return J(db.passes.filter(p=>p.until>since).sort((a,b)=>b.until.localeCompare(a.until)).map(({level,until})=>({level,until})))}
  if(url.endsWith('/rest/v1/exam_pass')&&m==='POST'){if(db.gone)return J({code:'23503'},409);const row=JSON.parse(init.body);
    if(!db.passes.some(p=>p.session===row.session))db.passes.push(row);return new Response(null,{status:201})}
  if(url.includes('/v1/prices/price_p'))return J(passPrice(url.split('/').pop()));
  if(url.includes('/v1/checkout/sessions/'))return J(db.session);
  if(url.includes('/v1/checkout/sessions'))return J({url:'https://checkout.stripe.test/pass'});
  if(url.includes('/auth/v1/settings'))return J({external:{}});
  return J({error:{code:'unknown'}},404);
};
const res=()=>({statusCode:200,headers:{},status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(k,v){this.headers[k]=v}});
const H={host:'bittertalen.nl',origin:'https://bittertalen.nl',authorization:'Bearer t'};
const sign=(raw,t=Math.floor(Date.now()/1000))=>`t=${t},v1=${crypto.createHmac('sha256','whsec_test').update(`${t}.${raw}`).digest('hex')}`;
const plus=(await import('../api/plus.js')).default,hook=(await import('../api/stripe.js')).default,config=(await import('../api/config.js')).default;
const {plusFor,coversLevel}=await import('../api/_supa.js');
const paid=(id,level,o={})=>({id,mode:'payment',payment_status:'paid',client_reference_id:'u1',metadata:{uid:'u1',level,kind:'pass'},
  line_items:{data:[{quantity:1,price:passPrice(level==='B1'?'price_pb1':'price_pa2')}]},...o});
const send=async(session,type='checkout.session.completed')=>{db.session=session;const raw=JSON.stringify({type,data:{object:{id:session.id}}});
  const r=res();await hook({method:'POST',headers:{'stripe-signature':sign(raw)},body:raw},r);return r};
const last=s=>calls.filter(c=>c.includes(s)).pop();

test('Config offers the Examenpas with its fixed prices and length',async()=>{
  const r=res();await config({method:'GET',headers:H},r);
  assert.deepEqual(r.body.pass,{days:42,plans:{A2:{price:'19,99'},B1:{price:'24,99'}}});
});
test('Buying a pass opens a one-time Checkout with the consent text and the user in its metadata',async()=>{
  const r=res();await plus({method:'POST',headers:H,body:{go:'pass',level:'B1'}},r);
  assert.equal(r.body.url,'https://checkout.stripe.test/pass');
  const q=new URLSearchParams(last('checkout/sessions').split(' ').pop());
  assert.equal(q.get('mode'),'payment');assert.equal(q.get('line_items[0][price]'),'price_pb1');
  assert.equal(q.get('metadata[uid]'),'u1');assert.equal(q.get('metadata[kind]'),'pass');assert.equal(q.get('client_reference_id'),'u1');
  assert.match(q.get('custom_text[submit][message]'),/herroepingsrecht/);
  const bad=res();await plus({method:'POST',headers:H,body:{go:'pass',level:'C1'}},bad);assert.equal(bad.statusCode,400);
  const other=res();await plus({method:'POST',headers:{...H,origin:'https://evil.test'},body:{go:'pass',level:'A2'}},other);assert.equal(other.statusCode,403);
});
test('A paid session gives 42 days at its level, once, and a second pass extends a running one',async()=>{
  assert.equal((await send(paid('cs_1','A2'))).statusCode,200);
  assert.equal(db.passes.length,1);const first=Date.parse(db.passes[0].until);
  assert.ok(Math.abs(first-(Date.now()+42*DAY))<60e3);
  await send(paid('cs_1','A2'));assert.equal(db.passes.length,1); // the same event again adds nothing
  const p=await plusFor('u1');assert.equal(p.level,'A2');assert.equal(p.pass,true);assert.ok(coversLevel(p,'A2'));assert.ok(!coversLevel(p,'B1'));
  await send(paid('cs_2','A2'));assert.equal(db.passes.length,2);
  assert.ok(Math.abs(Date.parse(db.passes[1].until)-(first+42*DAY))<60e3);
  const r=res();await plus({method:'GET',headers:H},r);assert.equal(r.body.plus.pass,true);assert.equal(r.body.plus.level,'A2');
});
test('Unpaid, foreign, wrongly priced or tampered sessions give nothing',async()=>{
  db.passes=[];
  await send(paid('cs_3','A2',{payment_status:'unpaid'}));
  await send(paid('cs_4','A2',{client_reference_id:'u2'}));
  await send(paid('cs_5','A2',{mode:'subscription'}));
  await send(paid('cs_6','B1',{line_items:{data:[{quantity:1,price:passPrice('price_pa2')}]}})); // B1 claimed, A2 price paid
  await send(paid('cs_7','A2',{line_items:{data:[{quantity:1,price:{...passPrice('price_pa2'),unit_amount:1}}]}}));
  await send(paid('cs_8','A2',{metadata:{uid:'u1',level:'A2'}}));
  assert.equal(db.passes.length,0);
  assert.equal(await plusFor('u1'),null);
  await send(paid('cs_9','B1'),'checkout.session.async_payment_succeeded');assert.equal(db.passes.length,1);
  assert.ok(coversLevel(await plusFor('u1'),'A2'));
});
test('An expired pass gives nothing, and a deleted account is not an error',async()=>{
  db.passes=[{session:'cs_old',user_id:'u1',level:'B1',until:new Date(Date.now()-DAY).toISOString()}];
  assert.equal(await plusFor('u1'),null);
  db.gone=true;assert.equal((await send(paid('cs_10','A2'))).statusCode,200);db.gone=false;
});
test('The schema keeps passes per session, server-written, readable only by their owner',async()=>{
  const fs=await import('node:fs');const sql=fs.readFileSync(new URL('../supabase/schema.sql',import.meta.url),'utf8');
  const block=sql.slice(sql.indexOf('create table if not exists public.exam_pass'));
  assert.match(block,/session text primary key/);assert.match(block,/on delete cascade/);
  assert.match(block,/revoke all on public\.exam_pass from public, anon, authenticated;/);
  assert.doesNotMatch(block,/grant (insert|update|delete)[^;]*to authenticated/);
  const mig=fs.readFileSync(new URL('../supabase/migrations/20261119003000_exam_pass.sql',import.meta.url),'utf8');
  assert.ok(mig.includes(block.slice(0, block.indexOf('using ((select auth.uid()) = user_id);'))));
});
