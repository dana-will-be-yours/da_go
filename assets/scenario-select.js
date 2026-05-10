(()=>{
'use strict';
const VERSION='1.11.1-xiaocheng-local';
const STORE='daGoScenarioSelection';
const DEFAULT_SCENARIO_URL='assets/data/scenarios/xiaocheng-jiushi.json?v='+encodeURIComponent(VERSION);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DEFAULT_FEATURES=[
  '玩家是常山縣本地人，從東門、客棧、市集、縣衙、河埠與田里開始生活。',
  '天津郡下含常山縣、衡水縣、珩灣縣；滄北邑隸屬珩灣縣。',
  '技能檢定採 4D3 + 調整值 + 技能值，成功與失敗都會寫入遊玩紀錄。',
  '飢餓、疲勞、精神、鎮定與疑心會影響行動結果，過高壓力會帶來暈厥風險。'
];
let scenarios=[];
let selected=null;
let entered=false;
function addStyle(){
  if(document.getElementById('scenarioSelectStyle'))return;
  const style=document.createElement('style');
  style.id='scenarioSelectStyle';
  style.textContent=`
  #startForm.dago-wait-scenario{display:none!important;}
  .scenario-select-panel{border:1px solid rgba(190,160,82,.72);background:rgba(24,24,24,.96);box-shadow:0 1rem 3rem rgba(0,0,0,.42);padding:1.25rem;margin:0 0 1.35rem;color:#ddd;position:relative;overflow:hidden;}
  .scenario-select-inner{position:relative;z-index:1;}
  .scenario-panel-title{font-family:'DFKai-SB','BiauKai','KaiTi','STKaiti','PMingLiU',serif;color:#f1d176;font-size:1.25rem;margin:0 0 .75rem;letter-spacing:.08em;text-align:center;}
  .scenario-title{font-family:'DFKai-SB','BiauKai','KaiTi','STKaiti','PMingLiU',serif;color:#f1d176;font-size:1.55rem;margin:.4rem 0 .25rem;letter-spacing:.08em;text-align:center;}
  .scenario-subtitle{color:#cfc3a3;margin:.15rem 0 1rem;text-align:center;}
  .scenario-actions{display:flex;gap:.65rem;flex-wrap:wrap;margin:.9rem 0 1rem;align-items:center;}
  .scenario-actions button,.scenario-actions select{font:inherit;background:#342818;color:#f1e6c4;border:1px solid rgba(209,177,99,.75);padding:.48rem .7rem;}
  .scenario-actions button{cursor:pointer;}
  .scenario-current{margin:.55rem 0;text-align:center;color:#e8dfc8;}
  .scenario-summary{border-top:1px solid rgba(209,177,99,.42);border-bottom:1px solid rgba(209,177,99,.28);padding:.85rem 0;margin:.75rem 0;}
  .scenario-summary p{line-height:1.9;margin:.35rem 0;}
  .scenario-feature-card{background:rgba(0,0,0,.24);border:1px solid rgba(180,180,180,.2);padding:.85rem;margin-top:.85rem;}
  .scenario-feature-card h3{font-size:1rem;margin:.1rem 0 .55rem;color:#f0dfb0;}
  .scenario-feature-card ul{margin:.25rem 0 0;padding-left:1.2rem;}
  .scenario-feature-card li{margin:.35rem 0;line-height:1.75;}
  .scenario-hidden-input{display:none;}
  @media(max-width:760px){.scenario-title{font-size:1.35rem}.scenario-actions{display:grid;grid-template-columns:1fr}.scenario-actions select,.scenario-actions button{width:100%;}}
  `;
  document.head.appendChild(style);
}
function fallbackScenario(){
  return {
    scenario_code:'xiaocheng_jiushi',
    scenario_name:'小城舊事',
    scenario_subtitle:'大興十年天津郡常山縣',
    intro:{
      summary:'大興十年，你是天津郡常山縣本地人。縣城不大，客棧、市集、縣衙、河埠與田里各有活計與消息。',
      features:DEFAULT_FEATURES.slice()
    }
  };
}
function safeSaveLocal(s){
  try{localStorage.setItem(STORE,JSON.stringify({scenario_code:s.scenario_code,scenario_name:s.scenario_name,loaded_at:new Date().toISOString()}))}catch{}
}
function normalizeScenario(x){
  if(!x||typeof x!=='object')throw new Error('劇本 JSON 格式錯誤');
  const base=fallbackScenario();
  const s=Object.assign({},base,x);
  s.intro=Object.assign({},base.intro,x.intro||{});
  if(!Array.isArray(s.intro.features)||!s.intro.features.length)s.intro.features=DEFAULT_FEATURES.slice();
  return s;
}
function renderScenario(s){
  const panel=$('scenarioSelectPanel');
  if(!panel||!s)return;
  const features=(s.intro?.features||DEFAULT_FEATURES).map(x=>`<li>${esc(x)}</li>`).join('');
  panel.querySelector('#scenarioCurrentName').textContent=s.scenario_name||'小城舊事';
  panel.querySelector('#scenarioDetail').innerHTML=`
    <h2 class="scenario-title">${esc(s.scenario_name)}</h2>
    <p class="scenario-subtitle">${esc(s.scenario_subtitle||'')}</p>
    <section class="scenario-summary"><p>${esc(s.intro?.summary||'')}</p></section>
    <article class="scenario-feature-card"><h3>劇本內容</h3><ul>${features}</ul></article>`;
}
function installPanel(){
  const startPanel=$('startPanel'),form=$('startForm');
  if(!startPanel||!form||$('scenarioSelectPanel'))return;
  form.classList.add('dago-wait-scenario');
  const panel=document.createElement('section');
  panel.id='scenarioSelectPanel';
  panel.className='scenario-select-panel';
  panel.innerHTML=`<div class="scenario-select-inner">
    <p class="scenario-panel-title">劇本選擇</p>
    <div class="scenario-actions">
      <button type="button" id="scenarioInfoBtn">查看劇本摘要</button>
      <button type="button" id="scenarioImportBtn">匯入劇本 JSON</button>
      <select id="scenarioSwitch" title="切換劇本"><option value="xiaocheng_jiushi">小城舊事</option></select>
      <button type="button" id="scenarioEnterBtn">進入劇本</button>
      <input id="scenarioImportInput" class="scenario-hidden-input" type="file" accept="application/json,.json">
    </div>
    <p class="scenario-current">目前劇本：<b id="scenarioCurrentName">小城舊事</b></p>
    <div id="scenarioDetail"></div>
  </div>`;
  startPanel.insertBefore(panel,form);
  $('scenarioInfoBtn').onclick=()=>renderScenario(selected);
  $('scenarioImportBtn').onclick=()=>$('scenarioImportInput').click();
  $('scenarioImportInput').onchange=readImport;
  $('scenarioSwitch').onchange=e=>{const s=scenarios.find(x=>x.scenario_code===e.target.value);if(s){selected=s;renderScenario(s)}};
  $('scenarioEnterBtn').onclick=enterScenario;
}
async function readImport(e){
  const f=e.target.files&&e.target.files[0];
  if(!f)return;
  try{
    const s=normalizeScenario(JSON.parse(await f.text()));
    scenarios=scenarios.filter(x=>x.scenario_code!==s.scenario_code).concat(s);
    selected=s;
    if(!$('scenarioSwitch').querySelector(`option[value="${CSS.escape(s.scenario_code)}"]`)){
      const opt=document.createElement('option');
      opt.value=s.scenario_code;
      opt.textContent=s.scenario_name;
      $('scenarioSwitch').appendChild(opt);
    }
    $('scenarioSwitch').value=s.scenario_code;
    renderScenario(s);
  }catch(err){alert('劇本匯入失敗：'+(err&&err.message?err.message:err));}
}
function enterScenario(){
  if(!selected)return;
  entered=true;
  safeSaveLocal(selected);
  document.body.dataset.scenarioCode=selected.scenario_code;
  const form=$('startForm');
  if(form)form.classList.remove('dago-wait-scenario');
  const panel=$('scenarioSelectPanel');
  if(panel)panel.style.display='none';
  if(form&&!form.querySelector('[name="scenarioCode"]')){
    const note=document.createElement('input');
    note.type='hidden';
    note.name='scenarioCode';
    note.value=selected.scenario_code;
    form.appendChild(note);
  }
}
function patchRenownLevel(){
  document.querySelectorAll('[name="renownLevel"]').forEach(input=>{
    input.value='1';
    if(input.tagName==='SELECT')input.disabled=true;
    const label=input.closest('label');
    if(label)label.hidden=true;
  });
}
async function boot(){
  addStyle();
  installPanel();
  patchRenownLevel();
  try{
    selected=normalizeScenario(await (await fetch(DEFAULT_SCENARIO_URL,{cache:'no-store'})).json());
  }catch{
    selected=normalizeScenario(fallbackScenario());
  }
  scenarios=[selected];
  renderScenario(selected);
  const obs=new MutationObserver(()=>{if(!entered)installPanel();patchRenownLevel()});
  obs.observe(document.documentElement,{childList:true,subtree:true});
}
boot();
})();
