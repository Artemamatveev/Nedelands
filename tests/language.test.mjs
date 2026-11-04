import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { app, root } from './app-harness.mjs';

const context=vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('study/language-v1.js',root),'utf8'),context);
const run=code=>JSON.parse(vm.runInContext(`JSON.stringify(${code})`,context));

// Independent third-person spellings cover every verb shown in the learner's conjugation tables.
const expected=`zijn:is hebben:heeft gaan:gaat komen:komt doen:doet zien:ziet zeggen:zegt weten:weet kunnen:kan willen:wil moeten:moet mogen:mag krijgen:krijgt geven:geeft nemen:neemt staan:staat zitten:zit liggen:ligt blijven:blijft worden:wordt vinden:vindt denken:denkt brengen:brengt kopen:koopt zoeken:zoekt lezen:leest schrijven:schrijft spreken:spreekt eten:eet drinken:drinkt slapen:slaapt lopen:loopt rijden:rijdt vliegen:vliegt beginnen:begint vergeten:vergeet begrijpen:begrijpt helpen:helpt vragen:vraagt dragen:draagt vallen:valt laten:laat houden:houdt roepen:roept sterven:sterft trekken:trekt sluiten:sluit kiezen:kiest verliezen:verliest winnen:wint zingen:zingt zwemmen:zwemt bieden:biedt breken:breekt kijken:kijkt snijden:snijdt wassen:wast bakken:bakt lachen:lacht verkopen:verkoopt werken:werkt wonen:woont maken:maakt leren:leert praten:praat fietsen:fietst betalen:betaalt reizen:reist verhuizen:verhuist luisteren:luistert spelen:speelt koken:kookt wachten:wacht antwoorden:antwoordt gebeuren:gebeurt stoppen:stopt verbieden:verbiedt vertrekken:vertrekt ontvangen:ontvangt onthouden:onthoudt vriezen:vriest schijnen:schijnt wegen:weegt zwijgen:zwijgt blijken:blijkt verdwijnen:verdwijnt springen:springt stijgen:stijgt schieten:schiet genieten:geniet wijzen:wijst bewijzen:bewijst lijken:lijkt glijden:glijdt schrikken:schrikt treffen:treft stelen:steelt bidden:bidt meten:meet schenken:schenkt vechten:vecht hangen:hangt vangen:vangt slaan:slaat varen:vaart kruipen:kruipt heten:heet vouwen:vouwt raden:raadt leggen:legt zetten:zet bellen:belt wandelen:wandelt studeren:studeert parkeren:parkeert dansen:danst pakken:pakt missen:mist hopen:hoopt rusten:rust leven:leeft geloven:gelooft huren:huurt sturen:stuurt poetsen:poetst regenen:regent verdienen:verdient bestellen:bestelt vertellen:vertelt proberen:probeert veranderen:verandert trouwen:trouwt groeien:groeit slagen:slaagt zakken:zakt`.split(' ').map(x=>x.split(':'));

test('Every learner verb has an independently checked third-person form',()=>{
  assert.deepEqual(run('V.map(v=>v[0])'),expected.map(x=>x[0]));
  for(const [verb,form] of expected)assert.equal(run(`present(${JSON.stringify(verb)})[2]`),form,verb);
});
test('First-person spelling regressions and irregular second-person forms',()=>{
  for(const [verb,forms] of Object.entries({groeien:['groei','groeit','groeit','groeien'],wandelen:['wandel','wandelt','wandelt','wandelen'],regenen:['regen','regent','regent','regenen'],veranderen:['verander','verandert','verandert','veranderen'],zijn:['ben','bent','is','zijn'],kunnen:['kan','kunt','kan','kunnen'],willen:['wil','wilt','wil','willen']}))
    assert.deepEqual(run(`present(${JSON.stringify(verb)})`),forms);
});
test('Alternative orders preserve the exact word tokens of their target',()=>{
  const tokens=s=>s.toLowerCase().replace(/[.,?!]/g,'').split(/\s+/).sort();
  for(const [target,alternatives] of Object.entries(run('alternativeOrders'))){
    for(const answer of alternatives){
      assert.deepEqual(tokens(answer),tokens(target));
      assert.equal(run(`acceptsOrder(${JSON.stringify(target)},${JSON.stringify(answer)})`),true);
    }
  }
});
test('Unrecognised word order is compared neutrally until the learner chooses to repeat it',async()=>{
  const a=await app();
  a.run('build("custom",{id:"custom",n:1,pool:()=>[ITEMS.find(q=>q.k==="w1|1")]})');
  const words=['Ze','zegt','dat','ze','de','brief','al','verstuurd','heeft'];
  for(const word of words)[...a.document.querySelectorAll('#pool button')].find(x=>x.textContent===word).click();
  a.document.querySelector('#chk').click();
  assert.equal(a.run('S.items["w1|1"].r'),1);
  a.run('build("custom",{id:"custom",n:1,pool:()=>[ITEMS.find(q=>q.k==="w1|1")]})');
  while(a.document.querySelector('#pool button'))a.document.querySelector('#pool button').click();
  a.document.querySelector('#chk').click();
  assert.ok(a.document.querySelector('#orderAgain'));
  assert.equal(a.run('S.items["w1|1"].w||0'),0);
  a.document.querySelector('#orderAgain').click();
  assert.equal(a.run('S.items["w1|1"].w'),1);
});
