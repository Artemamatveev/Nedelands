import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {app,storage,root} from './app-harness.mjs';

const context=vm.createContext({crypto:webcrypto});
vm.runInContext(fs.readFileSync(new URL('study/progress-v1.js',root),'utf8'),context);
const merge=(base,local,remote)=>JSON.parse(vm.runInContext(`JSON.stringify(rebaseProgress(${JSON.stringify(base)},${JSON.stringify(local)},${JSON.stringify(remote)}))`,context));
const clone=x=>JSON.parse(JSON.stringify(x));

test('Offline changes to different items and exam attempts all survive',()=>{
  const base={items:{a:{r:2,w:0}},res:{lz:[{at:1,pc:80}]}},local=clone(base),remote=clone(base);
  local.items.a.r++;remote.items.b={r:1,w:0};
  local.res.lz.push({at:2,pc:90});remote.res.lz.push({at:3,pc:100});
  const result=merge(base,local,remote);
  assert.equal(result.items.a.r,3);assert.equal(result.items.b.r,1);
  assert.deepEqual(result.res.lz.map(x=>x.at),[1,2,3]);
});
test('Two independent answers to the same item both count',()=>{
  const base={items:{a:{r:2,w:0}}},local=clone(base),remote=clone(base);
  local.items.a.r++;remote.items.a.r++;remote.items.a.w++;
  assert.deepEqual(merge(base,local,remote).items.a,{r:4,w:1});
});
test('Removed words and errors stay removed while other words are added offline',()=>{
  const base={words:[{w:'huis'}],errs:[{r:'Ik ben'}]},local={words:[],errs:[]},remote={words:[{w:'huis'},{w:'boom'}],errs:[{r:'Ik ben'},{r:'Hij is'}]};
  assert.deepEqual(merge(base,local,remote).words,[{w:'boom'}]);
  assert.deepEqual(merge(base,local,remote).errs,[{r:'Hij is'}]);
});
test('Newer days and overlapping streaks do not move backwards',()=>{
  const base={last:10,streak:3,day:{d:10,done:[]}},local={last:11,streak:4,day:{d:11,done:['a']}},remote={last:12,streak:5,day:{d:12,done:['b']}};
  const result=merge(base,local,remote);assert.equal(result.last,12);assert.equal(result.streak,5);assert.deepEqual(result.day,{d:12,done:['b']});
});

function channel(initial,local,base){
  let row=initial&&{data:clone(initial),t:initial.t||1};
  let state=clone(local),frame=base?{base:clone(base)}:{};
  let writes=0,dropAck=false,race=null,prepareError=false;
  const io={device:webcrypto.randomUUID(),active:()=>true,current:()=>state,frame:()=>frame,
    read:async()=>row&&clone(row),first:(a,b)=>merge({},a,b),
    prepare:async pending=>{if(prepareError)throw Error('storage failed');frame.pending=clone(pending)},
    write:async(before,target)=>{writes++;if(race){row={data:race,t:race.t};race=null;return false}row={data:clone(target),t:target.t};if(dropAck){dropAck=false;throw Error('ack lost')}return true},
    ack:pending=>{state=merge(pending.local,state,pending.target);frame={base:clone(pending.target)}},
    accept:remote=>{state=clone(remote);frame={base:clone(remote)}}};
  return {io,state:()=>state,row:()=>row,frame:()=>frame,writes:()=>writes,dropAck:()=>dropAck=true,race:value=>race=value,failPrepare:()=>prepareError=true,edit:fn=>fn(state)};
}
const sync=io=>context.syncProgress(io);
test('Initial insert finishes in one write without changing the pending input snapshot',async()=>{
  const c=channel(null,{items:{a:{r:1}},t:1});await sync(c.io);
  assert.equal(c.writes(),1);assert.equal(c.row().data.items.a.r,1);assert.equal(c.frame().pending,undefined);
});
test('Retry after the server committed but acknowledgement was lost does not duplicate answers',async()=>{
  const base={items:{a:{r:1}},t:1},local={items:{a:{r:2}},t:2};
  const c=channel(base,local,base);c.dropAck();await assert.rejects(sync(c.io));
  assert.equal(c.row().data.items.a.r,2);assert.ok(c.frame().pending);
  c.edit(s=>{s.items.a.r++;s.t++});await sync(c.io);
  assert.equal(c.row().data.items.a.r,3);assert.equal(c.writes(),2);
});
test('A racing server update is merged after the conditional write rejects the old version',async()=>{
  const base={items:{a:{r:1}},t:1},c=channel(base,{items:{a:{r:2}},t:2},base);
  c.race({items:{a:{r:1},b:{r:1}},t:3});await sync(c.io);
  assert.equal(c.writes(),2);assert.equal(c.row().data.items.a.r,2);assert.equal(c.row().data.items.b.r,1);
});
test('Nothing is sent if the retry journal cannot be stored',async()=>{
  const c=channel(null,{items:{a:{r:1}},t:1});c.failPrepare();await assert.rejects(sync(c.io));assert.equal(c.writes(),0);
});

export function supabaseServer(){
  const rows=new Map();let fail=false,writes=0;
  const client={auth:{updateUser:async()=>({}),signOut:async()=>({})},from(name){
    const filters={};let op='read',payload;
    const query={
      eq(k,v){filters[k]=v;return query},select(){return op==='update'?execute():query},
      maybeSingle:async()=>name==='progress'?fail?{error:{message:'offline'}}:{data:rows.get(filters.user_id)?clone(rows.get(filters.user_id)):null}:{data:{n:0}},
      update(data){op='update';payload=data;return query},
      insert:async data=>{if(fail)return {error:{message:'offline'}};if(rows.has(data.user_id))return {error:{code:'23505'}};writes++;rows.set(data.user_id,clone(data));return {error:null}}
    };
    async function execute(){if(fail)return {error:{message:'offline'}};const row=rows.get(filters.user_id);if(!row||row.t!==filters.t)return {data:[]};writes++;rows.set(filters.user_id,{...row,...clone(payload)});return {data:[{t:payload.t}]}}
    return query;
  }};
  return {client,rows,offline:value=>fail=value,writes:()=>writes};
}
export async function signIn(a,server,id){a.context.testClient=server.client;a.context.testId=id;await a.run('acc.sb=testClient;acc.cfg={url:"https://example.supabase.co",limit:20,login:[]};setUser({id:testId})');await a.flush();}

test('Normal account entry, offline edits and another device preserve both sets of answers',async()=>{
  const server=supabaseServer(),a=await app(),b=await app();
  await signIn(a,server,'account-a');await signIn(b,server,'account-a');
  server.offline(true);
  a.run('S.items.reading={r:1};save()');await a.run('push()');
  assert.equal(a.run('acc.sync'),'Synchroniseren mislukt');
  b.run('S.items.grammar={r:1};save()');server.offline(false);await b.run('push()');await a.run('push()');
  assert.equal(server.rows.get('account-a').data.items.reading.r,1);
  assert.equal(server.rows.get('account-a').data.items.grammar.r,1);
});
test('Old per-device progress migrates only to its own account and account switches stay isolated',async()=>{
  const old={items:{privateAnswer:{r:5}},t:100,me:{name:'Account A'}};
  const store=storage({'ww-v1':JSON.stringify(old),'ww-acc':'account-a'});
  const a=await app({storage:store}),server=supabaseServer();
  assert.equal(a.run('S.items.privateAnswer'),undefined);
  await signIn(a,server,'account-a');assert.equal(a.run('S.items.privateAnswer.r'),5);
  await a.run('setUser(null)');assert.equal(a.run('S.me?.name'),undefined);
  await signIn(a,server,'account-b');assert.equal(a.run('S.items.privateAnswer'),undefined);
  await signIn(a,server,'account-a');assert.equal(a.run('S.items.privateAnswer.r'),5);
});


test('A receipt from the previous session is honoured after the browser gets a new tab id',async()=>{
  const base={items:{a:{r:1}},t:1},c=channel(base,{items:{a:{r:2}},t:2},base);
  c.dropAck();await assert.rejects(sync(c.io));c.io.device=webcrypto.randomUUID();await sync(c.io);
  assert.equal(c.row().data.items.a.r,2);assert.equal(c.writes(),1);
});

test('Old generated answers remain attached to their text when device arrays have a different order',async()=>{
  const a=await app();
  a.run(`
    const textA=["Tekst A",[["Vraag A","Antwoord A","B","C"]]];
    const textB=["Tekst B",[["Vraag B","Antwoord B","A","C"]]];
    const left=migrateGenerated({items:{"lz|g0.0":{r:2}},gen:{lz:[textA],ls:[]}});
    const rightState=migrateGenerated({items:{"lz|g0.0":{r:3}},gen:{lz:[textB,textA],ls:[]}});
    S=rebaseProgress({items:{},gen:{lz:[],ls:[]}},left,rightState);addGenerated();
  `);
  const answer=label=>a.run(`S.items[ITEMS.find(q=>q.text===${JSON.stringify(label)}).k].r`);
  assert.equal(answer('Tekst A'),2);assert.equal(answer('Tekst B'),3);
  assert.equal(a.run('ITEMS.filter(q=>q.k.startsWith("lz|g:")).length'),2);
});

test('The previous local account remains usable offline while its session cannot refresh',async()=>{
  const saved={items:{offlineAnswer:{r:4}},t:100};
  const store=storage({
    'ww-active-owner':'account-a',
    'sb-example-auth-token':JSON.stringify({user:{id:'account-a'},expires_at:1}),
    'ww-progress-v2:account-a':JSON.stringify({data:saved,frame:{base:saved},version:1}),
  });
  const a=await app({storage:store,fetch:async()=>{throw Error('offline')}});
  assert.equal(a.run('S.items.offlineAnswer.r'),4);assert.equal(a.run('progressOwner'),'account-a');
  assert.equal(a.run('cloud'),null);
  a.run('S.items.newAnswer={r:1};save()');
  await a.run('setUser(null)');
  assert.equal(a.run('S.items.offlineAnswer'),undefined);
  assert.equal(store.getItem('ww-active-owner'),null);
  const b=await app({storage:store});assert.equal(b.run('progressOwner'),'guest');
  assert.equal(JSON.parse(store.getItem('ww-progress-v2:account-a')).data.items.newAnswer.r,1);
});

test('An expired cached session for another account never selects the old account data',async()=>{
  const store=storage({
    'ww-active-owner':'account-a',
    'sb-example-auth-token':JSON.stringify({user:{id:'account-b'},expires_at:1}),
    'ww-progress-v2:account-a':JSON.stringify({data:{items:{privateAnswer:{r:1}},t:100},frame:{},version:1}),
  });
  const a=await app({storage:store});assert.equal(a.run('progressOwner'),'guest');assert.equal(a.run('S.items.privateAnswer'),undefined);
});
