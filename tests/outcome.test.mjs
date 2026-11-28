import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Mijn examen (api/outcome.js): passed or not, and if the learner wants, the grade (1-10, A2 and KNM) or the score
// (0-1000, Staatsexamen NT2) from DUO's letter. The grade goes with put_outcome_sc; without that migration, put_outcome.
Object.assign(process.env,{SUPABASE_URL:'https://x.supabase.test',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'svc'});
const calls=[];let missing=false;
globalThis.fetch=async(url,init={})=>{url=String(url);calls.push([url,init.body?JSON.parse(init.body):null]);
  if(url.endsWith('/rpc/put_outcome_sc')&&missing)return new Response(JSON.stringify({code:'PGRST202'}),{status:404});
  return new Response('true',{status:200,headers:{'content-type':'application/json'}})};
const handler=(await import('../api/outcome.js')).default;
const H={host:'bittertalen.nl',origin:'https://bittertalen.nl','content-length':'120'};
const ID='0b6f2a4e-1c3d-4e5f-8a9b-0c1d2e3f4a5b';
const post=async body=>{const res={statusCode:200,status(n){this.statusCode=n;return this},json(b){this.body=b;return this},setHeader(){}};
  await handler({method:'POST',headers:H,body},res);return res};

test('A grade of 1 to 10 for A2 and KNM, a score up to 1000 for NT2, or none', async()=>{
  for(const [part,sc] of [['lz',7.5],['knm',6],['sp',10],['sb',523],['lb',0],['wr',null]]){
    calls.length=0;const r=await post({id:ID,part,ok:true,sc});
    assert.equal(r.statusCode,200,`${part} ${sc}`);
    assert.equal(calls[0][0],'https://x.supabase.test/rest/v1/rpc/put_outcome_sc');assert.equal(calls[0][1].o_sc,sc);
  }
  for(const [part,sc] of [['lz',11],['lz',0.5],['lz',7.55],['knm','7'],['sb',520.5],['sb',1001],['wb',-1]])
    assert.equal((await post({id:ID,part,ok:true,sc})).statusCode,400,`${part} ${sc}`);
});

test('Without the new function the result is still kept, without the grade', async()=>{
  missing=true;calls.length=0;
  assert.equal((await post({id:ID,part:'ls',ok:false,pc:55,rd:1,sc:5.5})).statusCode,200);
  assert.deepEqual(calls.map(c=>c[0].split('/').pop()),['put_outcome_sc','put_outcome']);
  assert.equal('o_sc' in calls[1][1],false);missing=false;
});

test('The migration adds the column and the function, and the app asks for the grade only after a result', ()=>{
  const sql=fs.readFileSync(new URL('../supabase/migrations/20261128140000_outcome_score.sql',import.meta.url),'utf8');
  assert.match(sql,/add column if not exists sc numeric\(5,1\)/);assert.match(sql,/function public\.put_outcome_sc\(/);
  assert.ok(fs.readFileSync(new URL('../supabase/schema.sql',import.meta.url),'utf8').includes('put_outcome_sc'));
  const page=fs.readFileSync(new URL('../oefenen.html',import.meta.url),'utf8');
  assert.match(page,/\+\(U\[k\]\?`<section class="list"><label class="prow"><span>\$\{NT2PART\.has\(k\)\?"Je score":"Je cijfer"\}/);
  assert.match(page,/body:JSON\.stringify\(\{id:e\.id,part:k,ok:e\.ok,pc:e\.pc,rd:e\.rd,sc:e\.sc\?\?null\}\)/);
});

test('A new learner is offered a short note to have checked first, while a free check is there', ()=>{
  const page=fs.readFileSync(new URL('../oefenen.html',import.meta.url),'utf8');
  assert.match(page,/data-p="first:wr">Schrijf je eerste tekst<\/button>/);
  assert.match(page,/if\(k==="first"\)\{track\("first"\);return build\("wr",\{[^}]*pool:\(\)=>\[ITEMS\.find\(x=>x\.k==="wr\|0"\)\]/);
  assert.match(page,/const canCheck=!!acc\.cfg&&\(acc\.user\?checksLeft\("wr"\)!==0:!!acc\.cfg\.free&&acc\.free!==0\);/);
});
