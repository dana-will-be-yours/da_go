(()=>{
'use strict';
const ROLE_GROUPS={
  '官員':[['court_official','京官'],['local_official','地方官'],['technical_official','技官']],
  '兵吏衙差':[['yamen_clerk','書吏'],['runner','差役'],['constable','捕役'],['soldier','兵戶']],
  '坊郭戶':[['urban_household','坊郭戶'],['workshop','作坊戶'],['teahouse','茶棚幫閒'],['market_broker','市牙人']],
  '鄉村戶':[['rural_farmer','農戶'],['hunter','獵戶'],['fisher','漁戶'],['village_elder','里正家人']],
  '文人':[['literatus','士子'],['copyist','抄書人'],['tutor','塾師'],['poet','詩客']],
  '壯士':[['strongman','壯士'],['escort','鏢客'],['dock_labor','埠頭力夫'],['militia','團練']],
  '遊手':[['wanderer','遊手'],['gambler','賭徒'],['vagrant','浪人'],['broker','掮客']],
  '其他身分':[['house_scion','門閥子弟'],['merchant','行商'],['medic','坊郭醫'],['artist','伎伶俳優'],['disciple','門派弟子']]
};
window.ROLE_GROUPS=ROLE_GROUPS;
const sectOnly=new Set(['qishan_ye','dongting_wudu','kunlun_chu','jiuqu_huayin','donglai_xuanhai','jiannan_yuezong','nanjiang_xiaoyao','wanminhui']);
const roleValues=new Set(Object.values(ROLE_GROUPS).flat().map(([value])=>value));
function roleOptions(selected){return Object.entries(ROLE_GROUPS).map(([group,rows])=>`<optgroup label="${group}">${rows.map(([value,text])=>`<option value="${value}" ${value===selected?'selected':''}>${text}</option>`).join('')}</optgroup>`).join('')}
function patchRoles(){
  const grid=document.querySelector('.role-stack-grid');
  if(!grid||grid.dataset.v6RolePatched)return false;
  grid.dataset.v6RolePatched='1';
  const defaults=['yamen_clerk','wanderer','merchant','medic','soldier'];
  const current=[...grid.querySelectorAll('[name="roles"]')].map((x,i)=>roleValues.has(x.value)?x.value:defaults[i]).slice(0,5);
  while(current.length<5)current.push(defaults[current.length]);
  grid.innerHTML=current.map((value,i)=>`<label>身分 ${i+1}<select name="roles">${roleOptions(value)}</select></label>`).join('');
  return true;
}
function patchRenown(){
  const trait=document.querySelector('[name="trait"]')?.closest('.field-group');
  if(trait&&!document.querySelector('[name="renownPath"]')){
    trait.insertAdjacentHTML('afterend','<div class="field-group"><span>初始名聲</span><label><input type="radio" name="renownPath" value="zheng" checked> 正</label><label><input type="radio" name="renownPath" value="xie"> 邪</label><label><input type="radio" name="renownPath" value="qi"> 奇</label><input type="hidden" name="renownLevel" value="1"></div>');
  }
  const renown=document.querySelector('[name="renownLevel"]');
  if(renown)renown.value='1';
}
function patchSectRule(){
  const form=document.getElementById('startForm');
  if(!form||form.dataset.v6sect)return;
  form.dataset.v6sect='1';
  const update=()=>{
    const roles=[...form.querySelectorAll('[name="roles"]')].map(x=>x.value);
    const hasDisciple=roles.includes('disciple');
    form.querySelectorAll('[name="specialOrigin"]').forEach(input=>{
      if(!sectOnly.has(input.value))return;
      input.disabled=!hasDisciple;
      if(!hasDisciple&&input.checked)form.querySelector('[name="specialOrigin"][value="none"]').checked=true;
    });
  };
  form.addEventListener('change',event=>{if(event.target?.name==='roles'||event.target?.name==='specialOrigin')update()},true);
  update();
}
function patch(){patchRoles();patchRenown();patchSectRule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
setTimeout(patch,250);
})();
