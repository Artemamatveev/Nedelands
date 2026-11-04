import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root} from './app-harness.mjs';

async function handler(options={}){
  const usage=[],quotas=[],logs=[];let modelCalls=0;
  class APIError extends Error{}
  class AuthenticationError extends APIError{}
  class RateLimitError extends APIError{}
  class Anthropic {
    static APIError=APIError;static AuthenticationError=AuthenticationError;static RateLimitError=RateLimitError;
    beta={messages:{create:async()=>{
      modelCalls++;
      if(options.providerFailure)throw Error('connection interrupted');
      return {stop_reason:options.stopReason||'end_turn',model:'test-model',usage:{input_tokens:100,output_tokens:30},content:[{type:'text',text:JSON.stringify({tasks:[{passed:true,verdict:'Goed',corrected:'Ik kom later.',errors:[],scores:{inhoud:3,woorden:2,grammatica:2,spelling:2,samenhang:1}}]})}]};
    }}};
  }
  const values={
    accounts:options.accounts??true,caller:async()=>options.guest?null:{id:'test-user'},
    checkCost:n=>Math.max(1,Math.ceil(n/3)),LIMIT:20,FREE:2,visitor:()=> 'test-visitor',sameOrigin:()=>true,
    useChecks:async(_id,cost)=>{usage.push(cost);return options.userLeft??19},
    useFree:async(_id,cost)=>{usage.push(cost);return options.freeLeft??1},
    useTotal:async cost=>{quotas.push(cost);return 'total' in options?options.total:399},
    isPlus:async()=>{if(options.plusFails)throw Error('down');return options.plus??false}
  };
  const context=vm.createContext({process:{env:{ANTHROPIC_API_KEY:'test-only'}},console:{info:x=>logs.push(x),error:x=>logs.push(x)}});
  const sdk=new vm.SyntheticModule(['default'],function(){this.setExport('default',Anthropic)},{context});
  const supa=new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value)},{context});
  const stripeMod=new vm.SyntheticModule(['pay'],function(){this.setExport('pay',!!options.pay)},{context});
  const module=new vm.SourceTextModule(fs.readFileSync(new URL('api/check.js',root),'utf8'),{context});
  await module.link(name=>name==='@anthropic-ai/sdk'?sdk:name==='./_stripe.js'?stripeMod:supa);await module.evaluate();
  const req={method:'POST',headers:{host:'example.test',origin:'https://example.test'},body:{tasks:[{task:'Stuur een bericht',text:'Ik kom later. Personal test content.'}]}};
  const res={statusCode:200,status(n){this.statusCode=n;return this},json(body){this.body=body;return this}};
  await module.namespace.default(req,res);
  return {res,usage,quotas,logs,modelCalls};
}

test('Missing account configuration blocks the paid provider',async()=>{
  const r=await handler({accounts:false});assert.equal(r.res.statusCode,503);assert.equal(r.modelCalls,0);assert.deepEqual(r.quotas,[]);
});
test('Unavailable or malformed global counters block provider calls and refund the learner',async()=>{
  for(const total of [null,undefined,NaN,'399',{},0.5]){
    const r=await handler({total});assert.equal(r.res.statusCode,503);assert.equal(r.res.body.error,'quota_unavailable');assert.equal(r.modelCalls,0);assert.deepEqual(r.usage,[1,-1]);
  }
});
test('The daily global cap and user cap prevent provider calls',async()=>{
  const r=await handler({total:-1});assert.equal(r.res.statusCode,429);assert.equal(r.modelCalls,0);assert.deepEqual(r.usage,[1,-1]);
  const user=await handler({userLeft:-1});assert.equal(user.res.statusCode,429);assert.equal(user.modelCalls,0);assert.deepEqual(user.quotas,[]);
});
test('A successful check logs token usage without learner text or identity',async()=>{
  const r=await handler();assert.equal(r.res.statusCode,200);assert.equal(r.modelCalls,1);assert.deepEqual(r.quotas,[1]);
  const event=JSON.parse(r.logs[0]);assert.equal(event.event,'grading_usage');assert.equal(event.usage.input_tokens,100);
  assert.ok(r.logs.every(x=>!x.includes('Personal test content')&&!x.includes('test-user')));
});
test('An uncertain provider outcome refunds the learner but retains the global spend reservation',async()=>{
  const r=await handler({providerFailure:true});assert.equal(r.res.statusCode,502);assert.deepEqual(r.usage,[1,-1]);assert.deepEqual(r.quotas,[1]);
});
test('Refused and truncated responses refund the learner while retaining actual token usage',async()=>{
  for(const stopReason of ['refusal','max_tokens']){const r=await handler({stopReason});assert.deepEqual(r.usage,[1,-1]);assert.deepEqual(r.quotas,[1]);assert.equal(r.modelCalls,1);}
});
test('The real quota reader rejects JSON values that could otherwise coerce into an allowance',async()=>{
  for(const value of [null,'400',{},[]]){
    const context=vm.createContext({process:{env:{SUPABASE_URL:'https://example.test',SUPABASE_ANON_KEY:'test',SUPABASE_SERVICE_ROLE_KEY:'test'}},fetch:async()=>({ok:true,json:async()=>value})});
    const source=new vm.SourceTextModule(fs.readFileSync(new URL('api/_supa.js',root),'utf8'),{context});
    const cryptoModule=new vm.SyntheticModule(['createHash'],function(){this.setExport('createHash',()=>{})},{context});
    await source.link(()=>cryptoModule);await source.evaluate();
    await assert.rejects(source.namespace.useTotal(1));
    await assert.rejects(source.namespace.useChecks('user',1));
    await assert.rejects(source.namespace.useFree('visitor',1));
  }
});

test('With payments on, a logged-in learner without Plus gets only the free single checks, then a Plus answer',async()=>{
  const free=await handler({pay:true,plus:false});assert.equal(free.res.statusCode,200);assert.equal(free.res.body.free,1);assert.equal(free.modelCalls,1);
  const plus=await handler({pay:true,plus:true});assert.equal(plus.res.statusCode,200);assert.equal(plus.res.body.left,19);
  const used=await handler({pay:true,plus:false,freeLeft:-1});assert.equal(used.res.statusCode,402);assert.equal(used.res.body.error,'plus');assert.equal(used.modelCalls,0);
  const down=await handler({pay:true,plusFails:true});assert.equal(down.res.statusCode,502);assert.equal(down.modelCalls,0);
});
test('Without payments set up, grading works as before for every logged-in learner',async()=>{
  const r=await handler({pay:false,plus:false});assert.equal(r.res.statusCode,200);assert.equal(r.res.body.left,19);
});
