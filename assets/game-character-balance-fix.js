(()=>{
'use strict';
const STORE='daGoPlayV6';
const R=['','戊','丁','丙','乙','甲'];
const ROLE={
wenxuan:['文選','mind'],literatus:['文人','mind'],copyist:['抄書人','mind'],tutor:['塾師','mind'],poet:['詩客','mind'],
house:['門閥子弟','mind'],house_scion:['門閥子弟','mind'],court_official:['京官','mind'],local_official:['地方官','mind'],technical_official:['技官','tech'],
yamen:['胥吏','tech'],yamen_clerk:['書吏','tech'],runner:['差役','tech'],constable:['捕役','body'],soldier:['兵戶','body'],guard:['衛士','body'],
urban_household:['坊郭戶','tech'],workshop:['作坊戶','tech'],teahouse:['茶棚幫閒','tech'],market_broker:['市牙人','tech'],
rural_farmer:['農戶','body'],hunter:['獵戶','body'],fisher:['漁戶','body'],village_elder:['里正家人','mind'],
strongman:['壯士','body'],escort:['鏢師','body'],dock_labor:['埠頭力夫','body'],militia:['團練','body'],wanderer:['遊俠','body'],
gambler:['賭徒','tech'],vagrant:['浪人','body'],broker:['掮客','tech'],merchant:['行商','mind'],medic:['坊郭醫','tech'],artist:['伎伶俳優','tech'],disciple:['門派弟子','body']
};
const EXACT={
wenxuan:{3:'足以支撐朝堂的中堅',5:'才學冠絕古今往來的國士'},literatus:{3:'足以支撐朝堂的中堅',5:'才學冠絕古今往來的國士'},
wanderer:{4:'遊歷四方百郡的豪傑'},escort:{4:'道上名聲響亮的鏢頭'},disciple:{3:'直系弟子'}
};
const PAT={
body:['初入此道的{name}','已有根基的{name}','能獨當一面的{name}','聲名遠播的{name}','足以壓陣一方的{name}'],
tech:['初通門道的{name}','手法穩當的{name}','能獨立辦事的{name}','行內聞名的{name}','技藝精深的{name}'],
mind:['初具名聲的{name}','已有根基的{name}','足以支撐局面的{name}','聲名遠播的{name}','才識卓絕的{name}']
};
const SPECIAL={taihu_wei:'太湖魏家旁支',jinling_yang:'金陵陽家旁支',shangqiu_gongsun:'商丘公孫家遠支',cangbei_bei:'滄北北家舊識',qishan_ye:'內門弟子',kunlun_chu:'直系弟子',dongting_wudu:'策師',jiuqu_huayin:'內門耳目',donglai_xuanhai:'玄海舊脈門人',jiannan_yuezong:'道上名聲響亮的鏢頭',nanjiang_xiaoyao:'逍遙門下行走',wanminhui:'暗語相通之人'};
const ATTR={inner:'body',outer:'body',light:'body',swim:'body',climb:'body',pierce:'body',slash:'body',strike:'body',sense:'body',sleight:'tech',craft:'tech',appraise:'tech',medicine:'tech',pharma:'tech',ride:'tech',hide:'tech',observe:'tech',listen:'tech',smell:'tech',office:'tech',animal:'tech',threat:'tech',art:'tech',elegance:'tech',appearance:'mind',resource:'mind',wealth:'mind',court:'mind',jianghu:'mind',geo:'mind',nature:'mind',history:'mind',religion:'mind',study:'mind',will:'mind',language:'mind',social:'mind',empathy:'mind',speech:'mind'};
const BONUS={guard:{slash:1,pierce:1},soldier:{slash:1,pierce:1},constable:{strike:1,slash:1},strongman:{strike:2},escort:{slash:2,pierce:1},wanderer:{slash:1,light:1},disciple:{strike:1,slash:1},hunter:{pierce:1},militia:{slash:1,pierce:1},dock_labor:{strike:1,outer:1},vagrant:{strike:1}};
function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
function phrase(code,n){n=clamp(n,1,5);if(EXACT[code]&&EXACT[code][n])return EXACT[code][n];const r=ROLE[code]||[code,'mind'];return PAT[r[1]][n-1].replace('{name}',r[0])}
function makeTable(){const out={};Object.keys(ROLE).forEach(k=>{out[k]={name:ROLE[k][0]};for(let i=1;i<=5;i++)out[k][R[i]]=phrase(k,i)});return out}
window.DaGoRoleRankPhraseTable=makeTable();
function attrMod(s){s=Number(s)||0;if(s<=0)return-2;if(s===1)return-1;if(s<=3)return 0;if(s<=5)return 1;if(s<=8)return 2;if(s<=11)return 3;if(s<=15)return 4;if(s<=19)return 5;return 6}
function add(st,k,v){st.skills=st.skills||{};st.skills[k]=clamp((Number(st.skills[k])||0)+v,-3,5)}
function fix(st){if(!st||typeof st!=='object')return st;(st.player?.roles||[]).forEach(r=>Object.entries(BONUS[r]||{}).forEach(([k,v])=>add(st,k,v)));Object.keys(st.skills||{}).forEach(k=>st.skills[k]=clamp(st.skills[k],-3,5));const sums={body:0,tech:0,mind:0};Object.entries(st.skills||{}).forEach(([k,v])=>sums[ATTR[k]||'mind']+=Number(v)||0);st.attrSums=sums;st.attrs={body:attrMod(sums.body),tech:attrMod(sums.tech),mind:attrMod(sums.mind)};return st}
function count(a){const c={};a.forEach(x=>c[x]=(c[x]||0)+1);return c}
function preview(){const box=document.getElementById('buildPreview');if(!box)return;const roles=[...document.querySelectorAll('#startForm [name="roles"]')].map(x=>x.value);const rows=Object.entries(count(roles)).map(([k,n])=>`<li><b>${ROLE[k]?.[0]||k}(${R[clamp(n,1,5)]})</b>：${phrase(k,n)}</li>`);const sp=document.querySelector('#startForm [name="specialOrigin"]:checked')?.value;if(SPECIAL[sp])rows.push(`<li><b>${document.querySelector('#startForm [name="specialOrigin"]:checked').parentElement.textContent.trim()}</b>：${SPECIAL[sp]}</li>`);box.innerHTML='<h3>身分品級參照</h3><ul>'+rows.join('')+'</ul>'}
function install(){const f=document.getElementById('startForm');if(!f||f.dataset.balanceFix==='2')return false;f.dataset.balanceFix='2';f.addEventListener('change',preview,true);f.addEventListener('submit',()=>setTimeout(()=>{try{localStorage.setItem(STORE,JSON.stringify(fix(JSON.parse(localStorage.getItem(STORE)||'{}'))))}catch{}},20),true);preview();return true}
const old=localStorage.setItem.bind(localStorage);if(!localStorage.__balanceFix2){Object.defineProperty(localStorage,'__balanceFix2',{value:1});localStorage.setItem=function(k,v){if(k===STORE){try{v=JSON.stringify(fix(JSON.parse(v)))}catch{}}return old(k,v)}}
let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>60)clearInterval(timer)},250);install();
})();
