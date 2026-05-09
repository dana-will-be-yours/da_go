(()=>{
'use strict';
const VERSION='1.10.0-scenario-select';
const STORE='daGoScenarioSelection';
const DEFAULT_SCENARIO_URL='assets/data/scenarios/xiaocheng-jiushi.json?v='+encodeURIComponent(VERSION);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let scenarios=[];
let selected=null;
let entered=false;
function addStyle(){
  const style=document.createElement('style');
  style.textContent=`
  #startForm.dago-wait-scenario{display:none!important;}
  .scenario-select-panel{border:1px solid rgba(190,160,82,.72);background:linear-gradient(180deg,rgba(54,40,20,.52),rgba(15,15,18,.92));box-shadow:0 1rem 3rem rgba(0,0,0,.42);padding:1.25rem;margin:0 0 1.35rem;color:#ddd;position:relative;overflow:hidden;}
  .scenario-select-panel:before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(211,170,66,.18),transparent 32%);pointer-events:none;}
  .scenario-select-inner{position:relative;z-index:1;}
  .scenario-title{font-family:'DFKai-SB','標楷體','BiauKai','KaiTi','STKaiti','PMingLiU',serif;color:#f1d176;font-size:1.75rem;margin:0 0 .25rem;letter-spacing:.08em;}
  .scenario-subtitle{color:#cfc3a3;margin:.15rem 0 1rem;}
  .scenario-actions{display:flex;gap:.65rem;flex-wrap:wrap;margin:.9rem 0 1rem;}
  .scenario-actions button,.scenario-actions select{font:inherit;background:#342818;color:#f1e6c4;border:1px solid rgba(209,177,99,.75);padding:.48rem .7rem;}
  .scenario-actions button{cursor:pointer;}
  .scenario-actions button:hover{background:#46351d;}
  .scenario-summary{border-top:1px solid rgba(209,177,99,.42);border-bottom:1px solid rgba(209,177,99,.28);padding:.85rem 0;margin:.75rem 0;}
  .scenario-summary p{line-height:1.8;margin:.35rem 0;}
  .scenario-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;margin-top:.85rem;}
  .scenario-card{background:rgba(0,0,0,.28);border:1px solid rgba(180,180,180,.2);padding:.75rem;}
  .scenario-card h3{font-size:1rem;margin:.1rem 0 .45rem;color:#f0dfb0;}
  .scenario-card ul{margin:.25rem 0 0;padding-left:1.2rem;}
  .scenario-card li{margin:.25rem 0;}
  .scenario-hidden-input{display:none;}
  @media(max-width:760px){.scenario-grid{grid-template-columns:1fr}.scenario-title{font-size:1.45rem}}
  `;
  document.head.appendChild(style);
}
function safeLoadLocal(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function safeSaveLocal(s){try{localStorage.setItem(STORE,JSON.stringify({scenario_code:s.scenario_code,scenario_name:s.scenario_name,loaded_at:new Date().toISOString()}))}catch{}}
function normalizeScenario(x){
  if(!x||typeof x!=='object')throw new Error('劇本 JSON 格式錯誤');
  return Object.assign({schema_version:'da_go_scenario_bundle_v1',scenario_code:'custom_'+Date.now(),scenario_name:'未命名劇本',scenario_subtitle:'自訂劇本',intro:{summary:'未提供簡介。',features:[],gm_note:''},time_span:{},scope:{},worldview:{},geography:{districts:[]},characters:[],plot:{main_threads:[]}},x);
}
function renderScenario(s){
  const panel=$('scenarioSelectPanel'); if(!panel)return;
  const districts=(s.geography?.districts||[]).map(d=>`<li>${esc(d.name)}：${esc((d.locations||[]).join('、'))}</li>`).join('')||'<li>未提供</li>';
  const features=(s.intro?.features||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>未提供</li>';
  const chars=(s.characters||[]).slice(0,8).map(x=>`<li>${esc(x.name)}：${esc(x.role||'劇中人物')}</li>`).join('')||'<li>未提供</li>';
  const threads=(s.plot?.main_threads||[]).map(x=>`<li>${esc(x.title)}：${esc(x.goal||'')}</li>`).join('')||'<li>未提供</li>';
  panel.querySelector('#scenarioCurrentName').textContent=s.scenario_name||'未命名劇本';
  panel.querySelector('#scenarioDetail').innerHTML=`
    <h2 class="scenario-title">${esc(s.scenario_name)}</h2>
    <p class="scenario-subtitle">${esc(s.scenario_subtitle||'')}</p>
    <section class="scenario-summary">
      <p><b>劇情介紹：</b>${esc(s.intro?.summary||'未提供')}</p>
      <p><b>劇情時間段：</b>${esc(s.time_span?.start_date||'未提供')}</p>
      <p><b>玩家活動範圍：</b>${esc(s.scope?.player_area||'未提供')}。${esc(s.scope?.restriction||'')}</p>
      <p><b>劇本封裝：</b>${esc(s.worldview?.title||'大國年代記')} / ${esc(s.runtime_bundle||'未指定 runtime bundle')}</p>
    </section>
    <div class="scenario-grid">
      <article class="scenario-card"><h3>劇本遊玩特色</h3><ul>${features}</ul></article>
      <article class="scenario-card"><h3>地理環境</h3><ul>${districts}</ul></article>
      <article class="scenario-card"><h3>人物角色</h3><ul>${chars}</ul></article>
      <article class="scenario-card"><h3>完整劇情線</h3><ul>${threads}</ul></article>
    </div>`;
}
function installPanel(){
  const startPanel=$('startPanel'), form=$('startForm'); if(!startPanel||!form||$('scenarioSelectPanel'))return;
  form.classList.add('dago-wait-scenario');
  const panel=document.createElement('section');
  panel.id='scenarioSelectPanel';
  panel.className='scenario-select-panel';
  panel.innerHTML=`<div class="scenario-select-inner">
    <h1>大國年代記</h1>
    <p class="version">劇本選擇</p>
    <div class="scenario-actions">
      <button type="button" id="scenarioInfoBtn">呈現劇本簡介</button>
      <button type="button" id="scenarioImportBtn">輸入劇本</button>
      <select id="scenarioSwitch" title="現有劇本切換"><option value="xiaocheng_jiushi">小城舊事</option></select>
      <button type="button" id="scenarioEnterBtn">進入劇本</button>
      <input id="scenarioImportInput" class="scenario-hidden-input" type="file" accept="application/json,.json">
    </div>
    <p>目前劇本：<b id="scenarioCurrentName">小城舊事</b></p>
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
  const f=e.target.files&&e.target.files[0]; if(!f)return;
  const text=await f.text();
  try{
    const s=normalizeScenario(JSON.parse(text));
    scenarios=scenarios.filter(x=>x.scenario_code!==s.scenario_code).concat(s);
    selected=s;
    const opt=document.createElement('option'); opt.value=s.scenario_code; opt.textContent=s.scenario_name;
    $('scenarioSwitch').appendChild(opt); $('scenarioSwitch').value=s.scenario_code;
    renderScenario(s);
  }catch(err){alert('劇本匯入失敗：'+(err&&err.message?err.message:err));}
}
function enterScenario(){
  if(!selected)return;
  entered=true;
  safeSaveLocal(selected);
  document.body.dataset.scenarioCode=selected.scenario_code;
  const form=$('startForm'); if(form)form.classList.remove('dago-wait-scenario');
  const panel=$('scenarioSelectPanel'); if(panel)panel.style.display='none';
  const note=document.createElement('input');
  note.type='hidden'; note.name='scenarioCode'; note.value=selected.scenario_code;
  form?.appendChild(note);
}
function patchRenownLevel(){
  const select=document.querySelector('[name="renownLevel"]');
  if(select){
    select.value='1'; select.disabled=true;
    const label=select.closest('label');
    if(label&&!label.dataset.fixed){label.dataset.fixed='1';label.insertAdjacentHTML('afterend','<small class="field-help">創建角色時名聲經驗固定為 1；遊戲中依玩家行為變更。</small>')}
  }
}
async function boot(){
  addStyle();
  installPanel();
  patchRenownLevel();
  try{selected=normalizeScenario(await (await fetch(DEFAULT_SCENARIO_URL,{cache:'no-store'})).json())}catch{selected=normalizeScenario({scenario_code:'xiaocheng_jiushi',scenario_name:'小城舊事',scenario_subtitle:'大興二十年南京篇',intro:{summary:'南京城內，南陽帳目、銀川急信與崑崙遠訊彼此交錯。',features:['南京限定探索','帳目、急信、門派消息三線並進']},time_span:{start_date:'大興二十年九月九日'},scope:{player_area:'南京'},runtime_bundle:'assets/data/dago-nanjing-v5-bundle.json'})}
  scenarios=[selected];
  renderScenario(selected);
  const obs=new MutationObserver(()=>{if(!entered)installPanel();patchRenownLevel()});
  obs.observe(document.documentElement,{childList:true,subtree:true});
}
boot();
})();
