(()=>{
'use strict';
const VERSION='1.12.5-character-ui';
const names=['雲生','阿照','沈行','林澈','姚安','唐簡','陳四','北舟','花瓊','楚服','陽月','戎衣'];
const $=id=>document.getElementById(id);
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function roleText(value){
  const rows=Object.values(window.ROLE_GROUPS||{}).flat();
  const hit=rows.find(x=>x[0]===value);
  return hit?hit[1]:value;
}
function selectedRadio(form,name){return form.querySelector(`[name="${name}"]:checked`)?.parentElement?.textContent.trim()||''}
function randomizeGroup(form,name){const rows=[...form.querySelectorAll(`[name="${name}"]`)].filter(x=>!x.disabled);if(rows.length)pick(rows).checked=true}
function randomizeSelect(sel){const opts=[...sel.options].filter(x=>!x.disabled);if(opts.length)sel.value=pick(opts).value}
function summarizeRoles(form){
  const roles=[...form.querySelectorAll('[name="roles"]')].map(x=>x.value).filter(Boolean);
  const counts={};roles.forEach(r=>counts[r]=(counts[r]||0)+1);
  return Object.entries(counts).map(([r,n])=>`${roleText(r)}${'戊丁丙乙甲'[Math.max(0,Math.min(4,n-1))]}`).join('、')||'未選';
}
function preview(){
  const form=$('startForm'), box=$('buildPreview');
  if(!form||!box)return;
  const name=$('playerName')?.value||'旅人';
  const text=[
    `姓名：${name}`,
    `身分：${summarizeRoles(form)}`,
    `出身：${selectedRadio(form,'origin')}`,
    `性格：${selectedRadio(form,'trait')}`,
    `外觀：${selectedRadio(form,'height')}、${selectedRadio(form,'build')}、${selectedRadio(form,'face')}、${selectedRadio(form,'hairColor')}`,
    `模式：${selectedRadio(form,'gameMode')} / ${selectedRadio(form,'difficulty')}`
  ];
  box.innerHTML='<h3>角色預覽</h3>'+text.map(x=>`<p>${x}</p>`).join('');
}
function randomize(){
  const form=$('startForm');if(!form)return;
  if($('playerName'))$('playerName').value=pick(names);
  ['gender','height','build','bodyLine','skinTone','clothes','face','eyeColor','hairColor','hairLength','origin','trait','attributePlan','startSeason','gameMode','difficulty'].forEach(n=>randomizeGroup(form,n));
  form.querySelectorAll('[name="roles"]').forEach(randomizeSelect);
  const none=form.querySelector('[name="specialOrigin"][value="none"]');if(none)none.checked=true;
  form.dispatchEvent(new Event('change',{bubbles:true}));
  preview();
}
function boot(){
  const form=$('startForm');if(!form||form.dataset.characterUi)return;form.dataset.characterUi=VERSION;
  $('randomizeCharacter')?.addEventListener('click',e=>{e.preventDefault();randomize()});
  form.addEventListener('change',preview,true);
  form.addEventListener('input',preview,true);
  preview();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoCharacterCreateUi={version:VERSION,preview,randomize};
})();
