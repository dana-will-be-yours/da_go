(()=>{
'use strict';
const VERSION='1.14.2-dol-select-combat';
const STYLE_ID='dago-dol-select-combat-style';
let lastKey='';
const ACTIONS=[
  {code:'attack',label:'攻擊',hint:'以斬擊、刺擊、打擊等武藝壓制對手。',match:/斬|刺|擊|攻|透|棍|掌|拳|劍|刀/},
  {code:'defend',label:'自衛',hint:'護住要害，減少下一次傷害或爭取喘息。',match:/守|防|護|壁|固|避|退/},
  {code:'persuade',label:'說服',hint:'以口才、威嚇或共情改變對手態度。',match:/說|談|震|交|懾|威|情|勸/},
  {code:'observe',label:'觀察環境',hint:'尋找地勢、物品、破綻與脫身路線。',match:/察|聽|辨|看|探|尋/},
  {code:'environment',label:'利用環境',hint:'借用地形、雜物、人群或遮蔽物創造優勢。',match:/塵|地|物|環|藏|移|步|身/},
  {code:'item',label:'使用物品',hint:'取用身上物品、藥物、工具或臨時器物。',match:/藥|物|器|具|用|取|補/},
  {code:'escape',label:'退避',hint:'拉開距離或尋找出口。',match:/退|走|逃|避|離|步/},
  {code:'wait',label:'觀望',hint:'暫不冒進，結束本次行動。',match:null}
];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  const css=document.createElement('style');
  css.id=STYLE_ID;
  css.textContent=[
    '.combat-hand,.combat-command-row,.deck-builder,.card-cost,.combat-card{display:none!important}',
    '.dago-select-combat{border:1px solid rgba(185,150,90,.45);padding:1rem;margin:1rem 0;background:rgba(38,30,22,.32)}',
    '.dago-select-combat h3{margin:.1rem 0 .5rem}',
    '.dago-select-combat-grid{display:grid;grid-template-columns:minmax(10rem,1fr) auto;gap:.6rem;align-items:end}',
    '.dago-select-combat select{width:100%;padding:.55rem .7rem}',
    '.dago-select-combat button{padding:.6rem .9rem}',
    '.dago-select-combat-hint{opacity:.86;margin:.55rem 0 0}',
    '.dago-select-combat-log{margin-top:.7rem;border-top:1px solid rgba(185,150,90,.25);padding-top:.55rem}'
  ].join('\n');
  document.head.appendChild(css);
}
function inCombat(){
  return !!document.querySelector('[data-card-index],[data-combat-command],.combat-board,.combat-enemy');
}
function combatSignature(){
  return [
    document.getElementById('passageTitle')?.textContent||'',
    document.getElementById('passageMeta')?.textContent||'',
    document.querySelectorAll('[data-card-index]:not([disabled])').length,
    document.querySelectorAll('.combat-enemy').length
  ].join('|');
}
function optionsHtml(){
  return ACTIONS.map(a=>`<option value="${esc(a.code)}">${esc(a.label)}</option>`).join('');
}
function panelHtml(){
  return `<section class="dago-select-combat" data-dago-select-combat="1">
    <h3>衝突行動</h3>
    <p>選擇你要對敵人或現場執行的舉動。系統會依角色能力、場景與目前局勢結算。</p>
    <div class="dago-select-combat-grid">
      <label>本次舉動
        <select data-dago-combat-action>${optionsHtml()}</select>
      </label>
      <button type="button" data-dago-combat-submit>執行</button>
    </div>
    <p class="dago-select-combat-hint" data-dago-combat-hint>${esc(ACTIONS[0].hint)}</p>
    <div class="dago-select-combat-log" data-dago-combat-log>可選擇攻擊、自衛、說服、觀察環境、利用環境、使用物品、退避或觀望。</div>
  </section>`;
}
function refreshText(){
  const footer=document.getElementById('passageFooter');
  if(footer){
    footer.textContent=footer.textContent
      .replaceAll('牌組','行動')
      .replaceAll('手札','行動')
      .replaceAll('式牌','行動')
      .replaceAll('戰鬥','衝突')
      .replaceAll('DaGoCombat','衝突系統')
      .replaceAll('DaGoDeck','行動系統');
  }
  const meta=document.getElementById('passageMeta');
  if(meta){
    meta.textContent=meta.textContent
      .replaceAll('牌組戰鬥','簡易衝突')
      .replaceAll('DaGoCombat','簡易衝突')
      .replaceAll('combat','衝突');
  }
}
function apply(){
  addStyle();
  if(!inCombat())return;
  const text=document.getElementById('passageText');
  if(!text)return;
  const key=combatSignature();
  if(key!==lastKey || !text.querySelector('[data-dago-select-combat]')){
    lastKey=key;
    text.querySelector('[data-dago-select-combat]')?.remove();
    text.insertAdjacentHTML('beforeend',panelHtml());
  }
  refreshText();
}
function pickHiddenControl(actionCode){
  if(actionCode==='wait'){
    return document.querySelector('[data-combat-command="end"],[data-end-turn="1"]');
  }
  const action=ACTIONS.find(x=>x.code===actionCode)||ACTIONS[0];
  const cards=[...document.querySelectorAll('[data-card-index]:not([disabled])')];
  if(!cards.length)return document.querySelector('[data-combat-command="end"],[data-end-turn="1"]');
  if(action.match){
    const card=cards.find(el=>action.match.test(el.textContent||''));
    if(card)return card;
  }
  return cards[0];
}
function writeLog(actionCode, success){
  const action=ACTIONS.find(x=>x.code===actionCode)||ACTIONS[0];
  const log=document.querySelector('[data-dago-combat-log]');
  if(log)log.textContent=success?`已執行：${action.label}。`:`無可用行動，已改為觀望。`;
}
document.addEventListener('change',e=>{
  const sel=e.target.closest('[data-dago-combat-action]');
  if(!sel)return;
  const action=ACTIONS.find(x=>x.code===sel.value)||ACTIONS[0];
  const hint=document.querySelector('[data-dago-combat-hint]');
  if(hint)hint.textContent=action.hint;
});
document.addEventListener('click',e=>{
  const submit=e.target.closest('[data-dago-combat-submit]');
  if(submit){
    e.preventDefault();
    const value=document.querySelector('[data-dago-combat-action]')?.value||'attack';
    const target=pickHiddenControl(value);
    if(target){target.click();writeLog(value,true);setTimeout(apply,20);}
    else writeLog(value,false);
    return;
  }
  setTimeout(apply,20);
});
function boot(){
  addStyle();
  setTimeout(apply,30);
  document.body.classList.add('dago-dol-select-combat-ready');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoDolSelectCombat=Object.freeze({version:VERSION,apply});
})();
