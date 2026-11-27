// Smoke test in a real browser: the homepage and the app open without errors, fit a phone screen, switch to Arabic
// (right to left), show the sample question and open the KNM theme list; axe-core finds no accessibility problem on any
// kind of screen, light and dark, and the white tab name on the oranje lens has at least 4.5:1. Runs where Playwright and Chromium are
// installed (the "browser" job in CI sets BROWSER_TESTS=1, so there a missing browser fails instead of skipping).
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const TYPES = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.mp3':'audio/mpeg','.txt':'text/plain'};
let chromium = null;
try { chromium = createRequire(import.meta.url)('playwright')[process.env.BROWSER_ENGINE || 'chromium']; } catch {}

// state.knm: another version of data/knm.js in the page's address, as after an update
function serve(state = {}) {
  const server = http.createServer(async (req, res) => {
    if (state.disconnected) { req.destroy(); return; }
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (state.holdApp && (p === '/oefenen' || p === '/oefenen.html')) await state.holdApp;
    if (state.workerRevision && p === '/sw.js') {
      res.writeHead(200, {'content-type':TYPES['.js']});
      return res.end(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8')+'\n// fixture revision '+state.workerRevision);
    }
    if (state.knm && (p === '/oefenen' || p === '/oefenen.html')) {
      res.writeHead(200, {'content-type': TYPES['.html']});
      return res.end(fs.readFileSync(path.join(ROOT, 'oefenen.html'), 'utf8').replace(/\/data\/knm\.js\?v=[0-9a-f]+/, '/data/knm.js?v=' + state.knm));
    }
    if (p === '/api/config') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify(state.config || {})); }
    if (p === '/api/allowance') { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify(state.allowance || {free:2})); }
    if (p === '/api/plus' && Object.hasOwn(state, 'plus')) { res.writeHead(200, {'content-type':'application/json'}); return res.end(JSON.stringify({plus:state.plus})); }
    if (p === '/api/admin' && state.admin) {
      state.adminAuth = req.headers.authorization || '';
      res.writeHead(200, {'content-type': 'application/json'}); return res.end(JSON.stringify(state.admin));
    }
    if (p === '/api/group' && state.admin) { res.writeHead(200, {'content-type': 'application/json'}); return res.end(JSON.stringify({groups: [{name: 'Taalschool', code: 'ABCDEFGH', level: 'B1', seats: 20, until: '2027-06-30', teacher: 'docent@school.nl', members: 3}]})); }
    if (p === '/api/event' && state.events) {
      let b = ''; req.on('data', d => b += d); req.on('end', () => { state.events.push(JSON.parse(b)); res.writeHead(state.fail ? 502 : 204); res.end(); }); return;
    }
    if (p.startsWith('/api/')) { res.writeHead(404); return res.end(); }
    if (p === '/') p = '/index.html';
    let f = path.join(ROOT, path.normalize(p));
    if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html'; // cleanUrls, as on Vercel
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'content-type': TYPES[path.extname(f)] || 'application/octet-stream'});
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

async function page(browser, base, {lang, ...opt} = {}) {
  const ctx = await browser.newContext({viewport:{width:390, height:844}, isMobile:true, hasTouch:true, serviceWorkers:'block', ...opt});
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.addInitScript(l => { localStorage.setItem('ww-welcome', '1'); if (l) localStorage.setItem('ww-ui', l); }, lang || null);
  return {p, errors, ctx, go: u => p.goto(base + u)};
}
const overflow = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test('Legacy public addresses move progress to the main site and stop offering practice', async t => {
  let browser;
  try { browser=chromium&&await chromium.launch(); } catch(e) { if(process.env.BROWSER_TESTS)throw e; }
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`;
  try {
    for(const host of ['bittertalen.vercel.app','nedelands.vercel.app']){
      const s=await page(browser,base,{});
      try {
        await s.ctx.route(/https:\/\/(?:bittertalen\.nl|(?:bittertalen|nedelands)\.vercel\.app)\//, async route=>{
          const u=new URL(route.request().url());
          const response=await route.fetch({url:base+u.pathname+u.search});await route.fulfill({response});
        });
        await s.p.addInitScript(()=>{
          if(location.hostname.endsWith('.vercel.app'))localStorage.setItem('ww-v1',JSON.stringify({items:{'knm|0':{r:2,w:1,b:1,d:10}},words:[{w:'de fiets',en:'bicycle'}],streak:3}));
        });
        await s.p.goto(`https://${host}/?open=a2`);
        await s.p.waitForURL(u=>u.hostname==='bittertalen.nl'&&u.pathname==='/oefenen');
        await s.p.locator('#mvdone').waitFor();
        assert.equal(await s.p.evaluate(()=>S.items['knm|0'].r),2);assert.equal(await s.p.evaluate(()=>S.words[0].w),'de fiets');
        await s.p.locator('#mvdone').click();await s.p.evaluate(()=>build('knm',{...SEC.find(s=>s.id==='knm'),n:3}));
        assert.equal(await s.p.locator('#play').isVisible(),true);assert.deepEqual(s.errors,[]);
      } finally {await s.ctx.close()}
    }
    const s=await page(browser,base,{});
    try {
      await s.ctx.route('https://bittertalen.vercel.app/**',async route=>{const u=new URL(route.request().url());await route.fulfill({response:await route.fetch({url:base+u.pathname+u.search})})});
      await s.p.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));
      await s.p.goto('https://bittertalen.vercel.app/oefenen');await s.p.locator('#move ol').waitFor();
      assert.equal(await s.p.locator('#mvlater').count(),0);
      await s.p.evaluate(()=>{home();build('knm');startExam('knm',true)});
      assert.equal(await s.p.locator('#play').isHidden(),true);assert.equal(await s.p.locator('#home').isHidden(),true);
      assert.equal(await s.p.locator('#move a').getAttribute('href'),'https://bittertalen.nl/');assert.deepEqual(s.errors,[]);
    } finally {await s.ctx.close()}
  } finally {await browser.close();server.close()}
});

test('Speaking exam Stop confirms completion and advances without waiting for the answer timer',async t=>{
  let browser;
  try{browser=chromium&&await chromium.launch()}catch(e){if(process.env.BROWSER_TESTS)throw e}
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`,s=await page(browser,base,{});let checks=0;
  try{
    await s.ctx.route('**/api/check',async route=>{checks++;await route.fulfill({status:503,body:'no grading expected'})});
    await s.p.addInitScript(()=>{
      window.__speech=[];
      class Recognition{
        constructor(){window.__speech.push(this);this.stops=0;this.aborts=0}
        start(){} stop(){this.stops++} abort(){this.aborts++;this.onend?.()}
        result(text){this.onresult?.({results:[[{transcript:text}]]})} end(){this.onend?.()}
      }
      Object.defineProperty(window,'SpeechRecognition',{configurable:true,value:Recognition});
      Object.defineProperty(window,'webkitSpeechRecognition',{configurable:true,value:Recognition});
    });
    await s.go('/oefenen');await s.p.locator('#app-loading').waitFor({state:'hidden'});
    for(const part of ['sp','sb']){
      await s.p.evaluate(p=>startExam(p,true),part);const before=await s.p.evaluate(()=>tEnd);
      const b=s.p.locator('#recb');await b.click();assert.match(await b.textContent(),/Antwoord klaar/);
      await s.p.evaluate(()=>{window.__firstSpeech=window.__speech.at(-1);window.__firstSpeech.result('Mijn familie woont in Nederland')});
      await b.click();assert.equal(await b.isDisabled(),true);assert.match(await b.textContent(),/afronden/);
      await s.p.getByRole('button',{name:'Volgende vraag'}).waitFor({timeout:2500});
      assert.equal(await b.isEnabled(),true);assert.match(await s.p.locator('#recn').textContent(),/Antwoord klaar/);
      assert.equal(await s.p.locator('#rect').textContent(),'Klaar');assert.equal(await s.p.evaluate(()=>cur.ans[0].text),'Mijn familie woont in Nederland');
      assert.equal(await s.p.evaluate(()=>tEnd),before);assert.equal(await s.p.evaluate(()=>pos),0);
      assert.equal(await overflow(s.p),0);
      const redo=s.p.getByRole('button',{name:'Opnieuw opnemen'});assert.equal(await redo.isVisible(),true);
      await redo.tap();assert.equal(await redo.isHidden(),true);assert.match(await b.textContent(),/Antwoord klaar/);
      assert.equal(await s.p.evaluate(()=>cur.ans[0].text),'Mijn familie woont in Nederland');
      await s.p.evaluate(()=>window.__speech.at(-1).result('Mijn verbeterde antwoord over mijn familie'));await b.tap();
      await s.p.evaluate(()=>window.__speech.at(-1).end());
      assert.equal(await s.p.evaluate(()=>cur.ans.length),1);assert.equal(await s.p.evaluate(()=>cur.ans[0].text),'Mijn verbeterde antwoord over mijn familie');
      assert.equal(await s.p.evaluate(()=>pos),0);assert.equal(await s.p.evaluate(()=>tEnd),before);
      if(process.env.ADMIN_SCREENSHOTS){fs.mkdirSync(process.env.ADMIN_SCREENSHOTS,{recursive:true});await s.p.screenshot({path:path.join(process.env.ADMIN_SCREENSHOTS,`speaking-ready-${part}.png`)})}
      await redo.tap();await b.tap();await s.p.evaluate(()=>window.__speech.at(-1).end());
      assert.match(await s.p.locator('#recn').textContent(),/Je vorige antwoord is bewaard/);
      assert.equal(await s.p.evaluate(()=>cur.ans[0].text),'Mijn verbeterde antwoord over mijn familie');
      await b.click();assert.equal(await s.p.evaluate(()=>pos),1);assert.equal(await s.p.locator('#spredo').isHidden(),true);
      await s.p.evaluate(()=>{window.__firstSpeech.end();window.__firstSpeech.result('Late woorden')});assert.equal(await s.p.evaluate(()=>cur.ans.length),1);
      await b.click();await s.p.evaluate(()=>window.__speech.at(-1).result('Ik heb een broer en een zus'));await b.click();
      await s.p.evaluate(()=>window.__speech.at(-1).end());assert.match(await b.textContent(),/Volgende vraag/);
      assert.equal(await s.p.evaluate(()=>cur.ans.length),2);
    }
    await s.p.evaluate(()=>startExam('sb',true));await s.p.locator('#recb').click();
    await s.p.evaluate(()=>{window.__speech.at(-1).result('Ik maak graag een afspraak');rec.start=Date.now()-rec.lim*1000;rec.end=Date.now()-1});
    await s.p.getByRole('button',{name:'Volgende vraag'}).waitFor({timeout:2500});
    assert.match(await s.p.locator('#recn').textContent(),/De tijd is om/);
    await s.p.evaluate(()=>{pos=queue.length-1;show()});await s.p.locator('#recb').click();
    await s.p.evaluate(()=>window.__speech.at(-1).result('Dit is mijn laatste antwoord'));await s.p.locator('#recb').click();
    await s.p.evaluate(()=>window.__speech.at(-1).end());assert.equal(await s.p.locator('#recb').textContent(),'Antwoorden inleveren');
    assert.equal(checks,0);assert.deepEqual(s.errors,[]);
  }finally{await s.ctx.close();await browser.close();server.close()}
});

test('Bittie opens a full-screen voice call and sends a spoken answer from the orb', async t => {
  let browser;
  try { browser=chromium&&await chromium.launch(); } catch(e) { if(process.env.BROWSER_TESTS)throw e; }
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`,s=await page(browser,base,{});
  const sent=[];
  try {
    await s.p.addInitScript(()=>{
      localStorage.setItem('bt-ai-ok','1');
      class Recognition {
        start(){window.__conversationMic=this;this.onstart?.();this.onaudiostart?.()}
        stop(){this.onend?.()}
        abort(){}
      }
      window.SpeechRecognition=Recognition;
      speechSynthesis.speak=u=>setTimeout(()=>{u.onstart?.();u.onend?.()},0);
    });
    await s.ctx.route('**/api/talk',async route=>{
      const body=route.request().postDataJSON();sent.push(body);
      await route.fulfill({json:body.go==='start' ? {token:'test',reply:'Hoi! Ik ben Bittie.'} : {reply:'Wat leuk!',done:false}});
    });
    await s.go('/oefenen?open=talk');
    await s.p.getByRole('button',{name:'Praat met Bittie'}).tap();
    const call=s.p.locator('.bittie-call'),orb=call.locator('.voice-mark-orb');
    await s.p.getByRole('heading',{name:'Bittie',exact:true}).waitFor();
    await s.p.waitForFunction(()=>document.querySelector('#recb')?.textContent.includes('Klaar'));
    assert.equal(await orb.evaluate(e=>e.parentElement.classList.contains('recording')),true);
    const box=await s.p.locator('#talk').boundingBox();
    assert.ok(box.height>=820 && box.width===390);
    assert.equal(await s.p.locator('#tin').isVisible(),true);
    await s.p.evaluate(()=>{
      const result=Object.assign([{transcript:'Ik woon in Nederland',confidence:1}],{isFinal:true});
      window.__conversationMic.onresult({resultIndex:0,results:[result]});
    });
    await orb.tap();
    await s.p.getByText('Wat leuk!',{exact:true}).waitFor();
    assert.equal(sent.find(x=>x.go==='say').history.at(-1).t,'Ik woon in Nederland');
    assert.equal(await s.p.locator('.rep').count(),2);
    await s.p.locator('#aiend').tap();
    await s.p.getByText('Gesprek gestopt',{exact:true}).waitFor();
    assert.equal(await call.count(),0);
    assert.deepEqual(s.errors,[]);
  } finally {await s.ctx.close();await browser.close();server.close()}
});

test('The homepage restores history links and inline exam examples, and the profile sorts and clears dates', async t => {
  let browser;
  try { browser=chromium&&await chromium.launch(); } catch(e) { if(process.env.BROWSER_TESTS)throw e; }
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`,s=await page(browser,base,{});
  try {
    await s.go('/#niveaus');
    await s.p.locator('#niveaus li.wide').waitFor();
    assert.equal(await s.p.locator('#niveaus li').count(),6);
    assert.equal(await s.p.locator('#module-exam .product-exam-topic').count(),5);
    // one example per exam part: reading and listening are marked like KNM, with the explanation
    for(const id of ['probeer-lezen','probeer-luisteren']){
      await s.p.locator(`#${id} > summary`).click();
      await s.p.locator(`#${id} button[data-ok="0"]`).first().click();
      await s.p.locator(`#${id} .choice.ok`).waitFor();
      assert.match(await s.p.locator(`#${id} .qfb`).textContent(),/Niet goed\. Goed is:/);
      assert.equal(await s.p.locator(`#${id} .qmore`).isVisible(),true);
    }
    assert.equal(await s.p.locator('#probeer-luisteren audio').getAttribute('src'),'/audio/1cwuhnrqcze.mp3');
    await s.p.locator('#voorbeeld-spreken > summary').click();
    await s.p.locator('#voorbeeld-spreken .specimen').waitFor();
    await s.p.locator('#probeer > summary').click();
    await s.p.locator('#probeer button[data-ok="1"]').click();
    await s.p.locator('#probeer .ok').waitFor();
    await s.p.locator('#voorbeeld > summary').click();
    await s.p.locator('#voorbeeld .specimen').waitFor();
    assert.equal(await overflow(s.p),0);
    for(const [screen, title] of [['geography','Geografie en water'],['culture','Gezicht op Delft']]){
      await s.go('/');
      await s.p.locator(`#module-history a[href="/oefenen?open=${screen}"]`).click();
      await s.p.getByRole('heading',{name:title,exact:true}).waitFor({timeout:8000});
      if(screen==='geography'){
        await s.p.locator('[data-geo]').first().click();
        await s.p.locator('#hpage').waitFor();
        await s.p.locator('#hback').click();
        await s.p.getByRole('heading',{name:title,exact:true}).waitFor();
      }else{
        await s.p.locator('#vart').click();
        assert.match(await s.p.locator('#zimg').getAttribute('src'),/\/art\/delft\.jpg$/);
        await s.p.keyboard.press('Escape');
        await s.p.locator('#vback').click();
        await s.p.getByRole('heading',{name:'Geschiedenis van Nederland',exact:true}).waitFor();
      }
    }
    await s.p.evaluate(()=>{setLvl('A2');S.me={...S.me,exams:{lz:'2027-10-28',sp:'2027-09-10'}};setTab('profiel');home()});
    const dates=s.p.locator('#pexams [data-ex]');
    assert.equal(await dates.first().getAttribute('data-ex'),'sp');
    assert.equal(await s.p.locator('#pexams [data-ex-date]').first().textContent(),'10/09/2027');
    assert.equal(await s.p.locator('#prof .profile-choice').count(),2);
    await s.p.locator('#exam-date-sp').fill('2027-11-15');
    assert.equal(await dates.first().getAttribute('data-ex'),'lz');
    assert.equal(await s.p.evaluate(()=>S.me.exams.sp),'2027-11-15');
    await s.p.locator('.exam-date-row').filter({has:s.p.locator('#exam-date-sp')}).getByRole('button',{name:'Datum wissen'}).click();
    assert.equal(await s.p.evaluate(()=>S.me.exams.sp),'');
    assert.equal(await s.p.locator('#exam-date-sp').inputValue(),'');
    assert.equal(await overflow(s.p),0);
    assert.deepEqual(s.errors,[]);
  } finally {await s.ctx.close();await browser.close();server.close()}
});

test('Quick Dutch praise never delays practice', async t => {
  let browser;
  try { browser=chromium&&await chromium.launch(); } catch(e) { if(process.env.BROWSER_TESTS)throw e; }
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`,s=await page(browser,base,{lang:'ru'});
  try {
    await s.go('/oefenen');await s.p.locator('#app-loading').waitFor({state:'hidden'});
    await s.p.evaluate(()=>{
      build('knm',{...SEC.find(s=>s.id==='knm'),n:3});
      // Hold only the decorative timer so the next-button test cannot accidentally wait for it to finish.
      window.__praiseSetTimeout=window.setTimeout;
      window.setTimeout=(fn,delay,...args)=>window.__praiseSetTimeout(fn,delay===1500?30000:delay,...args);
    });
    const right=await s.p.evaluate(()=>queue[pos].right.toLowerCase());
    const buttons=s.p.locator('#card .opt');
    const index=await buttons.evaluateAll((bs,right)=>bs.findIndex(b=>b.querySelector('.tx').textContent.trim().toLowerCase()===right),right);
    assert.ok(index>=0);await buttons.nth(index).click();
    const flash=s.p.locator('#quick-praise'),next=s.p.locator('#next');
    assert.equal(await flash.isVisible(),true);assert.equal(await flash.getAttribute('lang'),'nl');
    assert.equal(await flash.getAttribute('aria-hidden'),'true');
    assert.equal(await flash.evaluate(e=>getComputedStyle(e).pointerEvents),'none');
    assert.equal(await next.isEnabled(),true);assert.equal(await s.p.evaluate(()=>document.activeElement.id),'next');
    const phrase=await flash.getAttribute('data-phrase');
    assert.ok(['Goed zo!','Lekker bezig!','Helemaal goed!','Top!','Netjes!','Mooi zo!'].includes(phrase));
    const svg=flash.locator('svg');
    for(const width of [320,390,1280]){
      await s.p.setViewportSize({width,height:844});
      await svg.evaluate(e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=220}));
      assert.equal(await overflow(s.p),0);
      const bounds=await svg.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width,JSON.stringify(bounds));
      if(process.env.ADMIN_SCREENSHOTS){
        fs.mkdirSync(process.env.ADMIN_SCREENSHOTS,{recursive:true});
        await s.p.screenshot({path:path.join(process.env.ADMIN_SCREENSHOTS,`dutch-praise-${width}.png`)});
      }
    }
    await s.p.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await svg.evaluate(e=>getComputedStyle(e).animationName),'none');
    assert.equal(await svg.evaluate(e=>getComputedStyle(e).transform),'none');
    await next.click({timeout:1000}); // The pulse is still held for 30s: progression must be immediate.
    assert.equal(await s.p.evaluate(()=>pos),1);assert.equal(await flash.isHidden(),true);
    await s.p.evaluate(()=>{window.setTimeout=window.__praiseSetTimeout;quickPraise.show()});
    assert.equal(await flash.isVisible(),true);await s.p.waitForTimeout(900);assert.equal(await flash.isVisible(),true);await flash.waitFor({state:'hidden',timeout:2000});
    await s.p.emulateMedia({reducedMotion:'no-preference'});
    await s.p.evaluate(()=>{
      build('knm',{...SEC.find(s=>s.id==='knm'),n:3});
      window.setTimeout=(fn,delay,...args)=>window.__praiseSetTimeout(fn,delay===1500?30000:delay,...args);
    });
    const wrongRight=await s.p.evaluate(()=>queue[pos].right.toLowerCase());
    const wrongIndex=await buttons.evaluateAll((bs,right)=>bs.findIndex(b=>b.querySelector('.tx').textContent.trim().toLowerCase()!==right),wrongRight);
    await buttons.nth(wrongIndex).click();
    assert.equal(await flash.isVisible(),true);assert.equal(await flash.getAttribute('data-tone'),'try');
    assert.ok(['Wat jammer!','Helaas!','Oeps!','Geeft niks!','Nog een keer!','Volgende keer beter!'].includes(await flash.getAttribute('data-phrase')));
    assert.match(await s.p.locator('#fb').textContent(),/Goed is:/);
    assert.equal(await next.isEnabled(),true);
    for(const width of [320,390]){
      await s.p.setViewportSize({width,height:844});
      await svg.evaluate(e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=220}));
      assert.equal(await overflow(s.p),0);
      if(process.env.ADMIN_SCREENSHOTS)await s.p.screenshot({path:path.join(process.env.ADMIN_SCREENSHOTS,`dutch-retry-${width}.png`)});
    }
    await next.click({timeout:1000});assert.equal(await s.p.evaluate(()=>pos),1);assert.equal(await flash.isHidden(),true);
    await s.p.evaluate(()=>{window.setTimeout=window.__praiseSetTimeout;quickPraise.show(false)});
    assert.equal(await flash.isVisible(),true);await s.p.waitForTimeout(900);assert.equal(await flash.isVisible(),true);await flash.waitFor({state:'hidden',timeout:2000});
    await s.p.evaluate(()=>startExam('knm',true));await s.p.locator('#card .opt').first().click();
    assert.equal(await flash.isHidden(),true);
    assert.deepEqual(s.errors,[]);
  } finally {await s.ctx.close();await browser.close();server.close()}
});

test('Website home and Contact open from the installed app and return to practice', async t => {
  let browser;
  try { browser=chromium&&await chromium.launch(); } catch(e) { if(process.env.BROWSER_TESTS)throw e; }
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`;
  const s=await page(browser,base,{lang:'ru'});
  await s.p.addInitScript(()=>Object.defineProperty(navigator,'standalone',{value:true}));
  try {
    await s.go('/');await s.p.locator('#plan .step').first().waitFor();await s.p.locator('#app-loading').waitFor({state:'hidden'});
    assert.equal(new URL(s.p.url()).pathname,'/oefenen');
    await s.p.locator('#tabs [data-t="profiel"]').click();
    await s.p.locator('#site-footer a[href="/contact"]').click();
    const contact=s.p.locator('article[data-l="ru"]');
    await contact.locator('h1').waitFor();
    assert.equal(new URL(s.p.url()).pathname,'/contact');
    assert.equal(await contact.locator('h1').textContent(),'Связаться с нами');
    assert.equal(await contact.locator('.contact-actions a.write').getAttribute('href'),'mailto:hallo@bittertalen.nl');
    assert.equal(await contact.locator('.copy').count(),1);
    assert.equal(await contact.locator('a.back').getAttribute('href'),'/oefenen');
    await s.p.evaluate(()=>Promise.race([
      Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))),
      new Promise(resolve=>setTimeout(resolve,2000))
    ]));
    if(process.env.ADMIN_SCREENSHOTS){
      fs.mkdirSync(process.env.ADMIN_SCREENSHOTS,{recursive:true});
      await contact.screenshot({path:path.join(process.env.ADMIN_SCREENSHOTS,'app-contact-ru.png')});
    }
    await contact.locator('a.back').click();await s.p.locator('#tabs').waitFor();
    await s.p.locator('#app-loading').waitFor({state:'hidden'});
    await s.p.locator('#tabs [data-t="profiel"]').click();
    await s.p.evaluate(()=>{acc.admin=true;document.getElementById('site-footer').innerHTML=siteFooter()});
    const link=s.p.locator('#site-footer a[href="/?home"]');
    await s.p.waitForFunction(()=>document.querySelector('#site-footer a[href="/?home"]')?.textContent==='Главная сайта');
    assert.equal(await link.evaluate(a=>a.parentElement===document.querySelector('#site-footer a[href="/admin"]').parentElement),true);
    assert.equal(await s.p.locator('#prof > .pg a[href="/?home"]').count(),0);
    assert.equal(await link.isVisible(),true);
    assert.equal(await overflow(s.p),0);
    if(process.env.ADMIN_SCREENSHOTS){
      fs.mkdirSync(process.env.ADMIN_SCREENSHOTS,{recursive:true});
      await s.p.locator('#prof').screenshot({path:path.join(process.env.ADMIN_SCREENSHOTS,'profile-website-home.png')});
    }
    await link.click();await s.p.locator('.hero').waitFor();
    assert.equal(new URL(s.p.url()).pathname,'/');
    assert.equal(new URL(s.p.url()).search,'?home');
    await s.p.reload();await s.p.locator('.hero').waitFor();
    assert.equal(new URL(s.p.url()).pathname,'/');
    await s.p.locator('#enter').click();await s.p.locator('#plan .step').first().waitFor();
    assert.equal(new URL(s.p.url()).pathname,'/oefenen');
    // Login/payment callbacks keep priority over the explicit home request.
    await s.go('/?home&plus=stop');await s.p.locator('#plan .step').first().waitFor();
    assert.equal(new URL(s.p.url()).pathname,'/oefenen');
    assert.deepEqual(s.errors,[]);
  } finally {await s.ctx.close();await browser.close();server.close()}
});

test('iPhone dock stays attached during scroll, stale viewport metrics and rotation', async t => {
  let browser;
  try { browser=chromium&&await chromium.launch(); } catch(e) { if(process.env.BROWSER_TESTS)throw e; }
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`;
  const s=await page(browser,base,{reducedMotion:'reduce',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'});
  try {
    await s.p.addInitScript(()=>{
      Object.defineProperty(navigator,'standalone',{value:true});
      Object.defineProperty(screen,'width',{get:()=>390});
      Object.defineProperty(screen,'height',{get:()=>904}); // Both CSS large viewport (844px) and physical screen (904px) exceed the usable app window (784px).
      window.__testViewportHeight=784;window.__testViewportScale=1;
      Object.defineProperty(window,'innerHeight',{get:()=>window.__testViewportHeight});
      Object.defineProperty(visualViewport,'height',{get:()=>window.__testViewportHeight});
      Object.defineProperty(visualViewport,'scale',{get:()=>window.__testViewportScale});
    });
    await s.go('/oefenen?open=today');await s.p.locator('#app-loading').waitFor({state:'hidden'});
    const pinned=async height=>{
      await s.p.waitForFunction(h=>document.documentElement.style.getPropertyValue('--app-viewport-height')===h+'px',height);
      const r=await s.p.locator('#tabs').evaluate(e=>({bottom:e.getBoundingClientRect().bottom,top:parseFloat(getComputedStyle(e).top)}));
      assert.ok(Math.abs(r.top-(height-10))<1,JSON.stringify(r));
      assert.ok(Math.abs(r.bottom-(height-10))<1,JSON.stringify(r));
    };
    await pinned(784);
    await s.p.locator('#tabs [data-t="oefenen"]').click();await s.p.locator('#parts [data-knm]').click();
    await s.p.evaluate(()=>scrollTo(0,500));await pinned(784);
    await s.p.evaluate(()=>scrollTo(0,150));await pinned(784);
    await s.p.locator('#tabs [data-t="profiel"]').click();await s.p.locator('#pname').focus();
    await s.p.evaluate(()=>{window.__testViewportHeight=480;dispatchEvent(new Event('resize'));visualViewport.dispatchEvent(new Event('resize'))});
    await pinned(784); // The app viewport stays full-sized while keyboard metrics are stale; raw screen height also differs.
    await s.p.locator('#pname').evaluate(e=>e.blur());
    await s.p.evaluate(()=>{window.__testViewportHeight=784;dispatchEvent(new Event('resize'))});
    await pinned(784);
    await s.p.evaluate(()=>{window.__testViewportHeight=330});
    await s.p.setViewportSize({width:844,height:390});await pinned(330);
    await s.p.evaluate(()=>{window.__testViewportHeight=480});
    await s.p.setViewportSize({width:390,height:844});await pinned(784);
    await s.p.evaluate(()=>{window.__testViewportHeight=784;dispatchEvent(new Event('resize'))});
    await s.p.evaluate(()=>{window.__testViewportScale=2;visualViewport.dispatchEvent(new Event('resize'))});
    assert.equal(await s.p.locator('html[data-iphone-dock]').count(),0);
    await s.p.evaluate(()=>{window.__testViewportScale=1;visualViewport.dispatchEvent(new Event('resize'))});
    await pinned(784);
    assert.equal(await overflow(s.p),0);assert.deepEqual(s.errors,[]);
  } finally {await s.ctx.close();await browser.close();server.close()}
});

test('Bittie welcomes learners during startup and never traps them behind loading', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const server = await serve(), base = `http://127.0.0.1:${server.address().port}`;
  try {
    await t.test('the first mascot frame paints while optional motion styles are still downloading', async () => {
      const s = await page(browser, base);
      let release;
      const held = new Promise(ok => { release=ok; });
      try {
        await s.p.route('**/motion-v1.css', async route => { await held; await route.continue().catch(()=>{}); });
        await s.p.route('**/data/knm.js?*', async route => { await held; await route.continue().catch(()=>{}); });
        await s.p.goto(base+'/oefenen?open=today', {waitUntil:'commit'});
        await s.p.locator('#app-loading').waitFor({state:'visible', timeout:1500});
        await s.p.waitForFunction(() => document.querySelector('#app-loading img').naturalWidth > 0, null, {timeout:1500});
        assert.equal(await s.p.locator('link[href="/motion-v1.css"]').getAttribute('media'), 'print');
        assert.match(await s.p.locator('#app-loading img').evaluate(e=>e.currentSrc), /\/bittie-wave-v2\.svg$/);
      } finally { release(); await s.ctx.close(); }
    });
    await t.test('iPhone launch metadata contains Bittie at the exact device resolution', async () => {
      const s = await page(browser, base);
      try {
        await s.p.addInitScript(() => Object.defineProperty(navigator, 'standalone', {value:true, configurable:true}));
        await s.go('/oefenen?open=today');
        await s.p.waitForFunction(() => document.querySelector('link[rel="apple-touch-startup-image"]')?.href.startsWith('data:image/png'));
        const result = await s.p.evaluate(async () => {
          const image = new Image(); image.src=document.querySelector('#ios-startup-image').href; await image.decode();
          return {width:image.naturalWidth, height:image.naturalHeight, expectedWidth:screen.width*devicePixelRatio, expectedHeight:screen.height*devicePixelRatio};
        });
        assert.equal(result.width, result.expectedWidth); assert.equal(result.height, result.expectedHeight);
        assert.deepEqual(s.errors, []);
      } finally { await s.ctx.close(); }
    });
    await t.test('the visible loading mascot changes pose without rotating the complete image', async () => {
      const s=await page(browser,base);
      let release;const held=new Promise(ok=>{release=ok});
      try {
        // Holding account work keeps the splash visible after HTML parsing and font readiness.
        // Screenshots measure the displayed animated frame; drawImage() uses an image's default frame.
        await s.p.route('**/api/config?*',async route=>{await held;await route.continue().catch(()=>{})});
        await s.go('/oefenen?open=today');
        await s.p.evaluate(()=>document.fonts.ready);
        const image=s.p.locator('#app-loading img');
        await s.p.waitForFunction(()=>document.querySelector('#app-loading img')?.naturalWidth>0);
        assert.equal(await image.evaluate(e=>getComputedStyle(e).transform),'none');
        // The store app's launch image shows Bittie in the middle, 700 of 2732 px of the height: no jump when the page takes over.
        const at=await image.evaluate(e=>{const r=e.getBoundingClientRect();return {w:r.width,cy:r.top+r.height/2,cx:r.left+r.width/2,H:innerHeight,W:innerWidth}});
        assert.ok(Math.abs(at.cy-at.H/2)<1&&Math.abs(at.cx-at.W/2)<1, 'Bittie is in the middle of the screen');
        assert.ok(Math.abs(at.w-Math.min(at.W*.62,245,Math.max(170,at.H*700/2732)))<1, 'as large as on the launch image');
        const firstFrame=await image.screenshot();
        await s.p.waitForTimeout(180);
        assert.equal((await image.screenshot()).equals(firstFrame),false,'the waving paw changes position');
      } finally {release();await s.ctx.close()}
    });
    await t.test('slow scripts show Bittie, the saved language and accessible reduced motion', async () => {
      for (const opt of [{lang:'ru'}, {lang:'ar', colorScheme:'dark', reducedMotion:'reduce'}]) {
        const s = await page(browser, base, opt);
        let release;
        const held = new Promise(ok => { release=ok; });
        try {
          await s.p.route('**/data/knm.js?*', async route => { await held; await route.continue().catch(()=>{}); });
          await s.p.goto(base+'/oefenen?open=today', {waitUntil:'commit'});
          await s.p.locator('#app-loading').waitFor({state:'visible'});
          const shownAt=await s.p.locator('#app-loading').evaluate(e=>Number(e.dataset.shownAt));
          await s.p.waitForFunction(() => document.querySelector('#app-loading img').naturalWidth > 0);
          assert.match(await s.p.locator('#app-loading img').evaluate(e=>e.currentSrc),
            opt.reducedMotion?/\/bittie-loading-v1\.webp$/:/\/bittie-wave-v2\.svg$/);
          assert.equal(await s.p.locator('#boot-label').textContent(), opt.lang==='ru'?'Загрузка…':'جارٍ التحميل…');
          assert.equal(await s.p.locator('main').isVisible(), false);
          assert.equal(await s.p.locator('#tabs').isVisible(), false);
          assert.equal(await overflow(s.p), 0);
          if (opt.reducedMotion) assert.equal(await s.p.locator('#app-loading img').evaluate(e=>getComputedStyle(e).animationName), 'none');
          else assert.equal(await s.p.locator('#app-loading img').evaluate(e=>getComputedStyle(e).transform),'none');
          release();
          await s.p.waitForFunction(() => window.__up===1);
          await s.p.locator('#app-loading').waitFor({state:'detached'});
          if(!opt.reducedMotion)assert.ok(await s.p.evaluate(()=>Date.now())-shownAt>=2000, 'the wave remains visible for two seconds');
          assert.equal(await s.p.locator('main').isVisible(), true);
          assert.equal(await s.p.locator('#tabs').isVisible(), true);
          assert.deepEqual(s.errors, []);
        } finally { release(); await s.ctx.close(); }
      }
    });
    await t.test('an unavailable script shows a retry action which can recover', async () => {
      const s = await page(browser, base);
      try {
        await s.p.route('**/data/knm.js?*', route=>route.abort());
        await s.go('/oefenen?open=today');
        await s.p.getByRole('alert').waitFor({state:'visible'});
        assert.equal(await s.p.locator('#app-loading').count(), 0);
        await s.p.unroute('**/data/knm.js?*');
        await s.p.getByRole('button', {name:'Opnieuw laden'}).click();
        await s.p.waitForFunction(() => window.__up===1);
        await s.p.locator('#app-loading').waitFor({state:'detached'});
        assert.equal(await s.p.locator('main').isVisible(), true);
      } finally { await s.ctx.close(); }
    });
    await t.test('a missing wave file falls back to the still mascot', async () => {
      const s=await page(browser,base);
      let release;
      const held=new Promise(ok=>{release=ok});
      try {
        await s.p.route('**/art/bittie-wave-v2.svg',route=>route.abort());
        await s.p.route('**/data/knm.js?*',async route=>{await held;await route.continue().catch(()=>{})});
        await s.p.goto(base+'/oefenen?open=today',{waitUntil:'commit'});
        await s.p.waitForFunction(()=>{
          const image=document.querySelector('#app-loading img');
          return image&&image.currentSrc.endsWith('/bittie-loading-v1.webp')&&image.naturalWidth>0;
        });
        assert.equal(await s.p.locator('#app-loading img').isVisible(),true);
        assert.equal(await s.p.getByRole('alert').count(),0);
        release();
        await s.p.locator('#app-loading').waitFor({state:'detached'});
        assert.equal(await s.p.locator('main').isVisible(),true);
      } finally {release();await s.ctx.close()}
    });
    await t.test('a stalled account request releases the usable local app', async () => {
      const s = await page(browser, base);
      let release;
      const held = new Promise(ok=>{release=ok});
      try {
        await s.p.clock.install();
        await s.p.route('**/api/config?*', async route=>{await held;await route.continue().catch(()=>{})});
        await s.go('/oefenen?open=today');
        await s.p.waitForFunction(()=>typeof restored!=='undefined'&&restored);
        assert.equal(await s.p.locator('#app-loading').isVisible(), true);
        await s.p.clock.runFor(4300);
        await s.p.locator('#app-loading').waitFor({state:'detached'});
        assert.equal(await s.p.locator('#plan button').first().isVisible(), true);
        release();
        await s.p.waitForFunction(()=>window.__up===1);
        assert.deepEqual(s.errors, []);
      } finally { release();await s.ctx.close(); }
    });
    await t.test('startup that never gets its scripts offers retry instead of loading forever', async () => {
      const s = await page(browser, base);
      let release;
      const held = new Promise(ok=>{release=ok});
      try {
        await s.p.clock.install();
        await s.p.route('**/data/knm.js?*', async route=>{await held;await route.continue().catch(()=>{})});
        await s.p.goto(base+'/oefenen', {waitUntil:'commit'});
        await s.p.locator('#app-loading').waitFor({state:'visible'});
        await s.p.clock.runFor(20100);
        await s.p.getByRole('button', {name:'Opnieuw laden'}).waitFor({state:'visible'});
        assert.equal(await s.p.locator('#app-loading').count(), 0);
      } finally { release();await s.ctx.close(); }
    });
  } finally { await browser.close();await new Promise(ok=>server.close(ok)); }
});

test('The homepage and the app work in a real browser', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const server = await serve(), base = `http://127.0.0.1:${server.address().port}`;
  try {
    await t.test('homepage', async () => {
      const s = await page(browser, base); await s.go('/'); await s.p.waitForLoadState('load');
      assert.equal(await overflow(s.p), 0);
      assert.equal(await s.p.locator('#plus-card').isHidden(), true); // Plus is off without configuration
      // Vraag 2: the KNM question on the homepage marks the answer like the app does
      await s.p.locator('[data-product-step="-1"]').click(); // the exam card is the last one: one step back from the first
      await s.p.locator('#module-exam').waitFor();
      await s.p.locator('#probeer > summary').click();
      await s.p.locator('#probeer .quiz .choice').first().click();
      assert.equal(await s.p.locator('#probeer .quiz .choice.ok').count(), 1);
      assert.equal(await s.p.locator('#qfb').isVisible(), true);
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    await t.test('homepage product cards switch their descriptions and open the app', {timeout:20000}, async () => {
      const s = await page(browser, base, {lang:'ru', viewport:{width:390,height:844}}); await s.go('/ru');
      const cards = s.p.locator('.product-card');
      const panels = s.p.locator('.module-detail');
      assert.equal(await cards.count(), 5);
      await s.p.locator('#module-history').waitFor();
      assert.equal(await panels.filter({visible:true}).count(), 1);
      const stage = s.p.locator('.product-stage');
      await stage.scrollIntoViewIfNeeded();
      const box = await stage.boundingBox();
      await s.p.mouse.move(box.x + box.width * .72, box.y + 60);
      await s.p.mouse.down();
      await s.p.mouse.move(box.x + box.width * .3, box.y + 62, {steps:5});
      await s.p.mouse.up();
      await s.p.locator('#module-books').waitFor({timeout:3000});
      const word = s.p.locator('[data-book-word]');
      await word.tap();
      assert.equal(await s.p.locator('#book-word').isVisible(), true);
      await s.p.locator('[data-product-step="1"]').tap();
      await s.p.locator('#module-conversation').waitFor();
      await s.p.locator('[data-product-step="1"]').focus();
      await s.p.keyboard.press('ArrowRight');
      await s.p.locator('#module-media').waitFor();
      await s.p.keyboard.press('ArrowRight');
      await s.p.locator('#module-exam').waitFor();
      await stage.scrollIntoViewIfNeeded();
      const touchBox = await stage.boundingBox();
      const cdp = await s.ctx.newCDPSession(s.p);
      const touch = (type, x) => cdp.send('Input.dispatchTouchEvent', {
        type, touchPoints:type==='touchEnd' ? [] : [{x, y:touchBox.y+55}]
      });
      await touch('touchStart',touchBox.x+touchBox.width*.7);
      for(let i=1;i<=6;i++) await touch('touchMove',touchBox.x+touchBox.width*(.7-.065*i));
      await touch('touchEnd');
      await s.p.locator('#module-history').waitFor({timeout:3000});
      assert.equal(await panels.filter({visible:true}).count(), 1);
      assert.equal(await overflow(s.p), 0);
      assert.deepEqual(s.errors, []);
      await s.ctx.close();

      for (const [open, seen] of [['books', '#lib'], ['history', '#hist'], ['media', '#media'], ['talk', '#talk']]) {
        const s = await page(browser, base, {lang:'ru'}); await s.go('/ru');
        const section = {books:'books',history:'history',media:'media',talk:'conversation'}[open];
        const steps = {history:0, books:1, conversation:2, media:3}[section];
        for (let i = 0; i < steps; i++) await s.p.locator('[data-product-step="1"]').tap();
        await s.p.locator(`#module-${section}`).waitFor();
        await s.p.locator(`#module-${section} a[href="/oefenen?open=${open}"]`).tap();
        await s.p.locator(seen).waitFor({state:'visible'});
        assert.equal(await s.p.evaluate(() => tab), 'oefenen');
        assert.equal(await overflow(s.p), 0);
        assert.deepEqual(s.errors, []); await s.ctx.close();
      }
    });
    // the phone's bar: two straight rows in the longest languages too (the name and the main button, then the links with
    // the language and Inloggen), nothing wrapped, overlapping or off the screen
    await t.test('homepage bar on a phone: two rows that fit', async () => {
      for (const [lang, width] of [['ru', 390], ['es', 360], ['ar', 375], ['hi', 320]]) {
        const s = await page(browser, base, {lang, viewport: {width, height: 800}}); await s.go('/'); await s.p.waitForSelector('.hero');
        const r = await s.p.evaluate(() => {
          const seen = [...document.querySelectorAll('.bar .brand,.bar #enter,.nav a,.language,.signin')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect());
          const rows = [...new Set(seen.map(b => Math.round(b.top + b.height / 2)))].sort((a, b) => a - b);
          const gaps = rows.map(y => { const it = seen.filter(b => Math.round(b.top + b.height / 2) === y).sort((a, b) => a.left - b.left);
            return Math.min(99, ...it.slice(1).map((b, i) => b.left - it[i].right)); });
          return {rows: rows.length, gap: Math.min(...gaps), out: seen.filter(b => b.left < 0 || b.right > innerWidth).length,
            wrapped: [...document.querySelectorAll('.bar .brand,.bar #enter,.nav a,.signin')].filter(e => e.getClientRects().length > 1).length};
        });
        assert.deepEqual({rows: r.rows, out: r.out, wrapped: r.wrapped}, {rows: 2, out: 0, wrapped: 0}, `${lang} ${width}`);
        assert.ok(r.gap >= 5, `${lang} ${width}: gap ${r.gap}`);
        assert.equal(await overflow(s.p), 0); await s.ctx.close();
      }
    });
    await t.test('homepage in Arabic', async () => {
      const s = await page(browser, base, {lang:'ar'}); await s.go('/'); await s.p.waitForLoadState('load');
      assert.equal(await s.p.getAttribute('html', 'dir'), 'rtl');
      assert.equal(await overflow(s.p), 0);
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    await t.test('app: today, Arabic menus, KNM themes', async () => {
      const s = await page(browser, base, {lang:'ar'}); await s.go('/oefenen'); await s.p.waitForSelector('#plan .step');
      assert.equal(await s.p.getAttribute('html', 'dir'), 'rtl');
      assert.equal(await overflow(s.p), 0);
      await s.p.evaluate(() => setTab('oefenen'));
      await s.p.click('#parts [data-knm]');
      assert.equal(await s.p.locator('#knmsub [data-kt]').count(), 9);
      await s.p.click('#knmsub [data-kt="0"]');
      await s.p.waitForSelector('#play:not([hidden]) .opt');
      // the dictionary: a word loads its part over the network
      const e = await s.p.evaluate(() => lookUp('huizen', 'De huizen zijn oud.').then(E => [E.map(x => x.l), dictHave.size]));
      assert.ok(e[0].includes('huis')); assert.ok(e[1] < 5);
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    await t.test('homepage and app: who goes where', async () => {
      const s = await page(browser, base);
      await s.ctx.route('**/api/config*', r => r.fulfill({json: {url: 'https://example.supabase.co', anon: 'x', login: ['google'], limit: 5, free: 2}}));
      await s.p.evaluate(() => localStorage.clear()).catch(() => {});
      await s.go('/'); await s.p.waitForSelector('.hero');
      // The hero offers installation; the bar opens practice without the login window.
      assert.equal(await s.p.locator('#download-app').getAttribute('href'), '#install-app');
      await s.p.click('#enter'); await s.p.waitForSelector('#plan .step'); await s.p.waitForTimeout(800);
      assert.equal(await s.p.locator('#welcome').isHidden(), true);
      assert.equal(new URL(s.p.url()).search, '');
      // returning learners on a phone also start with the homepage; saved progress never skips it
      await s.go('/'); await s.p.waitForSelector('.hero');
      assert.equal(new URL(s.p.url()).pathname, '/');
      await s.p.reload(); await s.p.waitForSelector('.hero');
      assert.equal(new URL(s.p.url()).pathname, '/');
      await s.go('/?home'); await s.p.waitForSelector('.hero');
      assert.equal(new URL(s.p.url()).pathname + new URL(s.p.url()).search, '/');
      // on a computer the site always opens with the homepage, also for someone who practises here: the bar's button
      // leads into the app, and the app's menu has Home as its first row (not on a phone)
      assert.match(await s.p.locator('#enter').getAttribute('href'), /^\/oefenen/);
      const d = await s.ctx.browser().newContext({viewport: {width: 1280, height: 800}, serviceWorkers: 'block'}), dp = await d.newPage();
      await dp.goto(base + '/over'); await dp.evaluate(() => { localStorage.setItem('ww-v1', '{}'); localStorage.setItem('ww-welcome', '1'); });
      await dp.goto(base + '/'); await dp.waitForSelector('.hero'); await dp.waitForTimeout(300);
      assert.equal(new URL(dp.url()).pathname, '/');
      await dp.click('#enter'); await dp.waitForSelector('#plan .step');
      assert.equal(await dp.locator('#tabs > a.hm').isVisible(), true);
      assert.equal(await dp.evaluate(() => document.querySelector('#tabs .lens').nextElementSibling.matches('a.hm[href="/"]')), true);
      await dp.click('#tabs a.hm'); await dp.waitForSelector('.hero'); await d.close();
      assert.equal(await s.p.locator('#tabs a.hm').count(), 0); // the phone page is the homepage here: no menu
      // back from a login or a payment: the app takes over
      await s.go('/?plus=stop'); await s.p.waitForSelector('#plan .step');
      assert.equal(new URL(s.p.url()).pathname, '/oefenen');
      // an installed app still enters practice, even when an older home-screen shortcut starts at /
      await s.p.addInitScript(() => Object.defineProperty(navigator, 'standalone', {value:true}));
      await s.go('/'); await s.p.waitForSelector('#plan .step');
      assert.equal(new URL(s.p.url()).pathname, '/oefenen');
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    await t.test('app: the sample question from the homepage', async () => {
      const s = await page(browser, base); await s.go('/oefenen?open=sample');
      await s.p.waitForSelector('#play:not([hidden]) .doc');
      await s.p.locator('#play .opt').first().click();
      await s.p.waitForSelector('.fb');
      assert.deepEqual(s.errors, []); await s.ctx.close();
    });
    // axe-core's WCAG checks (names, labels, headings, contrast where it can tell, ARIA) on every kind of screen, light
    // and dark; the white tab names on the oranje lens are measured separately (axe can't read a gradient)
    await t.test('accessibility: axe finds nothing', async () => {
      const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8'), found = [];
      const check = async (name, url, prep, opt = {}) => {
        const s = await page(browser, base, opt); await s.go(url); await s.p.waitForTimeout(300);
        await s.p.locator('#app-loading').waitFor({state:'detached'});
        if (prep) { await prep(s.p); await s.p.waitForTimeout(200); }
        await s.p.addScriptTag({content: AXE});
        const v = await s.p.evaluate(() => axe.run(document).then(r => r.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(', ')}`)));
        v.forEach(x => found.push(`${name}: ${x}`));
        assert.deepEqual(s.errors, [], name); await s.ctx.close();
      };
      const tab = t => p => p.evaluate(t => setTab(t), t);
      for (const scheme of ['light', 'dark']) {
        await check(`homepage ${scheme}`, '/', null, {colorScheme: scheme});
        for (const t of ['vandaag', 'examen', 'oefenen', 'herhalen', 'profiel']) await check(`${t} ${scheme}`, '/oefenen', tab(t), {colorScheme: scheme});
        await check(`KNM answered ${scheme}`, '/oefenen', async p => { await p.evaluate(() => build('knm')); await p.locator('#play .opts button').first().click(); }, {colorScheme: scheme});
      }
      await check('KNM proefexamen', '/oefenen', p => p.evaluate(() => startExam('knm')));
      await check('login window', '/oefenen?open=login');
      await check('over', '/over'); await check('nakijken', '/nakijken'); await check('nakijken Arabic dark', '/nakijken', null, {lang: 'ar', colorScheme: 'dark'}); await check('privacy dark', '/privacy', null, {colorScheme: 'dark'});
      await check('Arabic', '/oefenen', null, {lang: 'ar'});
      await check('desktop', '/oefenen', null, {viewport: {width: 1280, height: 800}, isMobile: false, hasTouch: false});
      assert.deepEqual(found, []);
      // the current tab's name, white on the oranje lens: at least 4.5:1 on every pixel behind it
      const s = await page(browser, base); await s.go('/oefenen'); await s.p.evaluate(() => setTab('examen')); await s.p.waitForTimeout(600);
      await s.p.locator('#app-loading').waitFor({state:'detached'});
      const box = await s.p.locator('.tabs button[data-t="examen"] span:not([aria-hidden])').last().boundingBox();
      await s.p.addStyleTag({content: '.tabs button *{visibility:hidden!important}'});
      const png = (await s.p.screenshot({clip: box})).toString('base64');
      const min = await s.p.evaluate(async png => {
        const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
        const c = Object.assign(document.createElement('canvas'), {width: img.width, height: img.height}), g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data, L = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
        let low = 99;
        for (let i = 0; i < d.length; i += 4) low = Math.min(low, 1.05 / (.2126 * L(d[i]) + .7152 * L(d[i + 1]) + .0722 * L(d[i + 2]) + .05));
        return low;
      }, png);
      assert.ok(min >= 4.5, `white on the lens: ${min.toFixed(2)}:1`);
      await s.ctx.close();
    });
  } finally { await browser.close(); server.close(); }
});

// The anonymous counts: the app counts a device once a day ("new" only without progress), the homepage its own day and
// its buttons; nothing at all with Global Privacy Control, and nothing when the server doesn't offer it (cfg.events)
test('Usage counts: once a day, nothing with Global Privacy Control', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const state = {events: [], config: {url: 'https://supa.example', anon: 'x', login: [], limit: 5, free: 0, events: 1}};
  const server = await serve(state), base = `http://127.0.0.1:${server.address().port}`;
  try {
    const s = await page(browser, base);
    // a cached config from before the counts, and the server not keeping the first one (the table not made yet): sent
    // again at the next start, then once only
    await s.p.addInitScript(() => { if (!sessionStorage.getItem('seen')) { sessionStorage.setItem('seen', 1);
      localStorage.setItem('ww-acc-cfg', JSON.stringify({url: 'https://supa.example', anon: 'x', login: [], limit: 5, free: 0})); } });
    state.fail = true;
    await s.go('/oefenen'); await s.p.waitForTimeout(2200);
    assert.deepEqual(state.events.map(e => e.ev), ['open']);
    assert.equal(await s.p.evaluate(() => localStorage.getItem('ww-day')), null);
    state.fail = false; state.events.length = 0;
    await s.p.reload(); await s.p.waitForTimeout(2200);
    await s.p.reload(); await s.p.waitForTimeout(2200); // the same day again: not counted twice
    assert.deepEqual(state.events.map(e => e.ev), ['open', 'new']);
    assert.deepEqual(Object.keys(state.events[0]).sort(), ['ev', 'lvl', 'ui']);
    await s.p.evaluate(() => startExam('knm', true)); await s.p.waitForTimeout(300);
    assert.equal(state.events.at(-1).ev, 'exam_knm');
    state.events.length = 0;
    await s.go('/?home'); await s.p.waitForTimeout(600);
    await Promise.all([s.p.waitForURL(/oefenen/), s.p.locator('a.button.primary[href="/oefenen?open=today"]').first().click()]);
    await s.p.waitForTimeout(400);
    assert.deepEqual(state.events.map(e => e.ev), ['home', 'begin']);
    await s.ctx.close();
    state.events.length = 0;
    const g = await page(browser, base); await g.p.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', {value: true}));
    await g.go('/oefenen'); await g.p.waitForTimeout(2200); await g.go('/?home'); await g.p.waitForTimeout(600);
    assert.deepEqual(state.events, []);
    await g.ctx.close();
    state.config = {}; const n = await page(browser, base); await n.go('/oefenen'); await n.p.waitForTimeout(2200);
    assert.deepEqual(state.events, []); await n.ctx.close();
  } finally { await browser.close(); server.close(); }
});

// The owner's overview: with a session it asks /api/admin with the access token and shows the accounts, the study time
// and the anonymous counts; a row opens its days; axe finds nothing
test('The owner overview shows accounts and study time', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const d = new Date(), day = Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5), now = new Date().toISOString();
  const state = {config: {url: 'https://supa.example', anon: 'x', login: [], limit: 5, free: 0},
    admin: {users: [
      {email: 'anna@example.nl', name: 'Anna de Vries', created: now, login: now, seen: now, lvl: 'A2', items: 120, right: 90, wrong: 30,
        res: {knm: {n: 3, pc: 72, at: Date.now()}}, tm: {[day]: 1500, [day - 1]: 600, [day - 30]: 300}, qd: {[day]: 12, [day - 2]: 8}, qr: {[day]: 9, [day - 2]: 8}, checks: 4, checks7: 2, plus: null},
      {email: 'omar@example.nl', name: null, created: now, login: now, seen: null, lvl: 'B1', items: 0, right: 0, wrong: 0, res: null, tm: null, qd: {[day]: 2}, qr: null, checks: 0, checks7: 0, plus: 'active'}],
    counts: [{day: now.slice(0, 10), ev: 'open', lvl: 'A2', ui: 'nl', n: 5}, {day: now.slice(0, 10), ev: 'exam_knm', lvl: 'A2', ui: 'ru', n: 2}],
    spend: [{day: now.slice(0, 10), model: 'claude-sonnet-5-5', calls: 3, input: 9000, output: 4000, cache_read: 0, cache_write: 0}]}};
  for (const [offset, n] of [[1,12],[2,6],[3,4]]) state.admin.counts.push({day: new Date((day-offset)*864e5).toISOString().slice(0,10), ev:'open', lvl:'A2', ui:'nl', n});
  const server = await serve(state), base = `http://127.0.0.1:${server.address().port}`;
  try {
    const s = await page(browser, base, {viewport: {width: 1280, height: 800}, isMobile: true, hasTouch: true});
    await s.p.addInitScript(() => localStorage.setItem('sb-supa-auth-token', JSON.stringify({access_token: 'tok-1', refresh_token: 'r', token_type: 'bearer',
      expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 36000, user: {id: 'u1', email: 'eigenaar@example.nl', aud: 'authenticated'}})));
    await s.go('/admin'); await s.p.waitForSelector('tr.u');
    assert.equal(state.adminAuth, 'Bearer tok-1');
    await s.p.waitForFunction(() => document.querySelector('main').textContent.includes('ABCDEFGH')); // the groups, with their code
    const text = await s.p.textContent('main');
    assert.match(text, /Anna de Vries/); assert.match(text, /anna@example\.nl/); assert.match(text, /35 мин/); // 25 today + 10 yesterday in 7 days
    assert.match(text, /KNM ×3 · 72%/); assert.match(text, /12 \(75%\)/); assert.match(text, /20 \(85%\)/); assert.match(text, /120 \(75%\)/); // today, 7 days, in all assert.match(text, /Без имени/);
    await s.p.locator('tr.u').first().click(); await s.p.waitForSelector('tr.detail .days');
    // The seven-day view is readable first; the full month is available without losing the selected day.
    assert.equal(await s.p.locator('figure.chart').count(), 2);
    assert.equal(await s.p.locator('figure.chart .point').count(), 14);
    await s.p.locator('figure.chart').nth(1).locator('.point').last().click();
    assert.match(await s.p.locator('figure.chart').nth(1).locator('.readout b').textContent(), /25 мин/);
    assert.equal(await s.p.locator('figure.chart').first().locator('.point').last().getAttribute('aria-label').then(a => / 2 акк\.$/.test(a)), true);
    const visits = s.p.locator('figure.chart').first();
    assert.equal(await visits.locator('.point[data-missing]').count(), Math.max(0, 7 - (day - Math.floor(Date.parse('2026-11-11T00:00:00Z') / 864e5) + 1)));
    await visits.locator('.point').last().focus(); await s.p.keyboard.press('ArrowLeft');
    assert.equal(await visits.locator('.point[aria-pressed=true]').getAttribute('data-date'), new Date((day - 1) * 864e5).toISOString().slice(0, 10));
    assert.equal(await visits.locator('.readout b').textContent(), '1 акк.');
    await s.p.locator('[data-period="30"]').click();
    assert.equal(await s.p.locator('figure.chart .point').count(), 60);
    assert.equal(await visits.locator('.point[aria-pressed=true]').getAttribute('data-date'), new Date((day - 1) * 864e5).toISOString().slice(0, 10));
    await visits.locator('summary').click();
    assert.equal(await visits.locator('tbody tr').count(), 30); // Empty days stay visible, too.
    await visits.locator('summary').click();
    const fitCharts = async () => {
      assert.equal(await overflow(s.p), 0);
      const boxes = await s.p.locator('.chart').evaluateAll(charts => charts.map(chart => {
        const r = chart.getBoundingClientRect();
        return {x: r.x, y: r.y, right: r.right, bottom: r.bottom, labels: [...chart.querySelectorAll('.xax span')].map(e => {
          const b = e.getBoundingClientRect(); return {left: b.left, right: b.right};
        })};
      }));
      for (const box of boxes) for (let i = 0; i < box.labels.length; i++) {
        assert.ok(box.labels[i].left >= box.x && box.labels[i].right <= box.right, JSON.stringify(box));
        if (i) assert.ok(box.labels[i].left - box.labels[i - 1].right >= 2, JSON.stringify(box));
      }
      return boxes;
    };
    for (const width of [320, 390, 768, 1280]) {
      await s.p.setViewportSize({width, height: 844});
      for (const days of [7, 30]) {
        await s.p.locator(`[data-period="${days}"]`).click();
        const boxes = await fitCharts();
        assert.equal(await visits.locator('.point').count(), days);
        assert.equal(await visits.locator('.xax span').count(), days === 7 ? 7 : 4);
        assert.equal(await visits.locator('svg.line path').count(), 1);
        if (width <= 900) assert.ok(boxes[1].y > boxes[0].bottom, JSON.stringify(boxes));
        else assert.equal(boxes[0].y, boxes[1].y);
        // Touch/click readout works independently of hover or a transient tooltip.
        await visits.locator('.point').last().click();
        assert.equal(await visits.locator('.readout b').textContent(), '2 акк.');
        assert.match(await visits.locator('.readout span').textContent(), new RegExp(String(d.getFullYear())));
        if (process.env.ADMIN_SCREENSHOTS) {
          fs.mkdirSync(process.env.ADMIN_SCREENSHOTS, {recursive: true});
          await s.p.locator('.trend-head h2').hover();
          await s.p.locator('.trends').screenshot({path: path.join(process.env.ADMIN_SCREENSHOTS, `statistics-${width}-${days}.png`)});
        }
      }
    }
    await s.p.setViewportSize({width:390, height:844});
    await s.p.locator('[data-period="7"]').click();
    await visits.locator('.area').scrollIntoViewIfNeeded();
    const middle = await visits.locator('.point').nth(3).boundingBox();
    await s.p.touchscreen.tap(middle.x + middle.width / 2, middle.y + middle.height / 2);
    assert.equal(await visits.locator('.point[aria-pressed=true]').getAttribute('data-date'), new Date((day - 3) * 864e5).toISOString().slice(0, 10));
    const firstPoint = await visits.locator('.point').first().boundingBox(), lastPoint = await visits.locator('.point').last().boundingBox();
    await s.p.mouse.move(firstPoint.x + firstPoint.width / 2, firstPoint.y + firstPoint.height / 2);
    await s.p.mouse.down();
    await s.p.mouse.move(lastPoint.x + lastPoint.width / 2, lastPoint.y + lastPoint.height / 2, {steps:12});
    await s.p.mouse.up();
    assert.equal(await visits.locator('.readout b').textContent(), '2 акк.');
    await s.p.locator('[data-period="30"]').click();
    await s.p.locator('.events').evaluate(e => { e.scrollLeft = 300; });
    const pinnedDate = await s.p.locator('.events').evaluate(e => ({left:e.getBoundingClientRect().left, date:e.querySelector('tbody td').getBoundingClientRect().left}));
    assert.ok(Math.abs(pinnedDate.left - pinnedDate.date) < 2, JSON.stringify(pinnedDate));

    assert.equal(await overflow(s.p), 0);
    const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
    await s.p.addScriptTag({content: AXE});
    assert.deepEqual(await s.p.evaluate(() => axe.run(document).then(r => r.violations.map(v => v.id + ': ' + v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(', ')))), []);
    // Crossing a month/year boundary preserves chronological ISO dates and shows both years in the period.
    await s.p.clock.setFixedTime(new Date('2026-01-03T12:00:00Z'));
    await s.p.locator('#re').click();
    await s.p.waitForFunction(() => document.querySelector('.chart .point:last-child')?.dataset.date === '2026-01-03');
    assert.equal(await visits.locator('.point').first().getAttribute('data-date'), '2025-12-05');
    assert.match(await s.p.locator('.trend-head .sub').textContent(), /2025.*2026/);
    const dates = await visits.locator('.point').evaluateAll(cols => cols.map(c => c.dataset.date));
    assert.deepEqual(dates, [...dates].sort());
    assert.equal(await visits.locator('.readout b').textContent(), 'Нет данных');
    await fitCharts();
    // an older admin_overview() in the database (no qd): the page says so instead of showing dashes without a reason
    assert.equal(await s.p.locator('.tile.warn').count(), 0);
    state.admin.users.forEach(u => { delete u.qd; delete u.qr; });
    await s.p.locator('#re').click(); await s.p.waitForSelector('.tile.warn');
    assert.deepEqual(s.errors, []); await s.ctx.close();
    // without a session it asks to log in, and never calls /api/admin
    state.adminAuth = undefined;
    const g = await page(browser, base, {viewport: {width: 1280, height: 800}, isMobile: false, hasTouch: false});
    await g.go('/admin'); await g.p.waitForSelector('.msg a[href="/oefenen?open=login"]');
    assert.equal(state.adminAuth, undefined); await g.ctx.close();
  } finally { await browser.close(); server.close(); }
});

test('Bittie gets an update notification when a new worker reuses the existing cache', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const state = {}, server = await serve(state), base = `http://127.0.0.1:${server.address().port}`;
  try {
    const s = await page(browser, base, {serviceWorkers:'allow'});
    try {
      await s.go('/oefenen?open=today');
      await s.p.locator('#app-loading').waitFor({state:'detached'});
      await s.p.waitForFunction(async () => (await caches.open('nl-a2-v12')).match('/oefenen'));
      await s.p.evaluate(() => navigator.serviceWorker.ready);
      await s.p.waitForFunction(() => !!navigator.serviceWorker.controller);
      assert.equal(await s.p.locator('#fresh').count(), 0);
      state.knm='eeeeeeeeee'; state.workerRevision='2';
      await s.p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
      await s.p.locator('#fresh').waitFor({state:'visible', timeout:20000});
      assert.ok(await s.p.evaluate(async () => (await (await caches.open('nl-a2-v12')).match('/oefenen')).text().then(html=>html.includes('/data/knm.js?v=eeeeeeeeee'))));
      await s.p.locator('#fresh button').click();
      await s.p.locator('#app-loading').waitFor({state:'detached'});
      assert.equal(await s.p.locator('#plan .step').count() > 0, true);
    } finally { await s.ctx.close(); }
  } finally { await browser.close(); server.close(); }
});

test('Offline the app opens with its own files, also after an update', async t => {
  let browser;
  try { browser = chromium && await chromium.launch(); } catch (e) { if (process.env.BROWSER_TESTS) throw e; }
  if (!browser) { if (process.env.BROWSER_TESTS) assert.fail('Playwright is not installed'); return t.skip('no browser here'); }
  const state = {}, server = await serve(state), base = `http://127.0.0.1:${server.address().port}`;
  try {
    const s = await page(browser, base, {serviceWorkers: 'allow'});
    // Playwright 1.63's WebKit offline emulation rejects even literal worker responses (#42775).
    // Drop every origin connection instead, keeping the real service-worker/offline path under test.
    const offline = async value => {
      if (process.env.BROWSER_ENGINE === 'webkit') state.disconnected=value;
      else await s.ctx.setOffline(value);
    };
    await s.go('/oefenen'); await s.p.waitForSelector('#plan .step');
    await s.p.evaluate(() => navigator.serviceWorker.ready);
    const cached = () => s.p.evaluate(async () => (await (await caches.open('nl-a2-v12')).keys()).map(r => new URL(r.url)).map(u => u.pathname + u.search));
    const wait = async ok => { for (let i = 0; i < 100 && !ok(await cached()); i++) await s.p.waitForTimeout(100); return cached(); };
    const files = await s.p.evaluate(() => [...document.scripts].map(x => x.getAttribute('src')).filter(x => x && x.includes('?v=')));
    assert.ok(files.length >= 7);
    assert.equal(files.some(f => f.startsWith('/data/ui.js')), false, 'the translations are not loaded for Dutch');
    let c = await wait(c => c.includes('/oefenen') && c.includes('/art/bittie-loading-v1.webp') && c.includes('/art/bittie-wave-v2.svg') && files.every(f => c.includes(f)));
    assert.ok(files.every(f => c.includes(f)), 'the page\'s files are cached');
    assert.ok(c.includes('/art/bittie-loading-v1.webp'), 'Bittie is available for offline startup');
    assert.ok(c.includes('/art/bittie-wave-v2.svg'), 'the smooth animation is available offline');
    // A slow navigation refresh must not keep an installed app on its native blank launch screen.
    await s.p.waitForFunction(() => !!navigator.serviceWorker.controller);
    let release;
    state.holdApp = new Promise(ok => { release=ok; });
    try {
      await s.p.reload({waitUntil:'commit', timeout:1500});
      await s.p.locator('#app-loading').waitFor({state:'visible', timeout:1000});
      await s.p.waitForFunction(() => document.querySelector('#app-loading img')?.naturalWidth > 0, null, {timeout:1000});
      assert.match(await s.p.locator('#app-loading img').evaluate(e=>e.currentSrc), /\/bittie-wave-v2\.svg$/);
    } finally { state.holdApp=null; release(); }
    await s.p.locator('#app-loading').waitFor({state:'detached'});
    await offline(true); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    if (process.env.BROWSER_ENGINE === 'webkit') {
      const noWorker=await browser.newContext({serviceWorkers:'block'});
      try { const control=await noWorker.newPage();await assert.rejects(control.goto(base+'/not-cached'), 'the origin really is unreachable without a worker'); }
      finally { await noWorker.close(); }
    }
    await offline(false);
    // an update: the page asks for another version of one file
    state.knm = 'ffffffffff';
    await s.p.reload(); await s.p.waitForSelector('#plan .step');
    c = await wait(c => c.includes('/data/knm.js?v=ffffffffff') && c.filter(x => x.startsWith('/data/knm.js')).length === 1);
    assert.deepEqual(c.filter(x => x.startsWith('/data/knm.js')), ['/data/knm.js?v=ffffffffff'], 'only the version the stored page uses');
    await offline(true); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    assert.equal(await s.p.evaluate(() => KNM.length > 400), true);
    // in another language the translations come too, and stay for offline use
    await offline(false);
    await s.p.evaluate(() => localStorage.setItem('ww-ui', 'ar')); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    await s.p.waitForFunction(() => document.querySelector('#tabs button[data-t=examen] span').textContent !== 'Examen');
    c = await wait(c => c.some(x => x.startsWith('/data/ui.js')));
    await offline(true); await s.p.reload(); await s.p.waitForSelector('#plan .step');
    await s.p.waitForFunction(() => document.querySelector('#tabs button[data-t=examen] span').textContent !== 'Examen');
    assert.deepEqual(s.errors.filter(e => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e)), []);
    await s.ctx.close();
  } finally { await browser.close(); server.close(); }
});

test('One-time free allowance, browser trial and daily Plus counters remain distinct',async t=>{
  let browser;
  try{browser=chromium&&await chromium.launch()}catch(e){if(process.env.BROWSER_TESTS)throw e}
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const config={url:'https://example.supabase.co',anon:'fixture',login:[],limit:7,period:'once',free:2,freePeriod:'once',plus:{limit:60,price:'9,99',plans:{A2:{price:'9,99'},B1:{price:'14,99'}}}};
  const state={config,allowance:{free:1},plus:null},server=await serve(state),base=`http://127.0.0.1:${server.address().port}`;
  try{
    const s=await page(browser,base,{lang:'en'});await s.go('/');
    await s.p.waitForFunction(()=>document.querySelector('#free-checks').textContent.includes('7 free checks'));
    assert.match(await s.p.locator('#trial-checks').textContent(),/2 one-time trial checks/);
    await s.go('/oefenen?open=today');await s.p.waitForFunction(()=>acc.free===1);
    await s.p.reload();await s.p.waitForFunction(()=>acc.free===1);
    const now=new Date(),day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam'}).format(now),week=new Date(day+'T12:00:00Z');
    week.setUTCDate(week.getUTCDate()-(week.getUTCDay()+6)%7);
    state.allowance={dailyUsed:12,weeklyUsed:0,totalUsed:3,day,week:week.toISOString().slice(0,10)};
    await s.p.evaluate(async cfg=>{
      acc.cfg=cfg;acc.user={id:'quota-test',email:'quota@example.test'};
      acc.sb={auth:{getSession:async()=>({data:{session:{access_token:'fixture'}}})}};
      S.lvl='A2';await usage();setTab('profiel');
    },config);
    await s.p.waitForFunction(()=>document.querySelector('#prof').textContent.includes('Free checks: 4 of 7 left'));
    state.plus={status:'active',level:'A2'};
    await s.p.evaluate(async()=>{await usage();drawProfile()});
    await s.p.waitForFunction(()=>document.querySelector('#prof').textContent.includes('Checks left today: 48 of 60'));
    await s.p.evaluate(()=>{S.lvl='B1';drawProfile()});
    await s.p.waitForFunction(()=>document.querySelector('#prof').textContent.includes('Free checks: 4 of 7 left'));
    await s.ctx.route('**/api/check',r=>r.fulfill({json:{tasks:[{passed:true}],left:0,limit:7,period:'once',checkedAt:new Date().toISOString()}}));
    await s.p.evaluate(async()=>{await nakijken([{task:'Test',text:'Ik kom morgen.'}],'wb');drawProfile()});
    await s.p.waitForFunction(()=>document.querySelector('#prof').textContent.includes('Free checks: 0 of 7 left'));
    assert.equal(await s.p.evaluate(()=>checksLeft('wr')),48,'B1 free checks leave A2 paid checks intact');
    await s.p.evaluate(()=>{S.lvl='A2';plusScreen()});
    await s.p.waitForFunction(()=>document.querySelector('#tbody').textContent.includes('up to 200 checks a month. With a free account: 7 free'));
    assert.equal(await overflow(s.p),0);assert.deepEqual(s.errors,[]);await s.ctx.close();
  }finally{await browser.close();await new Promise(ok=>server.close(ok))}
});

test('Monthly A2 and B1 offers fit the homepage and the app sends the selected level',async t=>{
  let browser;
  try{browser=chromium&&await chromium.launch()}catch(e){if(process.env.BROWSER_TESTS)throw e}
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const config={url:'https://example.supabase.co',anon:'fixture',login:[],limit:7,period:'once',free:2,freePeriod:'once',events:1,plus:{limit:20,month:200,price:'9,99',plans:{A2:{price:'9,99'},B1:{price:'14,99'}}},pass:{days:119,total:260,plans:{A2:{price:'29,99'},B1:{price:'39,99'}}},year:{days:365,total:610,plans:{A2:{price:'79,99'},B1:{price:'119,99'}}}};
  const events=[];
  const server=await serve({config,events}),base=`http://127.0.0.1:${server.address().port}`;
  try{
    for(const [lang,width] of [['nl',1280],['ru',390],['ar',375],['hi',320],['uk',390]]){
      const s=await page(browser,base,{lang,viewport:{width,height:900}});await s.go('/');
      await s.p.waitForFunction(()=>!document.querySelector('#plus-b1-card').hidden);
      assert.match(await s.p.locator('#plus-price').textContent(),/9,99/);
      assert.match(await s.p.locator('#plus-b1-price').textContent(),/14,99/);
      assert.match(await s.p.locator('#pass-total').textContent(),/260/);
      assert.match(await s.p.locator('#year-checks').textContent(),/610/);
      assert.match(await s.p.locator('#pass-price').textContent(),/39,99/);
      assert.equal(await overflow(s.p),0);assert.deepEqual(s.errors,[]);await s.ctx.close();
    }
    const s=await page(browser,base);await s.go('/');
    await s.p.locator('#plus-b1-card a').click();
    await s.p.locator('[data-plus-plan="B1"].preferred-plan').waitFor();
    assert.equal(await s.p.locator('[data-plus-plan="A2"].preferred-plan').count(),0);
    await s.go('/');
    await s.go('/#voorbeeld');
    await s.p.locator('#voorbeeld a[href*="open=writing"]').click();
    await s.p.locator('#txt').waitFor();
    assert.match(await s.p.locator('#card').textContent(),/Schrijf een briefje aan je buurvrouw/);
    await s.go('/oefenen?open=writing&src=a2w');await s.p.locator('#txt').waitFor();
    let chosen,activated=false;
    await s.ctx.route('**/__test-checkout',r=>r.fulfill({status:204}));
    await s.ctx.route('**/api/plus',async r=>{
      if(r.request().method()==='GET')return r.fulfill({json:{plus:activated?{status:'active',level:'B1'}:null}});
      chosen=r.request().postDataJSON();
      await r.fulfill({json:{url:base+'/__test-checkout'}});
    });
    await s.p.evaluate(cfg=>{acc.cfg=cfg;acc.user={id:'pricing-test'};acc.sb={auth:{getSession:async()=>({data:{session:{access_token:'test'}}})}};plusScreen()},config);
    assert.match(await s.p.locator('[data-plus-plan="A2"]').textContent(),/9,99/);
    assert.match(await s.p.locator('[data-plus-plan="B1"]').textContent(),/14,99/);
    await s.p.locator('[data-plus-buy="B1"]').click();
    assert.equal(chosen,undefined,'no Checkout before the learner agrees that access starts at once');
    await s.p.locator('label:has(#pstart)').click();assert.equal(await s.p.locator('#pstart').isChecked(),true);
    await s.p.locator('[data-plus-buy="B1"]').click();
    await s.p.waitForFunction(()=>sessionStorage.getItem('bt-a2-campaign')?.includes('start'));
    assert.deepEqual(chosen,{go:'buy',level:'B1',start:true});
    await s.p.evaluate(()=>{history.replaceState(null,'','/oefenen?plus=ok&plan=B1');plusBack()});
    await s.p.getByText('Je betaling wordt verwerkt…').waitFor();
    assert.ok(!events.some(row=>row.ev==='ads_wr_paid'));
    activated=true;
    await s.p.getByText('Bedankt! Je hebt nu Bittertalen Plus.').waitFor();
    await s.p.waitForFunction(()=>sessionStorage.getItem('bt-a2-campaign')?.includes('paid'));
    assert.equal(events.filter(row=>row.ev==='ads_wr_start').length,1);
    assert.equal(events.filter(row=>row.ev==='ads_wr_paid').length,1);
    assert.deepEqual(s.errors,[]);await s.ctx.close();
  }finally{await browser.close();await new Promise(ok=>server.close(ok))}
});

// The lens in the phone's tab bar glides like a spring: a second tap halfway carries on from where it is (no step back,
// no stop, no sideways push from its stretch), a drag catches up with the finger, and it always ends exactly on its tab
test('The tab bar lens glides without jumps', async t => {
  let browser;
  try { browser=chromium&&await chromium.launch(); } catch(e) { if(process.env.BROWSER_TESTS)throw e; }
  if(!browser){if(process.env.BROWSER_TESTS)assert.fail('Playwright is not installed');return t.skip('no browser here')}
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`;
  try {
    for (const lang of [null, 'ar']) {
      const s=await page(browser,base,{lang});await s.go('/oefenen');await s.p.waitForSelector('#plan .step');
      await s.p.locator('#app-loading').waitFor({state:'hidden'});
      // the lens's middle, in tabs from the start of the bar, every frame
      const track=()=>s.p.evaluate(()=>{window.LT=[];const L=document.querySelector('#tabs .lens'),rtl=document.dir==='rtl';
        const f=()=>{const r=L.getBoundingClientRect(),b=L.parentNode.getBoundingClientRect(),w=(b.width-10)/5;
          LT.push(((rtl?b.right-5-(r.left+r.width/2):r.left+r.width/2-b.left-5)/w)-.5);if(LT.length<90)requestAnimationFrame(f)};requestAnimationFrame(f)});
      const steps=()=>s.p.evaluate(()=>LT.slice(1).map((x,i)=>x-LT[i]));
      await track();
      await s.p.evaluate(()=>{const B=k=>document.querySelector(`#tabs button[data-t="${k}"]`);B('examen').click();
        setTimeout(()=>B('profiel').click(),150);setTimeout(()=>B('oefenen').click(),450)});
      await s.p.waitForTimeout(1600);
      const d=await steps(),first=d.findIndex(x=>x<-.02),rev=d.slice(first);
      assert.ok(first>0&&d.slice(0,first).every(x=>x>-.002),`${lang}: forward without a step back`);
      assert.ok(rev.every(x=>x<.002),`${lang}: after turning, no step forward`);
      const jerk=a=>Math.max(...a.slice(1).map((x,i)=>Math.abs(x-a[i]))); // how much the speed changes from frame to frame
      assert.ok(jerk(d)<.3,`${lang}: the speed changes smoothly (${jerk(d).toFixed(3)})`);
      // a drag from Oefenen towards Mijn dag (the start of the bar)
      const box=await s.p.locator('#tabs').boundingBox(),y=box.y+box.height/2,cdp=await s.ctx.newCDPSession(s.p);
      const bx=i=>{const x=box.x+5+(box.width-10)/5*(i+.5);return lang==='ar'?box.x+box.width-(x-box.x):x};
      const tp=(type,x)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
      await track();await tp('touchStart',bx(2));
      for(let k=1;k<=20;k++){await tp('touchMove',bx(2)+(bx(0)-bx(2))*k/20);await s.p.waitForTimeout(16)}
      await tp('touchEnd');await s.p.waitForTimeout(1000);
      const dd=await steps();assert.ok(jerk(dd)<.3,`${lang}: the drag has no jump (${jerk(dd).toFixed(3)})`);
      assert.equal(await s.p.evaluate(()=>document.querySelector('#tabs [aria-current]').dataset.t),'vandaag');
      const off=await s.p.evaluate(()=>{const a=document.querySelector('#tabs .lens').getBoundingClientRect(),c=document.querySelector('#tabs [aria-current]').getBoundingClientRect();return Math.abs(a.left-c.left)+Math.abs(a.right-c.right)});
      assert.ok(off<1,`${lang}: the lens ends on its tab (${off})`);
      assert.deepEqual(s.errors,[]);await s.ctx.close();
    }
  } finally{await browser.close();await new Promise(ok=>server.close(ok))}
});

test('A2 launch path: guest writing and all five mock exams finish with recoverable answers', async t=>{
  let browser;
  try { browser=chromium&&await chromium.launch(); } catch(e) { if(process.env.BROWSER_TESTS)throw e; }
  if(!browser)return t.skip('no browser here');
  const config={url:'https://example.supabase.co',anon:'fixture',login:[],limit:7,period:'once',free:2,freePeriod:'once',events:1};
  const events=[],server=await serve({config,events}),base=`http://127.0.0.1:${server.address().port}`,s=await page(browser,base,{});
  const failures=new Set(['wr','sp']),attempts=[];
  const say='Ik woon in Nederland en volg hier een cursus.';
  const text='Beste Anja, volgende week ik ga op vakantie. Wil je mijn planten water geven? De sleutel ligt in de keuken. Groeten, Samira.';
  try {
    await s.p.addInitScript(()=>{
      class TestRecognition{constructor(){window.fixtureSpeech=this}start(){}stop(){}abort(){this.onend?.()}
        finish(text){this.onresult?.({results:[[{transcript:text}]]});document.querySelector('#recb').click();this.onend?.()}}
      Object.defineProperty(window,'SpeechRecognition',{configurable:true,value:TestRecognition});
      Object.defineProperty(window,'webkitSpeechRecognition',{configurable:true,value:TestRecognition});
    });
    await s.ctx.route('**/api/check', async route=>{
      const body=route.request().postDataJSON(),part=body.part??'wr';
      attempts.push(body);
      if(body.requestId&&failures.delete(part)){
        if(part==='sp')return route.abort('internetdisconnected');
        return route.fulfill({status:504,json:{error:'timeout'}});
      }
      await route.fulfill({json:{free:1,tasks:body.tasks.map(task=>({
        passed:true,verdict:'Je hebt alle punten van de opdracht beantwoord.',corrected:say,
        scores:{inhoud:3,woorden:2,grammatica:2,...(part==='wr'?{spelling:2}:{}),samenhang:1},
        errors:body.requestId?[]:[{wrong:'volgende week ik ga',right:'volgende week ga ik',why:'Het werkwoord komt op plaats twee.',kind:'inversie'}]
      }))}});
    });
    await s.go('/oefenen?open=writing');
    await s.p.locator('#txt').fill(text);
    await s.p.locator('#chk').click();
    await s.p.getByRole('button',{name:'Verbeter je fout'}).click();
    await s.p.locator('#fix0').fill('volgende week ga ik');
    await s.p.locator('#fixcheck').click();
    await s.p.getByText('Precies goed!').waitFor();
    assert.equal(await s.p.locator('#fixcheck').textContent(),'Verder');
    assert.equal(await s.p.evaluate(()=>acc.free),1);
    await s.go('/oefenen?open=writing&src=a2w');
    await s.p.locator('#txt').fill(text.replace('keuken','gang'));
    await s.p.locator('#chk').click();
    await s.p.getByRole('button',{name:'Verbeter je fout'}).waitFor();
    await s.p.waitForFunction(()=>sessionStorage.getItem('bt-a2-campaign')?.includes('check'));

    await s.p.emulateMedia({reducedMotion:'reduce'});
    for(const [part,count] of [['lz',25],['ls',25],['knm',40],['wr',4],['sp',16]]){
      await s.p.evaluate(()=>home());
      await s.p.locator('#tabs [data-t="examen"]').click();
      await s.p.locator(`#exam [data-e="${part}"]`).click();
      await s.p.locator('#ggo').click();
      assert.equal(await s.p.evaluate(()=>queue.length),count,part);
      for(let i=0;i<count;i++){
        if(part==='sp'){
          await s.p.locator('#recb').click();
          await s.p.evaluate(answer=>window.fixtureSpeech.finish(answer),say);
          if(i===0){
            const current=await s.p.evaluate(()=>tEnd);
            await s.p.reload();
            await s.p.locator('#tabs [data-t="examen"]').click();
            await s.p.locator('#exam [data-e="sp"]').click();
            await s.p.locator('#ggo').click();
            assert.equal(await s.p.evaluate(()=>cur.ans[0].text),say);
            assert.equal(await s.p.evaluate(()=>tEnd),current);
          }
          await s.p.locator('#recb').click();
        }else{
          if(part==='wr'){
            for(const field of await s.p.locator('#card input[id^="f"]').all())await field.fill('Antwoord');
            await s.p.locator('#txt').fill(text);
          }else {
            if(part==='ls'&&i===0)await s.p.locator('#say').click();
            await s.p.locator('#card .opt').nth(await s.p.evaluate(()=>cur.op[pos].indexOf(queue[pos].right))).click();
            if(i===0){
              const current=await s.p.evaluate(()=>tEnd);
              await s.p.reload();
              await s.p.locator('#tabs [data-t="examen"]').click();
              await s.p.locator(`#exam [data-e="${part}"]`).click();
              await s.p.locator('#ggo').click();
              assert.equal(await s.p.evaluate(()=>cur.pick[0]===queue[0].right),true);
              assert.equal(await s.p.evaluate(()=>tEnd),current);
              if(part==='ls')assert.equal(await s.p.evaluate(()=>cur.plays[queue[0].say]),1);
            }
          }
          await s.p.locator('#nxt').click();
        }
      }
      if(part!=='sp'){
        assert.equal(await s.p.evaluate(()=>queue.filter((_,i)=>picked(i)).length),count,part);
        await s.p.locator('#lever').click();
      }
      if(part==='wr'||part==='sp'){
        await s.p.locator('#retrycheck').click();
        const sent=attempts.filter(r=>r.requestId&&(r.part??'wr')===part);
        await s.p.waitForFunction(p=>S.res?.[p]?.length===1,part);
        const final=attempts.filter(r=>r.requestId&&(r.part??'wr')===part);
        assert.equal(final.length,2);assert.deepEqual(final[0],final[1]);
        assert.equal(sent[0].tasks.length,count);
      }else {
        await s.p.waitForFunction(p=>S.res?.[p]?.length===1,part,{timeout:5000}).catch(error=>{
          throw new Error(`Missing ${part} result: ${s.errors.join('; ')}`,{cause:error});
        });
        assert.equal(await s.p.evaluate(p=>S.res[p][0].pc,part),100);
      }
      assert.equal(await s.p.evaluate(p=>S.res[p].length,part),1);
    }
    for(const event of ['ads_wr_visit','ads_wr_check'])assert.equal(events.filter(row=>row.ev===event).length,1);
  }finally{await s.ctx.close();await browser.close();server.close()}
});

test('A new homepage visitor can finish the A2 diagnostic and leave and resume a timed exam',async t=>{
  let browser;
  try{browser=chromium&&await chromium.launch()}catch(e){if(process.env.BROWSER_TESTS)throw e}
  if(!browser)return t.skip('no browser here');
  const server=await serve(),base=`http://127.0.0.1:${server.address().port}`;
  try{
    const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const p=await ctx.newPage();
    await p.goto(base);
    await p.locator('#enter').click();
    await p.getByRole('button',{name:'Begin met de korte test'}).click();
    await p.locator('#tgo').click();
    for(let i=0;i<3;i++)await p.locator('#bgn').click();
    await p.getByText('Tussenstand starttest',{exact:true}).waitFor();
    await p.locator('#bgcontinue').click();
    for(let i=3;i<12;i++)await p.locator('#bgn').click();
    await p.getByRole('heading',{name:'0 van 12 goed'}).waitFor();
    await p.locator('#bgf').click();
    await p.getByRole('heading',{name:'Jezelf voorstellen'}).waitFor();
    await p.locator('#tback').click();
    await p.locator('#tback').click();
    await p.locator('#tabs [data-t="examen"]').click();
    await p.locator('[data-e="lz"]').click();
    await p.locator('#ggo').click();
    await p.locator('#card .opt').first().click();
    await p.locator('#back').click();
    await p.locator('#exit-no').click();
    await p.locator('#back').click();
    await p.locator('#exit-yes').click();
    await p.locator('[data-e="lz"]').click();
    await p.locator('#ggo').click();
    assert.equal(await p.locator('#card .opt').first().getAttribute('aria-pressed'),'true');
    await ctx.close();
  }finally{await browser.close();await new Promise(ok=>server.close(ok))}
});
