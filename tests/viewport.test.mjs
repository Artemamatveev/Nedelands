import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';

function phone({installed=true, userAgent='iPhone', legacy=false}={}) {
  const {document}=parseHTML('<html></html>'), events=new Map(), media=new Map();
  const listen=(name,fn)=>{const list=events.get(name)||[];list.push(fn);events.set(name,list)};
  const viewport={height:844,offsetTop:0,scale:1,addEventListener:(name,fn)=>listen('viewport:'+name,fn)};
  const sandbox={document,navigator:{userAgent,standalone:legacy},screen:{width:390,height:844},
    innerWidth:390,innerHeight:844,visualViewport:viewport,addEventListener:listen,requestAnimationFrame:fn=>fn(),
    matchMedia:query=>{
      if(!media.has(query))media.set(query,{matches:query.includes('standalone')&&installed,
        addEventListener:(name,fn)=>listen(query+':'+name,fn)});
      return media.get(query);
    }};
  sandbox.window=sandbox;
  const html=fs.readFileSync(new URL('../oefenen.html',import.meta.url),'utf8');
  const script=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('data-iphone-dock'))?.[1];
  assert.ok(script);
  vm.runInNewContext(script,sandbox);
  return {root:document.documentElement,viewport,sandbox,media,
    fire:name=>{for(const fn of events.get(name)||[])fn()}};
}

test('The iPhone dock uses app-window height, keeps it after the keyboard and restores it after rotation',()=>{
  const p=phone(),height=()=>p.root.style.getPropertyValue('--app-viewport-height');
  assert.ok(p.root.hasAttribute('data-iphone-dock'));assert.equal(height(),'844px');
  p.sandbox.screen.height=904; // The device screen is taller than the app's actual window.
  p.fire('pageshow');assert.equal(height(),'844px');
  p.sandbox.innerHeight=480;p.viewport.height=480;p.viewport.offsetTop=120;
  p.fire('resize');p.fire('viewport:resize');assert.equal(height(),'844px');
  p.sandbox.innerWidth=844;p.sandbox.innerHeight=390;p.fire('resize');assert.equal(height(),'390px');
  p.sandbox.innerWidth=390;p.sandbox.innerHeight=480;p.fire('resize');
  assert.equal(height(),'844px','portrait must recover even if the keyboard viewport remains stale');
  p.viewport.scale=2;p.fire('viewport:resize');
  assert.ok(!p.root.hasAttribute('data-iphone-dock'));assert.equal(height(),'');
  p.viewport.scale=1;p.fire('viewport:resize');assert.equal(height(),'844px');
});

test('The workaround leaves browser visits and other devices on the native anchor',()=>{
  for(const options of [{installed:false},{userAgent:'iPad'},{userAgent:'Android'},{userAgent:'Macintosh'}]){
    assert.ok(!phone(options).root.hasAttribute('data-iphone-dock'));
  }
  assert.ok(phone({installed:false,legacy:true}).root.hasAttribute('data-iphone-dock'));
});
