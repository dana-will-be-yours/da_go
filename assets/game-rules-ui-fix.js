(()=>{
'use strict';
const VERSION='1.11.0-changshan-year';
const STORE='daGoPlayV6';
window.DaGoRulesUiFix=Object.freeze({version:VERSION});
const ATTR={inner:'body',outer:'body',light:'body',swim:'body',climb:'body',pierce:'body',slash:'body',strike:'body',sense:'body',sleight:'tech',craft:'tech',appraise:'tech',medicine:'tech',pharma:'tech',ride:'tech',hide:'tech',observe:'tech',listen:'tech',smell:'tech',office:'tech',animal:'tech',threat:'tech',art:'tech',elegance:'tech',appearance:'mind',resource:'mind',wealth:'mind',court:'mind',jianghu:'mind',geo:'mind',nature:'mind',history:'mind',religion:'mind',study:'mind',will:'mind',language:'mind',social:'mind',empathy:'mind',speech:'mind'};
function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
function attrMod(sum){if(sum<=0)return-2;if(sum===1)return-1;if(sum<=3)return 0;if(sum<=5)return 1;if(sum<=8)return 2;if(sum<=11)return 3;if(sum<=15)return 4;if(sum<=19)return 5;return 6}
function recalc(st){
  if(!st||!st.skills)return;
  const sums={body:0,tech:0,mind:0};
  Object.entries(st.skills).forEach(([k,v])=>{sums[ATTR[k]||'mind']+=Number(v)||0});
  st.attrSums=sums;
  st.attrs={body:attrMod(sums.body),tech:attrMod(sums.tech),mind:attrMod(sums.mind)};
}
function hpMax(st){
  const roles=st?.player?.roles||[];
  const skills=st?.skills||{};
  const attrs=st?.attrs||{body:0};
  const heavy=new Set(['constable','soldier','strongman','escort','dock_labor','militia','hunter','disciple']);
  const light=new Set(['literatus','copyist','tutor','poet']);
  let base=6;
  if(roles.some(r=>heavy.has(r)))base=8;
  else if(roles.some(r=>light.has(r)))base=4;
  return Math.max(1,base+(Number(attrs.body)||0)+(Number(skills.inner)||0)+(Number(skills.outer)||0)*2);
}
function normalize(st){
  if(!st||typeof st!=='object')return st;
  if(st.skills)Object.keys(st.skills).forEach(k=>{st.skills[k]=clamp(st.skills[k],-3,5)});
  if(st.player)st.player.renownLevel=1;
  if(st.renown)st.renown.level=1;
  recalc(st);
  if(st.stats){
    const max=hpMax(st);
    st.stats.vbMax=max;
    st.stats.vb=Number.isFinite(Number(st.stats.vb))?clamp(st.stats.vb,0,max):max;
  }
  return st;
}
function getState(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
function setState(st){try{localStorage.setItem(STORE,JSON.stringify(st))}catch{}}
function normalizeStore(){
  const st=getState();
  if(Object.keys(st).length)setState(normalize(st));
}
function patchStaticText(){
  const sub=document.getElementById('story-subtitle');
  if(sub)sub.textContent='天津郡常山縣';
  document.querySelectorAll('[name="renownLevel"]').forEach(input=>{
    input.value='1';
    input.disabled=true;
    const label=input.closest('label');
    if(label)label.hidden=true;
  });
}
const oldSet=localStorage.setItem.bind(localStorage);
localStorage.setItem=function(k,v){
  if(k===STORE){
    try{v=JSON.stringify(normalize(JSON.parse(v)))}catch{}
  }
  return oldSet(k,v);
};
document.addEventListener('DOMContentLoaded',()=>{patchStaticText();normalizeStore()},{once:true});
document.addEventListener('click',()=>setTimeout(patchStaticText,30),true);
normalizeStore();
})();
