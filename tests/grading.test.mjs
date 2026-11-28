import test from 'node:test';
import * as spell from '../api/_spell.js';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {root} from './app-harness.mjs';

async function handler(options={}){
  const guards=[],usage=[],quotas=[],logs=[],lims=[],periods=[],stamps=[],models=[],spends=[],prompts=[];let modelCalls=0;
  class APIError extends Error{}
  class AuthenticationError extends APIError{}
  class RateLimitError extends APIError{}
  class Anthropic {
    static APIError=APIError;static AuthenticationError=AuthenticationError;static RateLimitError=RateLimitError;
    beta={messages:{create:async(body)=>{
      modelCalls++;models.push(body.model);prompts.push(body.messages[0].content);
      if(options.providerFailure)throw Error('connection interrupted');
      return {stop_reason:options.stopReason||'end_turn',model:'test-model',usage:{input_tokens:100,output_tokens:30},content:[{type:'text',text:JSON.stringify({tasks:Array.from({length:options.taskOutputs??options.tasksCount??1},()=>({passed:options.claimPassed??true,verdict:'Goed',corrected:'Ik kom later.',errors:options.errors||[],scores:options.scores||{inhoud:3,woorden:2,grammatica:2,spelling:2,samenhang:1},...('spelfouten' in options?{spelfouten:options.spelfouten}:{})}))})}]};
    }}};
  }
  const values={
    accounts:options.accounts??true,caller:async()=>options.guest?null:{id:'test-user'},
    checkCost:n=>Math.max(1,Math.ceil(n/3)),LIMIT:7,FREE:2,visitor:()=> 'test-visitor',sameOrigin:()=>true,
    useChecks:async(_id,cost,lim,period,stamp)=>{usage.push(cost);lims.push(lim);periods.push(period);stamps.push(stamp);return options.userLeft??lim-cost},
    useFree:async(_id,cost,stamp)=>{usage.push(cost);stamps.push(stamp);return options.freeLeft??1},
    useTotal:async cost=>{quotas.push(cost);return 'total' in options?options.total:399},
    addSpend:async(model,u)=>{spends.push([model,u.input_tokens,u.output_tokens]);if(options.spendFails)throw Error('down');return true},
    bonusFor:async()=>{if(options.bonusFails)throw Error('down');return options.bonus??0},
    PLUS:60,plusOn:!!options.pay,
    PLUS_MONTH:200,OPUS_MONTH:8,PASS_TOTAL:250,PASS_OPUS:15,YEAR_TOTAL:600,YEAR_OPUS:30,monthOf:()=>'2026-11-01',amsterdamDay:()=>'2026-11-25',
    gradingDigest:JSON.stringify,gradingReceipt:options.receipt||(()=>{throw Error("unexpected receipt")}),
    useGuard:async(k,_d,cost,lim)=>{guards.push([k,cost]);if(options.guardFails)throw Error('down');const g=options.guard?.[k[0]];return g??lim-cost},

    plusFor:async()=>{if(options.plusFails)throw Error('down');return options.plan??null},
    coversLevel:(p,level)=>!!p&&['active','trialing','past_due'].includes(p.status)&&(p.level==='B1'||(p.level||'A2')==='A2'&&level==='A2')
  };
  const context=vm.createContext({process:{env:{ANTHROPIC_API_KEY:'test-only',...(options.env||{})}},AbortSignal,console:{info:x=>logs.push(x),error:x=>logs.push(x)}});
  const sdk=new vm.SyntheticModule(['default'],function(){this.setExport('default',Anthropic)},{context});
  const supa=new vm.SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value)},{context});
  const module=new vm.SourceTextModule(fs.readFileSync(new URL('api/check.js',root),'utf8'),{context});
  const spellMod=new vm.SyntheticModule(Object.keys(spell),function(){for(const [key,value]of Object.entries(spell))this.setExport(key,value)},{context});
  await module.link(name=>name==='@anthropic-ai/sdk'?sdk:name==='./_spell.js'?spellMod:supa);await module.evaluate();
  const req={method:'POST',headers:{host:'example.test',origin:'https://example.test'},body:{...(options.requestId?{requestId:options.requestId}:{}),...(options.part?{part:options.part}:{}),tasks:Array.from({length:options.tasksCount||1},()=>({...(options.part||options.kind?{kind:options.kind||'z'}:{}),task:'Stuur een bericht',text:options.text??'Ik kom later. Personal test content.'}))}};
  const response=()=>({statusCode:200,setHeader(){},status(n){this.statusCode=n;return this},json(body){this.body=body;return this}});
  const res=response();
  await module.namespace.default(req,res);
  const retry=options.repeat?response():null;
  if(retry)await module.namespace.default(req,retry);
  return {res,retry,usage,quotas,logs,lims,periods,stamps,modelCalls,models,spends,prompts};
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
    const cryptoModule=new vm.SyntheticModule(['createHash','createHmac','randomBytes','timingSafeEqual'],function(){for(const n of ['createHash','createHmac','randomBytes','timingSafeEqual'])this.setExport(n,()=>{})},{context});
    await source.link(()=>cryptoModule);await source.evaluate();
    await assert.rejects(source.namespace.useTotal(1));
    await assert.rejects(source.namespace.useChecks('user',1));
    await assert.rejects(source.namespace.useFree('visitor',1));
  }
});

test('Free accounts use the one-time allowance; covered Plus levels keep the daily allowance',async()=>{
  const free=await handler({pay:true,plan:null});assert.equal(free.res.statusCode,200);assert.deepEqual(free.lims,[7]);assert.deepEqual(free.periods,['once']);assert.deepEqual(free.quotas,[1]);
  const plus=await handler({pay:true,plan:{status:'active'}});assert.equal(plus.res.statusCode,200);assert.deepEqual(plus.lims,[60]);assert.deepEqual(plus.periods,['day']);assert.deepEqual(plus.quotas,[]);
  const ended=await handler({pay:true,plan:{status:'canceled'}});assert.deepEqual(ended.lims,[7]);
  const off=await handler({pay:false,plan:{status:'active'}});assert.deepEqual(off.lims,[7]);
});
test('A full Plus day says limit with the Plus allowance; a failed Plus lookup grades with the free allowance',async()=>{
  const full=await handler({pay:true,plan:{status:'active'},userLeft:-1});assert.equal(full.res.statusCode,429);assert.equal(full.res.body.limit,60);assert.equal(full.res.body.plus,true);assert.equal(full.modelCalls,0);
  const down=await handler({pay:true,plusFails:true});assert.equal(down.res.statusCode,200);assert.deepEqual(down.lims,[7]);
});
test('A Plus check that fails gives the learner the check back at the Plus allowance and reserves nothing globally',async()=>{
  const r=await handler({pay:true,plan:{status:'trialing'},providerFailure:true});assert.equal(r.res.statusCode,502);assert.deepEqual(r.usage,[1,-1]);assert.deepEqual(r.lims,[60,60]);assert.deepEqual(r.quotas,[]);
  assert.equal(r.stamps[0],r.stamps[1]);assert.deepEqual(r.periods,['day','day']);
});
test('An A2 subscriber uses the free one-time B1 budget; a full free speaking exam costs six units',async()=>{
  const b1=await handler({pay:true,plan:{status:'active',level:'A2'},part:'sb'});assert.deepEqual(b1.periods,['once']);assert.deepEqual(b1.lims,[7]);
  const exam=await handler({part:'sp',tasksCount:16});assert.equal(exam.res.statusCode,200);assert.deepEqual(exam.usage,[6]);assert.equal(exam.res.body.period,'once');assert.equal(exam.res.body.left,1);
  const failed=await handler({providerFailure:true});assert.deepEqual(failed.periods,['once','once']);assert.equal(failed.stamps[0],failed.stamps[1]);
  const cap=await handler({guest:true,freeLeft:-2});assert.equal(cap.res.statusCode,429);assert.equal(cap.res.body.error,'busy');
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

test('A2 Plus cannot grant B1 paid checks; B1 Plus covers both levels',async()=>{
  for(const part of ['wb','sb']){
    const a2=await handler({pay:true,plan:{status:'active',level:'A2'},part});
    assert.deepEqual(a2.lims,[7]);assert.deepEqual(a2.quotas,[1]);
    const b1=await handler({pay:true,plan:{status:'active',level:'B1'},part});
    assert.deepEqual(b1.lims,[60]);assert.deepEqual(b1.quotas,[]);
  }
  const a2=await handler({pay:true,plan:{status:'active',level:'B1'}});
  assert.deepEqual(a2.lims,[60]);
  const unknown=await handler({pay:true,plan:{status:'active',level:'unknown'},part:'wb'});
  assert.deepEqual(unknown.lims,[7]);
});

test('Free checks use GRADING_MODEL_FREE (Haiku); paid practice GRADING_MODEL (Sonnet), a paid proefexamen GRADING_MODEL_EXAM (Opus)',async()=>{
  const paid={pay:true,plan:{status:'active',level:'B1'}};
  assert.deepEqual((await handler(paid)).models,['claude-sonnet-5-5']);
  assert.deepEqual((await handler({...paid,tasksCount:3})).models,['claude-sonnet-5-5']);
  assert.deepEqual((await handler({...paid,tasksCount:4})).models,['claude-opus-5-5']);
  assert.deepEqual((await handler({...paid,part:'sp',tasksCount:16})).models,['claude-opus-5-5']);
  assert.deepEqual((await handler()).models,['claude-sonnet-5-5'],'the first free checks show the good grading');
  assert.deepEqual((await handler({userLeft:4})).models,['claude-haiku-5-5'],'after two, the free model');
  assert.deepEqual((await handler({tasksCount:4})).models,['claude-haiku-5-5'],'never a proefexamen on the paid model for free');
  assert.deepEqual((await handler({guest:true})).models,['claude-sonnet-5-5'],'a guest trial shows the good grading');
  assert.deepEqual((await handler({pay:true,plan:{status:'active',level:'A2'},part:'sb',userLeft:4})).models,['claude-haiku-5-5'],'a level Plus does not cover is free');
  const env={GRADING_MODEL:'claude-haiku-5-5',GRADING_MODEL_EXAM:' claude-sonnet-5-5 ',GRADING_MODEL_FREE:'claude-sonnet-5-5'};
  assert.deepEqual((await handler({...paid,env})).models,['claude-haiku-5-5']);
  assert.deepEqual((await handler({...paid,env,tasksCount:4})).models,['claude-sonnet-5-5']);
  assert.deepEqual((await handler({env,userLeft:4})).models,['claude-sonnet-5-5']);
});

test('Every graded call records its tokens per model, and a failing record never fails the grading',async()=>{
  const r=await handler();assert.deepEqual(r.spends,[['test-model',100,30]]);assert.equal(r.res.statusCode,200);
  const f=await handler({spendFails:true});assert.equal(f.res.statusCode,200);assert.deepEqual(f.usage,[1]);
  const refused=await handler({stopReason:'refusal'});assert.equal(refused.spends.length,1);
});

test('Invited friends add their extra checks to the free allowance; a failed lookup keeps the plain seven; Plus is untouched',async()=>{
  assert.deepEqual((await handler({bonus:6})).lims,[13]);
  assert.deepEqual((await handler({bonusFails:true})).lims,[7]);
  assert.deepEqual((await handler({bonus:6,pay:true,plan:{status:'active'}})).lims,[60]);
});

test('A2 forms are scored as DUO scores forms: inhoud, woorden and spelling, 7 points, voldoende at 5',async()=>{
  const ok=await handler({kind:'f',claimPassed:false,scores:{inhoud:2,woorden:1,grammatica:2,spelling:2,samenhang:1}});
  assert.deepEqual({...ok.res.body.tasks[0].scores},{inhoud:2,woorden:1,spelling:2});
  assert.equal(ok.res.body.tasks[0].passed,true);
  const low=await handler({kind:'f',claimPassed:true,scores:{inhoud:2,woorden:1,grammatica:2,spelling:1,samenhang:1}});
  assert.equal(low.res.body.tasks[0].passed,false); // 4 of 7
  const text=await handler({claimPassed:true,scores:{inhoud:2,woorden:1,grammatica:1,spelling:1,samenhang:1}});
  assert.equal(text.res.body.tasks[0].passed,false); // a text keeps 10 points: 6 is not enough
});
test('Spreken A2: voldoende follows from the points, not from what the model says',async()=>{
  const said=await handler({part:'sp',claimPassed:true,scores:{inhoud:1,woorden:2,grammatica:2,samenhang:1}});
  assert.equal(said.res.body.tasks[0].passed,false); // inhoud below 2
  const few=await handler({part:'sp',claimPassed:true,scores:{inhoud:2,woorden:1,grammatica:1,samenhang:0}});
  assert.equal(few.res.body.tasks[0].passed,false); // 4 of 8
  const five=await handler({part:'sp',claimPassed:true,scores:{inhoud:2,woorden:1,grammatica:1,samenhang:1}});
  assert.equal(five.res.body.tasks[0].passed,false); // 5 of 8: without pronunciation and fluency that is not enough
  const good=await handler({part:'sp',claimPassed:false,scores:{inhoud:2,woorden:2,grammatica:1,samenhang:1}});
  assert.equal(good.res.body.tasks[0].passed,true); // 6 of 8
});

test('Spreken A2: a complete answer of a few words keeps full inhoud but cannot reach voldoende',async()=>{
  const full={inhoud:3,woorden:2,grammatica:2,samenhang:1};
  const short=await handler({part:'sp',text:'Met de trein.',scores:full});
  assert.deepEqual({...short.res.body.tasks[0].scores},{inhoud:3,woorden:1,grammatica:1,samenhang:0});
  assert.equal(short.res.body.tasks[0].passed,false);
  assert.equal(short.res.body.tasks[0].limitedLanguageEvidence,true);
  assert.match(short.res.body.tasks[0].verdict,/Je antwoord is kort/);
  const longer=await handler({part:'sp',text:'Ik ga met de trein, want dat is snel.',scores:full});
  assert.deepEqual({...longer.res.body.tasks[0].scores},full);
  assert.equal(longer.res.body.tasks[0].passed,true);
  assert.doesNotMatch(longer.res.body.tasks[0].verdict,/kort/);
});
test('One spelling edit is returned once even if the model describes it with different context', async()=>{
  const result=await handler({errors:[
    {wrong:'De sleutel ligd onder de mat',right:'De sleutel ligt onder de mat',why:'Schrijf ligt.',kind:'spelling'},
    {wrong:'ligd',right:'ligt',why:'Schrijf ligt.',kind:'spelling'},
    {wrong:'water geeven',right:'water geven',why:'Schrijf één e.',kind:'spelling'},
  ]});
  const grade=result.res.body.tasks[0];
  assert.equal(grade.errors.length,2);
  assert.ok(grade.errors.every(error=>error.kind==='spelling'));
  assert.equal(grade.scores.spelling,2);
});

test('An authenticated exam retry returns its original grade without another debit or provider call',async()=>{
  let cached;
  const actions=[];
  const r=await handler({part:'sp',requestId:'56143131-9e52-435c-a52a-2697864bf313',repeat:true,receipt:async(owner,id,digest,action,result)=>{
    assert.equal(owner,'test-user');
    assert.equal(id,'56143131-9e52-435c-a52a-2697864bf313');
    actions.push(action);
    if(action==='save')cached=result;
    if(action==='claim')return cached?{state:'done',result:cached}:{state:'new'};
  }});
  assert.deepEqual(actions,['claim','save','claim']);
  assert.deepEqual(JSON.parse(JSON.stringify(r.retry.body)),JSON.parse(JSON.stringify({...r.res.body,replayed:true})));
  assert.equal(r.modelCalls,1);
  assert.deepEqual(r.usage,[1]);
});

test('A concurrent grading retry and a failed receipt store cannot claim a second check',async()=>{
  const requestId='56143131-9e52-435c-a52a-2697864bf313';
  const pending=await handler({requestId,receipt:async()=>({state:'pending'})});
  assert.equal(pending.res.statusCode,409);assert.equal(pending.res.body.error,'check_pending');
  assert.deepEqual(pending.usage,[]);assert.equal(pending.modelCalls,0);
  const failed=await handler({requestId,receipt:async()=>{throw Error('unavailable')}});
  assert.equal(failed.res.statusCode,503);assert.deepEqual(failed.usage,[]);assert.equal(failed.modelCalls,0);
});

test('A partial model response is retryable and cannot become a permanent exam receipt',async()=>{
  const actions=[];
  const result=await handler({tasksCount:4,taskOutputs:3,requestId:'56143131-9e52-435c-a52a-2697864bf313',
    receipt:async(_owner,_id,_digest,action)=>{actions.push(action);return {state:'new'}}});
  assert.equal(result.res.statusCode,502);
  assert.deepEqual(actions,['claim','discard']);
});

test('Schrijven A2 spelling points follow DUO\'s count, never above the model; the word list gives hints',async()=>{
  const sp=(n)=>Array.from({length:n},(_,i)=>({wrong:'fout'+i,right:'goed'+i,why:'Spelling.',kind:'spelling'}));
  const listed=await handler({errors:sp(4),text:'Ik heb gisteren een brief geschrijft. Mischien kom ik.'});
  assert.equal(listed.res.body.tasks[0].scores.spelling,1,'four spelling mistakes listed: 1 point, though the model gave 2');
  assert.match(listed.prompts[0],/niet in onze Nederlandse woordenlijst staan[^\n]*geschrijft, Mischien/);
  const counted=await handler({errors:sp(1),spelfouten:7});
  assert.equal(counted.res.body.tasks[0].scores.spelling,0,'its own count of all spelling mistakes counts too');
  const lower=await handler({errors:[],spelfouten:0,scores:{inhoud:3,woorden:2,grammatica:2,spelling:1,samenhang:1}});
  assert.equal(lower.res.body.tasks[0].scores.spelling,1,'the model may still take a point (a misspelled name, unreadable words)');
  const clean=await handler({text:'Beste Anna,\nIk kom morgen met de fiets naar je huisje.\nGroeten,\nFatima'});
  assert.doesNotMatch(clean.prompts[0],/woordenlijst/,'names, greetings and diminutives are no hints');
});
