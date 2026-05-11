(()=>{
'use strict';
const VERSION='1.15.4-canonical-balance';

function form(){return document.getElementById('startForm');}
function cleanText(s){return String(s||'').replace(/\s+/g,'').trim();}
function optionName(sel){
  const opt=sel && sel.options && sel.options[sel.selectedIndex];
  return cleanText(opt && opt.textContent) || '身分';
}
const ROLE_SKILLS={
  yamen_clerk:['office','study','observe','language'],
  runner:['observe','light','jianghu','listen'],
  constable:['observe','outer','strike','threat'],
  soldier:['outer','slash','strike','will'],
  urban_household:['speech','resource','observe','jianghu'],
  workshop:['craft','appraise','resource','study'],
  teahouse:['listen','speech','jianghu','empathy'],
  market_broker:['appraise','wealth','speech','listen'],
  rural_farmer:['nature','outer','resource','will'],
  hunter:['observe','nature','pierce','hide'],
  fisher:['swim','nature','listen','outer'],
  literatus:['study','language','history','elegance'],
  copyist:['study','appraise','observe','language'],
  strongman:['outer','strike','threat','will'],
  escort:['slash','pierce','observe','jianghu'],
  dock_labor:['outer','resource','listen','will'],
  wanderer:['hide','jianghu','listen','will'],
  merchant:['wealth','resource','appraise','speech'],
  medic:['medicine','pharma','nature','observe'],
  disciple:['inner','light','pierce','jianghu']
};
const BG_SKILLS={
  changshan:['geo','nature','jianghu','listen'],
  tianjin:['court','speech','resource','office'],
  hengshui:['geo','nature','resource','will'],
  hengwan:['swim','resource','listen','geo'],
  cangbei:['jianghu','will','history','listen'],
  nanjing:['court','study','elegance','speech'],
  calm:['will','observe','empathy','study'],
  streetwise:['jianghu','listen','observe','speech'],
  silver_tongue:['speech','empathy','listen','elegance'],
  sturdy:['outer','will','nature','resource'],
  upright:['elegance','empathy','will','speech'],
  reckless:['slash','threat','outer','will'],
  balanced:['outer','observe','study','speech'],
  body:['outer','inner','strike','will'],
  tech:['sleight','observe','craft','appraise'],
  mind:['study','history','language','observe'],
  social:['speech','empathy','elegance','listen'],
  travel:['light','geo','nature','jianghu'],
  none:['observe','will','speech','listen'],
  taihu_wei:['wealth','court','history','speech'],
  jinling_yang:['study','speech','elegance','language'],
  cangbei_bei:['jianghu','history','will','listen'],
  qishan_ye:['slash','outer','will','observe'],
  kunlun_chu:['pierce','light','elegance','inner'],
  wanminhui:['jianghu','listen','hide','speech']
};
function radioRow(name,kind){
  const f=form();
  if(!f) return null;
  const input=f.querySelector(`[name="${name}"]:checked`);
  if(!input) return null;
  return {
    kind,
    code:String(input.value||''),
    name:cleanText(input.parentElement && input.parentElement.textContent) || kind
  };
}
function selectedRoleRows(){
  const f=form();
  if(!f) return [];
  return [...f.querySelectorAll('select[name="roles"]')]
    .map(sel=>({kind:'身分',code:String(sel.value||''),name:optionName(sel)}))
    .filter(x=>x.code);
}
function selectedBackgroundRows(){
  return [
    radioRow('origin','出身地'),
    radioRow('trait','性格'),
    radioRow('attributePlan','屬性點配置'),
    radioRow('specialOrigin','特殊身世')
  ].filter(Boolean);
}
function skillsFor(row){
  const source=row.kind==='身分' ? ROLE_SKILLS[row.code] : BG_SKILLS[row.code];
  return (source || ['observe','speech','listen','will']).slice(0,4);
}
function buildRows(){
  return selectedRoleRows().concat(selectedBackgroundRows()).map(row=>({
    kind:row.kind,
    code:row.code,
    name:row.name,
    skills:skillsFor(row),
    talents:[`${row.name}見聞`]
  }));
}
function addSkill(target,k){
  target[k]=Math.min(5,(Number(target[k])||0)+1);
}
function normalizeState(st){
  if(!st) return st;
  const rows=buildRows();
  const skills={};
  const talents=[];
  for(const row of rows){
    for(const k of row.skills) addSkill(skills,k);
    for(const t of row.talents) if(!talents.includes(t)) talents.push(t);
  }
  st.skills=skills;
  st.player=st.player||{};
  st.player.roleNames=selectedRoleRows().map(x=>x.name);
  st.player.canonicalCharacterRows=rows.map(row=>({
    kind:row.kind,
    code:row.code,
    name:row.name,
    skillPointCount:row.skills.length,
    skills:Object.fromEntries(row.skills.map(k=>[k,1])),
    talents:row.talents
  }));
  st.player.specialTalents=talents;
  st.characterCanonicalBalanceVersion=VERSION;
  window.DaGoRules?.recalcAttrs?.(st);
  return st;
}
const rawSet=localStorage.setItem.bind(localStorage);
if(!localStorage.__daGoCanonicalBalanceV1154){
  Object.defineProperty(localStorage,'__daGoCanonicalBalanceV1154',{value:1});
  localStorage.setItem=function(k,v){
    if(k==='daGoPlayV7' || k==='daGoPlayV6'){
      try{v=JSON.stringify(normalizeState(JSON.parse(v)));}catch{}
    }
    return rawSet(k,v);
  };
}
function audit(){
  const rows=buildRows();
  return {
    version:VERSION,
    rowCount:rows.length,
    allRowsHaveFourSkillPoints:rows.every(row=>row.skills.length===4),
    rows:rows.map(row=>({kind:row.kind,code:row.code,name:row.name,skillPointCount:row.skills.length,skills:row.skills}))
  };
}
window.DaGoCanonicalBalanceFix=Object.freeze({version:VERSION,buildRows,normalizeState,audit});
})();
