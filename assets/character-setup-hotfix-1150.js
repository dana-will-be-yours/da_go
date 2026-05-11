(()=>{
'use strict';
const VERSION='1.15.0-restore-settings-hotfix';
const RANDOM_NAMES=['常山人','沈青','謝蘭','姚安','唐簡','陳四','北舟','花瓊','楚服','陽月','戎衣','林澈'];
function pick(list){return list[Math.floor(Math.random()*list.length)]}
function form(){return document.getElementById('startForm')}
function checkedRadio(f,name){return f.querySelector(`input[type="radio"][name="${name}"]:checked`)}
function setRadio(f,name){const rows=[...f.querySelectorAll(`input[type="radio"][name="${name}"]`)].filter(x=>!x.disabled);if(rows.length){rows.forEach(x=>x.checked=false);pick(rows).checked=true;}}
function setSelect(sel){const opts=[...sel.options].filter(x=>!x.disabled);if(opts.length)sel.value=pick(opts).value;}
function dispatchAll(target){target.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('change',{bubbles:true}));}
function renameRoleFieldset(){const f=form();if(!f)return;for(const fs of f.querySelectorAll('fieldset')){const lg=fs.querySelector('legend');if(lg&&lg.textContent.trim()==='性格與身分')lg.textContent='身分';}}
function enforceSpecialOrigins(){const f=form();if(!f)return;const roles=new Set([...f.querySelectorAll('select[name="roles"]')].map(x=>x.value));f.querySelectorAll('[data-requires-role]').forEach(input=>{const ok=roles.has(input.dataset.requiresRole);input.disabled=!ok;input.closest('label')?.classList.toggle('choice-disabled',!ok);if(!ok&&input.checked){const none=f.querySelector('input[name="specialOrigin"][value="none"]');if(none)none.checked=true;}});}
function randomize(){const f=form();if(!f)return;const name=document.getElementById('playerName');if(name)name.value=pick(RANDOM_NAMES);for(const n of ['gender','height','build','bodyLine','skinTone','clothes','face','eyeColor','hairColor','hairLength','origin','trait','attributePlan','startSeason','gameMode','difficulty','textStyle'])setRadio(f,n);for(const sel of f.querySelectorAll('select[name="roles"]'))setSelect(sel);enforceSpecialOrigins();const specials=[...f.querySelectorAll('input[type="radio"][name="specialOrigin"]')].filter(x=>!x.disabled);if(specials.length){specials.forEach(x=>x.checked=false);pick(specials).checked=true;}dispatchAll(f);window.DaGoCharacterCreateUi?.preview?.();window.DaGoBalancedCharacterPreview?.patchPreview?.();}
function bindRandomize(){const btn=document.getElementById('randomizeCharacter');if(!btn||btn.dataset.hotfix1150)return;btn.dataset.hotfix1150=VERSION;btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopImmediatePropagation();randomize();},true);}
function boot(){renameRoleFieldset();enforceSpecialOrigins();bindRandomize();const f=form();if(f&&!f.dataset.hotfix1150){f.dataset.hotfix1150=VERSION;f.addEventListener('change',()=>{renameRoleFieldset();enforceSpecialOrigins();},true);}document.body.classList.add('dago-1150-restore-settings-hotfix-ready');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGo1150RestoreSettingsHotfix=Object.freeze({version:VERSION,randomize,renameRoleFieldset,enforceSpecialOrigins});
})();
