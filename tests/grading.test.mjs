import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root} from './app-harness.mjs';

async function handler(options={}){
  const usage=[],quotas=[],logs=[],lims=[],prompts=[];let modelCalls=0;
  class APIError extends Error{}
  class AuthenticationError extends APIError{}
  class RateLimitError extends APIError{}
  class Anthropic {
    static APIError=APIError;static AuthenticationError=AuthenticationError;static RateLimitError=RateLimitError;
    beta={messages:{create:async request=>{
      prompts.push(request.messages[0].content);
      modelCalls++;
      if(options.providerFailure)throw Error('connection interrupted');
      return {stop_reason:options.stopReason||'end_turn',model:'test-model',usage:{input_tokens:100,output_tokens:30},content:[{type:'text',text:JSON.stringify({tasks:[{passed:options.claimPassed??true,verdict:'Goed',corrected:'Ik kom later.',errors:[],scores:options.scores||{inhoud:3,woorden:2,grammatica:2,spelling:2,samenhang:1}}]})}]};
    }}};
  }
  const values={
    accounts:options.accounts??true,caller:async()=>options.guest?null:{id:'test-user'},
    checkCost:n=>Math.max(1,Math.ceil(n/3)),LIMIT:20,FREE:2,visitor:()=> 'test-visitor',sameOrigin:()=>true,
    useChecks:async(_id,cost,lim)=>{usage.push(cost);lims.push(lim);return options.userLeft??19},
    useFree:async(_id,cost)=>{usage.push(cost);return options.freeLeft??1},
    useTotal:async cost=>{quotas.push(cost);return 'total' in options?options.total:399},
    PLUS:60,plusOn:!!options.pay,
    plusOf:async()=>{if(options.plusFails)throw Error('down');return options.plan??null},
    isPlus:p=>!!p&&['active','trialing','past_due'].includes(p.status)
  };
  const context=vm.createContext({process:{env:{ANTHROPIC_API_KEY:'test-only'}},console:{info:x=>logs.push(x),error:x=>logs.push(x)}});
  const sdk=new vm.SyntheticModule(['default'],function(){this.setExport('default',Anthropic)},{context});
  const supa=new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value)},{context});
  const module=new vm.SourceTextModule(fs.readFileSync(new URL('api/check.js',root),'utf8'),{context});
  await module.link(name=>name==='@anthropic-ai/sdk'?sdk:supa);await module.evaluate();
  const req={method:'POST',headers:{host:'example.test',origin:'https://example.test'},body:{...(options.part?{part:options.part}:{}),tasks:[{...(options.part?{kind:options.kind||'z'}:{}),task:'Stuur een bericht',text:'Ik kom later. Personal test content.'}]}};
  if(options.tasks)req.body.tasks=options.tasks;
  const res={statusCode:200,status(n){this.statusCode=n;return this},json(body){this.body=body;return this}};
  await module.namespace.default(req,res);
  return {res,usage,quotas,logs,lims,modelCalls,prompts};
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

test('Without Plus a logged-in learner gets CHECK_LIMIT a day; with Plus PLUS_LIMIT, outside the global cap',async()=>{
  const free=await handler({pay:true,plan:null});assert.equal(free.res.statusCode,200);assert.deepEqual(free.lims,[20]);assert.deepEqual(free.quotas,[1]);
  const plus=await handler({pay:true,plan:{status:'active'}});assert.equal(plus.res.statusCode,200);assert.deepEqual(plus.lims,[60]);assert.deepEqual(plus.quotas,[]);
  const ended=await handler({pay:true,plan:{status:'canceled'}});assert.deepEqual(ended.lims,[20]);
  const off=await handler({pay:false,plan:{status:'active'}});assert.deepEqual(off.lims,[20]);
});
test('A full Plus day says limit with the Plus allowance; a failed Plus lookup grades with the free allowance',async()=>{
  const full=await handler({pay:true,plan:{status:'active'},userLeft:-1});assert.equal(full.res.statusCode,429);assert.equal(full.res.body.limit,60);assert.equal(full.res.body.plus,true);assert.equal(full.modelCalls,0);
  const down=await handler({pay:true,plusFails:true});assert.equal(down.res.statusCode,200);assert.deepEqual(down.lims,[20]);
});
test('A Plus check that fails gives the learner the check back at the Plus allowance and reserves nothing globally',async()=>{
  const r=await handler({pay:true,plan:{status:'trialing'},providerFailure:true});assert.equal(r.res.statusCode,502);assert.deepEqual(r.usage,[1,-1]);assert.deepEqual(r.lims,[60,60]);assert.deepEqual(r.quotas,[]);
});
test('Without a login only the free single checks, then a login answer',async()=>{
  const guest=await handler({guest:true});assert.equal(guest.res.statusCode,200);assert.equal(guest.res.body.free,1);
  const used=await handler({guest:true,freeLeft:-1});assert.equal(used.res.statusCode,401);assert.equal(used.res.body.error,'login');assert.equal(used.modelCalls,0);
});

test('Points decide voldoende, not the model: Schrijven A2 needs inhoud 2 and 7 of 10',async()=>{
  const low=await handler({scores:{inhoud:2,woorden:1,grammatica:1,spelling:1,samenhang:1},claimPassed:true});
  assert.equal(low.res.body.tasks[0].passed,false);
  const ok=await handler({scores:{inhoud:2,woorden:2,grammatica:1,spelling:1,samenhang:1},claimPassed:false});
  assert.equal(ok.res.body.tasks[0].passed,true);
  const noContent=await handler({scores:{inhoud:1,woorden:2,grammatica:2,spelling:2,samenhang:1}});
  assert.equal(noContent.res.body.tasks[0].passed,false);
});
test('Scores outside the scale are clamped, and inhoud 0 makes every score 0',async()=>{
  const wild=await handler({scores:{inhoud:9,woorden:-3,grammatica:'2',spelling:1.6,samenhang:null}});
  assert.deepEqual({...wild.res.body.tasks[0].scores},{inhoud:3,woorden:0,grammatica:2,spelling:2,samenhang:0});
  const zero=await handler({scores:{inhoud:0,woorden:2,grammatica:2,spelling:2,samenhang:1}});
  assert.deepEqual({...zero.res.body.tasks[0].scores},{inhoud:0,woorden:0,grammatica:0,spelling:0,samenhang:0});
  assert.equal(zero.res.body.tasks[0].passed,false);
});
test('B1 rules: a sentence task needs both points, an e-mail 70% with inhoud 2, a short spoken task 2 of 3',async()=>{
  const z1=await handler({part:'wb',kind:'z',scores:{inhoud:1,grammatica:1}});
  assert.equal(z1.res.body.tasks[0].passed,true);
  const z0=await handler({part:'wb',kind:'z',scores:{inhoud:1,grammatica:0}});
  assert.equal(z0.res.body.tasks[0].passed,false);
  const mail=await handler({part:'wb',kind:'m',scores:{inhoud:2,woorden:1,grammatica:1,spelling:1,samenhang:1}});
  assert.equal(mail.res.body.tasks[0].passed,true); // 6 of 8 >= ceil(5.6)
  const mailLow=await handler({part:'wb',kind:'m',scores:{inhoud:2,woorden:1,grammatica:1,spelling:0,samenhang:1}});
  assert.equal(mailLow.res.body.tasks[0].passed,false); // 5 of 8
  const k=await handler({part:'sb',kind:'k',scores:{inhoud:2,grammatica:0}});
  assert.equal(k.res.body.tasks[0].passed,true);
  const k1=await handler({part:'sb',kind:'k',scores:{inhoud:1,grammatica:1}});
  assert.equal(k1.res.body.tasks[0].passed,false);
});


test('Oversized answers and fields are rejected before quota or provider calls, including a late task in a batch',async()=>{
  for(const [field,limit] of [['text',2500],['form',1500],['task',1200]]){
    const tasks=[{task:'Schrijf een bericht',text:'Ik kom later.'},{task:'Tweede opdracht',text:'Nog een antwoord.',[field]:'x'.repeat(limit+1)}];
    const r=await handler({tasks});
    assert.equal(r.res.statusCode,413);assert.equal(r.res.body.error,'answer_too_long');
    assert.equal(r.res.body.field,field);assert.equal(r.res.body.index,1);assert.equal(r.res.body.limit,limit);
    assert.deepEqual(r.usage,[]);assert.deepEqual(r.quotas,[]);assert.equal(r.modelCalls,0);
  }
  const b1=await handler({part:'wb',tasks:[{kind:'z',task:'x'.repeat(2001),text:'ik werk'}]});
  assert.equal(b1.res.body.limit,2000);assert.deepEqual(b1.usage,[]);
});
test('Boundary-length answers, form and task reach the model intact',async()=>{
  const text='a'.repeat(2491)+'END-MARK!',form='b'.repeat(1491)+'FORM-END!',task='c'.repeat(1191)+'TASK-END!';
  assert.equal(text.length,2500);assert.equal(form.length,1500);assert.equal(task.length,1200);
  const r=await handler({tasks:[{task,text,form}]});
  assert.equal(r.res.statusCode,200);assert.equal(r.modelCalls,1);
  for(const full of [text,form,task])assert.ok(r.prompts[0].includes(full));
});
