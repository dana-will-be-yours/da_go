(()=>{
'use strict';

const VERSION='1.15.0-preview-pipeline-hotfix';

function $(id){return document.getElementById(id);}
function pick(list){return list[Math.floor(Math.random()*list.length)];}

function renameRoleFieldset(){
  const legends=[...document.querySelectorAll('legend')];
  for(const legend of legends){
    if(String(legend.textContent||'').trim()==='性格與身分'){
      legend.textContent='身分';
    }
  }
}

function enforceSpecialOrigins(){
  const form=$('startForm');
  if(!form) return;

  const roles=new Set([...form.querySelectorAll('[name="roles"]')].map(x=>x.value).filter(Boolean));

  form.querySelectorAll('[data-requires-role]').forEach(input=>{
    const ok=roles.has(input.dataset.requiresRole);
    input.disabled=!ok;
    const label=input.closest('label');
    if(label) label.classList.toggle('choice-disabled',!ok);

    if(!ok && input.checked){
      const none=form.querySelector('[name="specialOrigin"][value="none"]');
      if(none) none.checked=true;
    }
  });
}

function randomizeRadioGroup(form,name){
  const items=[...form.querySelectorAll(`[name="${name}"]`)].filter(x=>!x.disabled);
  if(!items.length) return;
  items.forEach(x=>x.checked=false);
  pick(items).checked=true;
}

function randomizeSelect(select){
  const options=[...select.options].filter(x=>!x.disabled);
  if(!options.length) return;
  select.value=pick(options).value;
}

function randomize(){
  const form=$('startForm');
  if(!form) return;

  const names=['雲生','阿照','沈行','林澈','姚安','唐簡','陳四','北舟','花瓊','楚服','陽月','戎衣'];
  const playerName=$('playerName');
  if(playerName) playerName.value=pick(names);

  [
    'gender',
    'height',
    'build',
    'bodyLine',
    'skinTone',
    'clothes',
    'face',
    'eyeColor',
    'hairColor',
    'hairLength',
    'origin',
    'trait',
    'attributePlan',
    'startSeason',
    'gameMode',
    'difficulty',
    'textStyle'
  ].forEach(name=>randomizeRadioGroup(form,name));

  form.querySelectorAll('select[name="roles"]').forEach(randomizeSelect);

  enforceSpecialOrigins();
  randomizeRadioGroup(form,'specialOrigin');

  form.dispatchEvent(new Event('input',{bubbles:true}));
  form.dispatchEvent(new Event('change',{bubbles:true}));

  if(window.DaGoCharacterCreateUi && typeof window.DaGoCharacterCreateUi.preview==='function'){
    window.DaGoCharacterCreateUi.preview();
  }

  if(window.DaGoBalancedCharacterPreview && typeof window.DaGoBalancedCharacterPreview.patchPreview==='function'){
    window.DaGoBalancedCharacterPreview.patchPreview();
  }
}

function rebindRandomize(){
  const button=$('randomizeCharacter');
  if(!button || button.dataset.hotfix1150Randomize) return;

  button.dataset.hotfix1150Randomize=VERSION;
  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    randomize();
  },true);
}

function boot(){
  renameRoleFieldset();
  enforceSpecialOrigins();
  rebindRandomize();

  const form=$('startForm');
  if(form && !form.dataset.hotfix1150PreviewPipeline){
    form.dataset.hotfix1150PreviewPipeline=VERSION;
    form.addEventListener('change',()=>{
      renameRoleFieldset();
      enforceSpecialOrigins();
    },true);
    form.addEventListener('input',()=>{
      renameRoleFieldset();
      enforceSpecialOrigins();
    },true);
  }

  document.body.classList.add('dago-1150-preview-pipeline-hotfix-ready');
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}

window.DaGo1150RestoreSettingsHotfix=Object.freeze({
  version:VERSION,
  renameRoleFieldset,
  enforceSpecialOrigins,
  randomize,
  textStyle:true
});
})();