// A short, decorative Dutch encouragement. It never owns focus or advances a question.
const quickPraise=(()=>{
  const el=document.getElementById('quick-praise'),duration=650;
  let timer=null,last=-1;
  function hide(){clearTimeout(timer);timer=null;el.hidden=true;el.replaceChildren();delete el.dataset.phrase}
  function show(){
    hide();
    if(document.getElementById('play').hidden)return;
    let i=Math.floor(Math.random()*PRAISE_ART.length);
    if(i===last)i=(i+1)%PRAISE_ART.length;
    last=i;
    const art=PRAISE_ART[i];
    el.dataset.phrase=art.text;
    el.innerHTML=`<svg class="quick-praise-mark" viewBox="0 0 360 150" aria-hidden="true" focusable="false">
      <path fill="var(--fill)" d="M20 33 34 27 30 21 115 19 118 15 286 17 280 22 332 20 325 30 346 28 340 119 322 121 326 129 238 127 240 134 75 130 79 125 16 126 22 116 8 118Z"/>
      <path fill="#fff" d="${art.path}"/>
      <path fill="var(--oranje)" d="m45 132 259-9-5 5-245 12Zm-34-92 4-15 4 1-2 17Zm328-24 8-11 4 2-8 12Z"/>
    </svg>`;
    el.hidden=false;
    timer=setTimeout(hide,duration);
  }
  // The first next action dismisses it, even before an automatic question transition.
  document.addEventListener('pointerdown',hide,{capture:true,passive:true});
  document.addEventListener('keydown',hide,true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')hide()});
  return {show,hide,duration};
})();
