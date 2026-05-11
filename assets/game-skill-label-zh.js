(()=>{
'use strict';
const VERSION='1.14.3-character-build-select-combat';
const MAP=new Map([
 ['inner','內功'],['outer','外功'],['light','輕功'],['swim','水性'],['climb','攀行'],['pierce','刺擊'],['slash','斬擊'],['strike','打擊'],['sense','感知'],
 ['sleight','巧手'],['craft','工藝'],['appraise','辨別'],['medicine','醫術'],['pharma','調藥'],['ride','騎術'],['hide','躲藏'],['observe','觀察'],['listen','聆聽'],['smell','品嗅'],['office','政務'],['animal','馴養'],['threat','威嚇'],['art','表達'],['elegance','雅藝'],
 ['appearance','相貌'],['resource','資源'],['wealth','財富'],['court','官場'],['jianghu','江湖'],['geo','地理'],['nature','自然'],['history','歷史'],['religion','信仰'],['study','學藝'],['will','意志'],['language','語言'],['social','交際'],['empathy','共情'],['speech','口才'],
 ['body','體魄'],['tech','技巧'],['mind','智識'],['hpMax','氣血上限'],['hp','氣血'],['spirit','精神'],['composure','鎮定'],['suspicion','疑心'],['fatigue','疲勞'],['hunger','飢餓'],['coin','錢'],['turn','行動'],['day','日'],['hour','時辰'],
 ['morning','晨時'],['noon','午時'],['dusk','昏時'],['night','夜時'],['trust','信任'],['favor','好感'],['fear','畏懼'],['anger','怒意']
]);
const TARGETS=['overviewBox','buildPreview','overlayContent','passageText','passageFooter','passageMeta'];
let scheduled=false;
function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function replaceOne(text){
  let out=String(text??'');
  for(const [from,to] of MAP){
    const re=new RegExp(`(^|[\\s、｜,，:：/()（）])${escRe(from)}(?=\\s|:|：|$|[、｜,，/()（）])`,'g');
    out=out.replace(re,`$1${to}`);
  }
  out=out.replaceAll('DaGoCombat','衝突系統').replaceAll('DaGoDeck','行動系統').replaceAll('combat','衝突').replaceAll('Combat','衝突');
  return out;
}
function walk(node,box){
  if(!node||box.count>900)return;
  if(node.nodeType===3){
    const next=replaceOne(node.nodeValue);
    if(next!==node.nodeValue)node.nodeValue=next;
    box.count++;
    return;
  }
  if(node.nodeType!==1||['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','OPTION'].includes(node.tagName))return;
  for(const child of Array.from(node.childNodes))walk(child,box);
}
function apply(){
  for(const id of TARGETS){
    const el=document.getElementById(id);
    if(el)walk(el,{count:0});
  }
}
function schedule(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;apply();});
}
function boot(){
  apply();
  const observer=new MutationObserver(schedule);
  for(const id of TARGETS){
    const el=document.getElementById(id);
    if(el)observer.observe(el,{childList:true,subtree:true,characterData:true});
  }
  document.addEventListener('click',()=>setTimeout(schedule,20),true);
  document.addEventListener('change',()=>setTimeout(schedule,20),true);
  document.body.classList.add('dago-skill-label-zh-ready');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoSkillLabelZh=Object.freeze({version:VERSION,apply,replaceOne});
})();
