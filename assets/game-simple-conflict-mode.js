(()=>{
'use strict';
const VERSION='1.14.1-start-hotfix';
const STYLE_ID='dago-simple-conflict-style';
let lastSignature='';
function addStyle(){if(document.getElementById(STYLE_ID))return;const css=document.createElement('style');css.id=STYLE_ID;css.textContent=['.combat-hand,.combat-command-row,.deck-builder,.card-cost{display:none!important}', '.combat-card{display:none!important}', '.simple-conflict-panel{border:1px solid rgba(180,150,90,.45);padding:1rem;margin:1rem 0;background:rgba(40,30,20,.28)}', '.simple-conflict-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr));gap:.5rem;margin-top:.75rem}', '.simple-conflict-actions button{padding:.65rem .75rem}'].join('\n');document.head.appendChild(css)}
function simplePanel(){return '<section class="simple-conflict-panel" data-simple-conflict="1"><h3>衝突</h3><p>你與對手周旋。選擇一種做法，系統會依角色能力與目前局勢結算。</p><p>此模式已關閉式牌手札顯示，只保留攻守、交涉與觀望的簡易衝突。</p><div class="simple-conflict-actions"><button type="button" data-simple-conflict-action="attack">進擊</button><button type="button" data-simple-conflict-action="guard">防守</button><button type="button" data-simple-conflict-action="talk">交涉</button><button type="button" data-simple-conflict-action="wait">觀望</button></div></section>'}
function inCombat(){return !!document.querySelector('[data-card-index],[data-combat-command],.combat-board,.combat-enemy')}
function apply(){addStyle();if(!inCombat())return;const text=document.getElementById('passageText');if(!text)return;const sig=(document.getElementById('passageTitle')?.textContent||'')+'|'+(document.getElementById('passageMeta')?.textContent||'');if(sig===lastSignature&&text.querySelector('[data-simple-conflict]'))return;lastSignature=sig;if(!text.querySelector('[data-simple-conflict]'))text.insertAdjacentHTML('beforeend',simplePanel());const footer=document.getElementById('passageFooter');if(footer)footer.textContent=footer.textContent.replaceAll('牌組','衝突').replaceAll('戰鬥','衝突').replaceAll('DaGoCombat','衝突系統').replaceAll('DaGoDeck','行動系統')}
function firstCard(kind){const cards=[...document.querySelectorAll('[data-card-index]:not([disabled])')];if(kind==='attack')return cards.find(x=>/斬|刺|擊|攻|透|棍/.test(x.textContent||''))||cards[0];if(kind==='guard')return cards.find(x=>/守|防|護|壁/.test(x.textContent||''))||cards[0];if(kind==='talk')return cards.find(x=>/說|談|震|交|懾/.test(x.textContent||''))||cards[0];return cards[0]}
document.addEventListener('click',e=>{const btn=e.target.closest('[data-simple-conflict-action]');if(!btn)return;e.preventDefault();const a=btn.dataset.simpleConflictAction;if(a==='wait'){document.querySelector('[data-combat-command="end"],[data-end-turn="1"]')?.click();return}firstCard(a)?.click()});
document.addEventListener('click',()=>setTimeout(apply,0));
function boot(){addStyle();setTimeout(apply,0);document.body.classList.add('dago-simple-conflict-ready')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoSimpleConflictMode=Object.freeze({version:VERSION,apply});
})();
