(()=>{
'use strict';
const VERSION='1.15.0-balanced-character-preview';
const STORE7='daGoPlayV7';
const STORE6='daGoPlayV6';
const RANKS='戊丁丙乙甲';

const ROLE_NAMES={
  court_official:'京官',local_official:'地方官',technical_official:'技官',liuwaiguan:'流外官',staff_officer:'參軍',coroner:'仵作穩婆',wenxuan:'文選',family_official:'家世官',border_soldier:'邊防關部伍',
  yamen_clerk:'書吏',runner:'差役',constable:'捕役',soldier:'兵戶',urban_household:'坊郭戶',workshop:'作坊戶',teahouse:'茶棚幫閒',market_broker:'市牙人',rural_farmer:'農戶',hunter:'獵戶',fisher:'漁戶',village_elder:'里正家人',
  literatus:'士子',copyist:'抄書人',tutor:'塾師',poet:'詩客',strongman:'壯士',escort:'鏢客',dock_labor:'埠頭力夫',militia:'團練',wanderer:'遊手',gambler:'賭徒',vagrant:'浪人',broker:'掮客',house_scion:'門閥子弟',
  merchant:'行商',medic:'坊郭醫',artist:'伎伶俳優',disciple:'門派弟子',shopkeeper:'店家',innkeeper:'客棧掌櫃',retainer:'家臣',scholar:'學士',aesthete:'雅士',nvhuan:'女宦',matchmaker:'媒妁',military_commander:'將帥',
  official:'官員',doctor:'醫者',farmer:'農人',guard:'護院',artisan:'匠人',performer:'伎伶俳優',fortuneteller:'相命',ranger:'遊俠',yishi:'藝師',iron_guest:'鐵客',mendicant:'行腳人',peddler:'貨郎',boatman:'船夫',scribe:'書手'
};
const BACKGROUND_NAMES={
  changshan:'常山縣本地人',tianjin:'天津郡郡城',hengshui:'衡水縣',hengwan:'珩灣縣',cangbei:'滄北邑',nanjing:'南京',donglai:'東萊郡',jiangdu:'江都郡',yinzhou:'銀川郡',jiannan:'劍南郡',taihu:'太湖郡',shangqiu:'商丘郡',
  calm:'冷靜',streetwise:'熟路',silver_tongue:'善談',sturdy:'耐勞',upright:'雅正',reckless:'急烈',
  balanced:'均衡',body:'體魄',tech:'技巧',mind:'智識',social:'交際',travel:'行路',
  none:'無特殊身世',taihu_wei:'太湖魏家旁支',jinling_yang:'金陵陽家旁支',cangbei_bei:'滄北北家舊識',qishan_ye:'岐山葉氏',kunlun_chu:'蓬萊崑崙外系',wanminhui:'萬民會暗語'
};
const SKILL_NAMES={
  inner:'內功',outer:'外功',light:'輕功',swim:'水性',climb:'攀行',pierce:'刺擊',slash:'斬擊',strike:'打擊',sense:'感知',sleight:'巧手',craft:'工藝',appraise:'辨別',medicine:'醫術',pharma:'調藥',
  ride:'騎術',hide:'躲藏',observe:'觀察',listen:'聆聽',smell:'品嗅',office:'政務',animal:'馴養',threat:'威嚇',art:'表達',elegance:'雅藝',appearance:'相貌',resource:'資源',wealth:'財富',
  court:'官場',jianghu:'江湖',geo:'地理',nature:'自然',history:'歷史',religion:'信仰',study:'學藝',will:'意志',language:'語言',social:'交際',empathy:'共情',speech:'口才',body:'體魄',tech:'技巧',mind:'智識'
};
const ROLE_SKILLS={
  court_official:['court','office','speech','study'],local_official:['office','court','observe','speech'],technical_official:['craft','appraise','office','study'],liuwaiguan:['office','court','resource','observe'],staff_officer:['office','study','history','speech'],coroner:['medicine','observe','appraise','study'],wenxuan:['office','study','court','language'],family_official:['office','resource','speech','court'],border_soldier:['outer','slash','will','geo'],
  yamen_clerk:['office','study','observe','language'],runner:['observe','light','jianghu','listen'],constable:['observe','outer','strike','threat'],soldier:['outer','slash','strike','will'],urban_household:['speech','resource','observe','jianghu'],workshop:['craft','appraise','resource','study'],teahouse:['listen','speech','jianghu','empathy'],market_broker:['appraise','wealth','speech','listen'],rural_farmer:['nature','outer','resource','will'],hunter:['observe','nature','pierce','hide'],fisher:['swim','nature','listen','outer'],village_elder:['office','speech','history','jianghu'],
  literatus:['study','language','history','elegance'],copyist:['study','appraise','observe','language'],tutor:['study','language','empathy','speech'],poet:['art','elegance','speech','language'],strongman:['outer','strike','threat','will'],escort:['slash','pierce','observe','jianghu'],dock_labor:['outer','resource','listen','will'],militia:['outer','slash','observe','resource'],wanderer:['hide','jianghu','listen','will'],gambler:['sleight','observe','jianghu','speech'],vagrant:['hide','jianghu','resource','will'],broker:['speech','jianghu','appraise','listen'],house_scion:['court','wealth','elegance','speech'],
  merchant:['wealth','resource','appraise','speech'],medic:['medicine','pharma','nature','observe'],artist:['art','elegance','empathy','speech'],disciple:['inner','light','pierce','jianghu'],shopkeeper:['wealth','resource','appraise','speech'],innkeeper:['listen','speech','resource','jianghu'],retainer:['court','office','will','speech'],scholar:['study','language','history','elegance'],aesthete:['elegance','art','speech','appraise'],nvhuan:['listen','empathy','hide','speech'],matchmaker:['speech','empathy','listen','jianghu'],military_commander:['office','outer','history','speech'],official:['court','office','speech','study'],doctor:['medicine','pharma','nature','observe'],farmer:['nature','outer','resource','will'],guard:['outer','strike','observe','threat'],artisan:['craft','appraise','resource','study'],performer:['art','elegance','empathy','speech'],fortuneteller:['religion','empathy','speech','observe'],ranger:['light','slash','jianghu','observe'],yishi:['art','elegance','study','speech'],iron_guest:['outer','strike','will','jianghu']
};
const BG_SKILLS={
  changshan:['geo','nature','jianghu','listen'],tianjin:['court','speech','resource','office'],hengshui:['geo','nature','resource','will'],hengwan:['swim','resource','listen','geo'],cangbei:['jianghu','will','history','listen'],nanjing:['court','study','elegance','speech'],donglai:['geo','resource','listen','speech'],jiangdu:['geo','resource','speech','wealth'],yinzhou:['geo','will','resource','outer'],jiannan:['geo','jianghu','nature','light'],taihu:['swim','resource','wealth','listen'],shangqiu:['wealth','appraise','speech','resource'],
  calm:['will','observe','empathy','study'],streetwise:['jianghu','listen','observe','speech'],silver_tongue:['speech','empathy','listen','elegance'],sturdy:['outer','will','nature','resource'],upright:['elegance','empathy','will','speech'],reckless:['slash','threat','outer','will'],
  balanced:['outer','observe','study','speech'],body:['outer','inner','strike','will'],tech:['sleight','observe','craft','appraise'],mind:['study','history','language','observe'],social:['speech','empathy','elegance','listen'],travel:['light','geo','nature','jianghu'],
  none:['observe','will','speech','listen'],taihu_wei:['wealth','court','history','speech'],jinling_yang:['study','speech','elegance','language'],cangbei_bei:['jianghu','history','will','listen'],qishan_ye:['slash','outer','will','observe'],kunlun_chu:['pierce','light','elegance','inner'],wanminhui:['jianghu','listen','hide','speech']
};

const TALENT_BY_CODE=Object.assign({},
  Object.fromEntries(Object.entries(ROLE_NAMES).map(([k,v])=>[k,[`${v}門路`,`${v}經歷`]])),
  Object.fromEntries(Object.entries(BACKGROUND_NAMES).map(([k,v])=>[k,[`${v}見聞`]]))
);
const ALL_NAMES=Object.assign({}, ROLE_NAMES, BACKGROUND_NAMES, SKILL_NAMES);
let rendering=false;

function hasLatin(s){return /[A-Za-z_]/.test(String(s||''));}
function cleanText(s){return String(s||'').replace(/\s+/g,'').trim();}
function optionName(sel){
  const opt=sel&&sel.options&&sel.options[sel.selectedIndex];
  const text=cleanText(opt&&opt.textContent);
  if(text && !hasLatin(text)) return text;
  return '';
}
function selectedRoleRows(){
  const form=document.getElementById('startForm');
  if(!form) return [];
  return [...form.querySelectorAll('select[name="roles"]')].map(sel=>({
    code:String(sel.value||''),
    name:ROLE_NAMES[sel.value]||optionName(sel)||'身分'
  })).filter(x=>x.code);
}
function radioRow(name, kind){
  const form=document.getElementById('startForm');
  if(!form) return null;
  const input=form.querySelector(`[name="${name}"]:checked`);
  if(!input) return null;
  const label=cleanText(input.parentElement&&input.parentElement.textContent);
  const code=String(input.value||'');
  return {kind, code, name:BACKGROUND_NAMES[code] || (!hasLatin(label)?label:'背景')}; 
}
function selectedBackgroundRows(){
  return [
    radioRow('origin','出身地'),
    radioRow('trait','性格'),
    radioRow('attributePlan','屬性點配置'),
    radioRow('specialOrigin','特殊身世')
  ].filter(Boolean);
}
function rankSummary(rows){
  const counts={};
  return rows.map(r=>{
    counts[r.code]=(counts[r.code]||0)+1;
    const rank=RANKS[Math.max(0,Math.min(4,counts[r.code]-1))];
    return `${r.name}${rank}`;
  }).join('、') || '未選';
}
function skillsFor(code, kind){
  const arr=(kind==='身分'?ROLE_SKILLS[code]:BG_SKILLS[code]) || ['observe','speech','listen','will'];
  return arr.slice(0,4).map(k=>[k,1]);
}
function talentFor(code, name){
  const t=TALENT_BY_CODE[code];
  if(t) return t;
  return [`${name}見聞`];
}
function skillText(pairs){
  return pairs.map(([k,v])=>`${SKILL_NAMES[k]||k} ${v}`).join('、');
}
function buildRows(){
  const rows=[];
  for(const r of selectedRoleRows()){
    const skills=skillsFor(r.code,'身分');
    rows.push({kind:'身分', code:r.code, name:r.name, skills, talents:talentFor(r.code,r.name)});
  }
  for(const b of selectedBackgroundRows()){
    const skills=skillsFor(b.code,b.kind);
    rows.push({kind:b.kind, code:b.code, name:b.name, skills, talents:talentFor(b.code,b.name)});
  }
  return rows;
}
function replaceKnownCodes(text){
  let out=String(text??'');
  const entries=Object.entries(ALL_NAMES).sort((a,b)=>b[0].length-a[0].length);
  for(const [code,name] of entries){
    out=out.replace(new RegExp(`(^|[^A-Za-z_])${code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?=戊|丁|丙|乙|甲|\\s|:|：|、|，|/|$|[^A-Za-z_])`,'g'), `$1${name}`);
  }
  out=out.replace(/地方人士|未定身分|未定項目/g, selectedRoleRows()[0]?.name || '身分');
  return out;
}
function patchIdentityLine(box){
  const summary=rankSummary(selectedRoleRows());
  const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  let done=false;
  for(const n of nodes){
    const text=String(n.nodeValue||'');
    if(/^\s*身分\s*[：:]/.test(text)){
      n.nodeValue=`身分：${summary}`;
      done=true;
    } else {
      const next=replaceKnownCodes(text);
      if(next!==text) n.nodeValue=next;
    }
  }
  if(!done){
    const p=document.createElement('p');
    p.textContent=`身分：${summary}`;
    const h=[...box.querySelectorAll('h3,h4')].find(x=>/角色預覽/.test(x.textContent||''));
    if(h&&h.nextSibling) h.parentNode.insertBefore(p,h.nextSibling);
    else box.prepend(p);
  }
}
function renderBalancedBlock(box){
  const old=box.querySelector('.character-balanced-effects-block');
  if(old) old.remove();
  const rows=buildRows();
  const section=document.createElement('section');
  section.className='character-balanced-effects-block preview-detail-block';
  section.innerHTML='<h4>身分與背景加成</h4>';
  for(const row of rows){
    const p=document.createElement('p');
    p.textContent=`${row.kind}「${row.name}」：${skillText(row.skills)}；特技：${row.talents.join('、')}`;
    section.appendChild(p);
  }
  const note=document.createElement('p');
  note.textContent='平衡規則：每一項身分、出身地、性格、屬性點配置、特殊身世皆提供 4 點技能值。';
  section.appendChild(note);
  box.appendChild(section);
}
function patchPreview(){
  if(rendering) return;
  const box=document.getElementById('buildPreview');
  if(!box) return;
  rendering=true;
  try{
    patchIdentityLine(box);
    renderBalancedBlock(box);
  } finally {
    rendering=false;
  }
}
function addSkill(target,k,v){target[k]=Math.min(5,(Number(target[k])||0)+Number(v||0));}
function applyState(st){
  if(!st) return st;
  const rows=buildRows();
  st.skills=st.skills||{};
  const talents=[];
  for(const r of rows){
    for(const [k,v] of r.skills) addSkill(st.skills,k,v);
    for(const t of r.talents) if(!talents.includes(t)) talents.push(t);
  }
  st.player=st.player||{};
  st.player.roleNames=selectedRoleRows().map(x=>x.name);
  st.player.characterBalancedBlocks=rows.map(r=>({kind:r.kind,code:r.code,name:r.name,skills:Object.fromEntries(r.skills),talents:r.talents}));
  st.player.specialTalents=Array.from(new Set([...(st.player.specialTalents||[]),...talents]));
  st.characterBalancedPreviewVersion=VERSION;
  window.DaGoRules?.recalcAttrs?.(st);
  return st;
}
const rawSet=localStorage.setItem.bind(localStorage);
if(!localStorage.__daGoBalancedPreviewV1150){
  Object.defineProperty(localStorage,'__daGoBalancedPreviewV1150',{value:1});
  localStorage.setItem=function(k,v){
    if(k===STORE7||k===STORE6){
      try{ v=JSON.stringify(applyState(JSON.parse(v))); }catch{}
    }
    return rawSet(k,v);
  };
}
function boot(){
  const form=document.getElementById('startForm');
  if(form&&!form.dataset.balancedPreviewV1150){
    form.dataset.balancedPreviewV1150=VERSION;
    form.addEventListener('change',()=>setTimeout(patchPreview,0),true);
    form.addEventListener('input',()=>setTimeout(patchPreview,0),true);
    form.addEventListener('click',()=>setTimeout(patchPreview,0),true);
  }
  const box=document.getElementById('buildPreview');
  if(box){
    const ob=new MutationObserver(()=>setTimeout(patchPreview,0));
    ob.observe(box,{childList:true,subtree:true,characterData:true});
  }
  [0,60,180,420,900].forEach(t=>setTimeout(patchPreview,t));
  document.body.classList.add('dago-balanced-character-preview-ready');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
window.DaGoBalancedCharacterPreview=Object.freeze({version:VERSION,patchPreview,buildRows,selectedRoleRows,selectedBackgroundRows});
})();
