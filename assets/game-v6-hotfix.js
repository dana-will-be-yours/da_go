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
'其他':[['house_scion','門閥子弟'],['merchant','行商'],['medic','坊郭醫'],['artist','伎伶俳優'],['disciple','門派弟子']]
};
const sect=new Set(['dongting_wudu','kunlun_chu','jiuqu_huayin','donglai_xuanhai','jiannan_yuezong','nanjiang_xiaoyao','wanminhui']);
function roleOptions(sel){let html='';for(const [g,arr] of Object.entries(ROLE_GROUPS)){html+=`<optgroup label="${g}">`+arr.map(([v,t])=>`<option value="${v}" ${v===sel?'selected':''}>${t}</option>`).join('')+'</optgroup>'}return html}
function patch(){
  const grid=document.querySelector('.role-stack-grid');
  if(grid&&!grid.dataset.v6RolePatched){
    grid.dataset.v6RolePatched='1';
    const defaults=['yamen_clerk','wanderer','merchant','medic','soldier'];
    const current=[...grid.querySelectorAll('[name="roles"]')].map((x,i)=>x.value||defaults[i]).slice(0,5);
    while(current.length<5)current.push(defaults[current.length]);
    grid.innerHTML=current.map((v,i)=>`<label>第${'一二三四五'[i]}身分<select name="roles">${roleOptions(v)}</select></label>`).join('');
  }
  const trait=document.querySelector('[name="trait"]')?.closest('.field-group');
  if(trait&&!document.querySelector('[name="renownPath"]')){
    trait.insertAdjacentHTML('afterend','<div class="field-group"><span>初始名聲</span><label><input type="radio" name="renownPath" value="zheng" checked> 正</label><label><input type="radio" name="renownPath" value="xie"> 邪</label><label><input type="radio" name="renownPath" value="qi"> 奇</label><label>經驗 <select name="renownLevel"><option value="1" selected>1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label></div>')
  }
  const clothes=document.querySelector('[name="clothes"]')?.closest('.field-group');
  if(clothes&&!clothes.dataset.v6){
    clothes.dataset.v6='1';
    clothes.insertAdjacentHTML('beforeend','<small class="field-help">初始衣物只記錄外觀，不提供技能加成。</small>')
  }
  const form=document.getElementById('startForm');
  if(form&&!form.dataset.v6sect){
    form.dataset.v6sect='1';
    const updateSect=()=>{
      const roles=[...form.querySelectorAll('[name="roles"]')].map(x=>x.value);
      const has=roles.includes('disciple');
      form.querySelectorAll('[name="specialOrigin"]').forEach(x=>{
        if(sect.has(x.value)){
          x.disabled=!has;
          if(!has&&x.checked)form.querySelector('[name="specialOrigin"][value="none"]').checked=true
        }
      })
    };
    form.addEventListener('change',updateSect,true);
    updateSect();
  }
}
patch();
const obs=new MutationObserver(()=>{
  patch();
  if(document.querySelector('.role-stack-grid')?.dataset.v6RolePatched&&document.getElementById('startForm')?.dataset.v6sect){
    obs.disconnect();
  }
});
obs.observe(document.documentElement,{childList:true,subtree:true});
})();
