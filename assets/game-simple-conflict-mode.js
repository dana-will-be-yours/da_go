(()=>{
'use strict';
const VERSION='1.14.0-chinese-simple-combat';
const STYLE_ID='dago-simple-conflict-style';
function addStyle(){if(document.getElementById(STYLE_ID))return;const css=document.createElement('style');css.id=STYLE_ID;css.textContent=[
'.combat-hand,.combat-command-row,.deck-builder,.card-cost{display:none!important}',
'.combat-card{display:none!important}',
'.simple-conflict-panel{border:1px solid rgba(180,150,90,.45);padding:1rem;margin:1rem 0;background:rgba(40,30,20,.28)}',
'.simple-conflict-panel h3{margin-top:0}',
'.simple-conflict-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr));gap:.5rem;margin-top:.75rem}',
'.simple-conflict-actions button{padding:.65rem .75rem}',
'.simple-conflict-note{opacity:.86;font-size:.95rem}'
].join('\n');document.head.appendChild(css)}
function firstEnabledCard(test){const cards=[...document.querySelectorAll('[data-card-index]:not([disabled])')];return cards.find(test)||cards[0]||null}
function clickCard(kind){let card=null;if(kind==='attack')card=firstEnabledCard(el=>/斬|刺|擊|攻|透|棍/.test(el.textContent||''));if(kind==='guard')card=firstEnabledCard(el=>/守|防|護|壁/.test(el.textContent||''));if(kind==='talk')card=firstEnabledCard(el=>/說|談|震|交|懾/.test(el.textContent||''));if(card){card.click();return true}const end=document.querySelector('[data-combat-command="end"],[data-end-turn="1"]');if(end){end.click();return true}return false}
function simplePanel(){return '<section class="simple-conflict-panel" data-simple-conflict="1"><h3>衝突</h3><p>你與對手周旋。選擇一種做法，系統會依角色能力與目前局勢結算。</p><p class="simple-conflict-note">此模式已關閉式牌手札顯示，只保留攻守、交涉與退避的簡易衝突。</p><div class="simple-conflict-actions"><button type="button" data-simple-conflict-action="attack">進擊</button><button type="button" data-simple-conflict-action="guard">防守</button><button type="button" data-simple-conflict-action="talk">交涉</button><button type="button" data-simple-conflict-action="wait">觀望</button></div></section>'}
function inCombat(){return !!document.querySelector('.combat-board,.combat-panel,.combat-enemy,[data-card-index],[data-combat-command]')}
function stripCardTerms(){const footer=document.getElementById('passageFooter');if(footer){footer.textContent=footer.textContent.replaceAll('牌組','衝突').replaceAll('戰鬥','衝突').replaceAll('DaGoCombat','衝突系統').replaceAll('DaGoDeck','行動系統')}const meta=document.getElementById('passageMeta');if(meta){meta.textContent=meta.textContent.replaceAll('牌組戰鬥','簡易衝突').replaceAll('DaGoCombat','簡易衝突')}}
function apply(){addStyle();if(!inCombat())return;const text=document.getElementById('passageText');if(text&&!text.querySelector('[data-simple-conflict]'))text.insertAdjacentHTML('beforeend',simplePanel());stripCardTerms()}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-simple-conflict-action]');if(!btn)return;e.preventDefault();const action=btn.dataset.simpleConflictAction;if(action==='wait'){const end=document.querySelector('[data-combat-command="end"],[data-end-turn="1"]');if(end)end.click();return}clickCard(action)});
function boot(){apply();const observer=new MutationObserver(()=>apply());observer.observe(document.body,{childList:true,subtree:true});document.body.classList.add('dago-simple-conflict-ready')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoSimpleConflictMode=Object.freeze({version:VERSION,apply});
})();
