(()=>{
'use strict';
const STORE='daGoPlayV6';
const ROLE={wenxuan:'文選',house:'門閥子弟',yamen:'胥吏',guard:'衛士',wanderer:'遊俠',merchant:'行商',medic:'坊郭醫',artist:'伎伶俳優',disciple:'門派弟子'};
const R=['','戊','丁','丙','乙','甲'];
const PH={
wenxuan:['初讀經史的文選','能入州府視野的文選','足以支撐朝堂的中堅','聲名滿郡的才俊','才學冠絕古今往來的國士'],
house:['門閥旁支子弟','家聲可用的門閥子弟','宗族中堅子弟','能代表家門交涉者','門第聲望所繫之人'],
yamen:['初識公文的胥吏','熟悉案牘的胥吏','公門文牘中堅','能轉圜府署的老吏','洞悉官場脈絡的案牘名手'],
guard:['初任守備的衛士','能護一門的衛士','能當一面的衛士','可統小隊的守衛頭目','城防倚重的宿衛人物'],
wanderer:['初走江湖的遊俠','小有名聲的遊俠','走過數郡的江湖人','遊歷四方百郡的豪傑','天下皆聞其名的俠士'],
merchant:['初行貨路的行商','有穩定貨路的行商','能掌一線商路的商旅','商會倚重的大商','貨通南北的巨賈'],
medic:['初習藥理的醫戶','能治常病的坊郭醫','診治一方的醫戶','名聲出城的良醫','活人無數的名醫'],
artist:['初登場面的伎伶','席間受賞的伎伶','技藝出眾的伎藝人','滿城聞名的名伎','一曲動京華的大家'],
disciple:['初入山門的門派弟子','得授真傳的門派弟子','直系弟子','可代表師門行走者','足以承繼門戶的人物']};
const SP={taihu_wei:'太湖魏家旁支',jinling_yang:'金陵陽家旁支',shangqiu_gongsun:'商丘公孫家遠支',cangbei_bei:'滄北北家舊識',qishan_ye:'內門弟子',kunlun_chu:'直系弟子',dongting_wudu:'策師',jiuqu_huayin:'內門耳目',donglai_xuanhai:'玄海舊脈門人',jiannan_yuezong:'道上名聲響亮的鏢頭',nanjiang_xiaoyao:'逍遙門下行走',wanminhui:'暗語相通之人'};
const ATTR={inner:'body',outer:'body',light:'body',swim:'body',climb:'body',pierce:'body',slash:'body',strike:'body',sense:'body',sleight:'tech',craft:'tech',appraise:'tech',medicine:'tech',pharma:'tech',ride:'tech',hide:'tech',observe:'tech',listen:'tech',smell:'tech',office:'tech',animal:'tech',threat:'tech',art:'tech',elegance:'tech',appearance:'mind',resource:'mind',wealth:'mind',court:'mind',jianghu:'mind',geo:'mind',nature:'mind',history:'mind',religion:'mind',study:'mind',will:'mind',language:'mind',social:'mind',empathy:'mind',speech:'mind'};
const BONUS={guard:{slash:1,pierce:1},wanderer:{slash:1,light:1},disciple:{strike:1,slash:1}};
function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
function attrMod(s){s=Number(s)||0;if(s<=0)return-2;if(s===1)return-1;if(s<=3)return 0;if(s<=5)return 1;if(s<=8)return 2;if(s<=11)return 3;if(s<=15)return 4;if(s<=19)return 5;return 6}
function add(st,k,v){st.skills=st.skills||{};st.skills[k]=clamp((Number(st.skills[k])||0)+v,-3,5)}
function fix(st){if(!st||typeof st!=='object')return st;(st.player?.roles||[]).forEach(r=>Object.entries(BONUS[r]||{}).forEach(([k,v])=>add(st,k,v)));Object.keys(st.skills||{}).forEach(k=>st.skills[k]=clamp(st.skills[k],-3,5));const sums={body:0,tech:0,mind:0};Object.entries(st.skills||{}).forEach(([k,v])=>sums[ATTR[k]||'mind']+=Number(v)||0);st.attrSums=sums;st.attrs={body:attrMod(sums.body),tech:attrMod(sums.tech),mind:attrMod(sums.mind)};return st}
function count(a){const c={};a.forEach(x=>c[x]=(c[x]||0)+1);return c}
function phrase(k,n){return (PH[k]&&PH[k][clamp(n,1,5)-1])||`${ROLE[k]||k}(${R[clamp(n,1,5)]})`}
function preview(){const box=document.getElementById('buildPreview');if(!box)return;const roles=[...document.querySelectorAll('#startForm [name="roles"]')].map(x=>x.value);const rows=Object.entries(count(roles)).map(([k,n])=>`<li><b>${ROLE[k]||k}(${R[clamp(n,1,5)]})</b>：${phrase(k,n)}</li>`);const sp=document.querySelector('#startForm [name="specialOrigin"]:checked')?.value;if(SP[sp])rows.push(`<li><b>${SP[sp]}</b>：${SP[sp]}</li>`);box.innerHTML='<h3>身分品級參照</h3><ul>'+rows.join('')+'</ul>'}
function install(){const f=document.getElementById('startForm');if(!f||f.dataset.balanceFix)return;f.dataset.balanceFix='1';f.addEventListener('change',preview,true);f.addEventListener('submit',()=>setTimeout(()=>{try{localStorage.setItem(STORE,JSON.stringify(fix(JSON.parse(localStorage.getItem(STORE)||'{}'))))}catch{}},20),true);preview()}
const old=localStorage.setItem.bind(localStorage);if(!localStorage.__balanceFix){Object.defineProperty(localStorage,'__balanceFix',{value:1});localStorage.setItem=function(k,v){if(k===STORE){try{v=JSON.stringify(fix(JSON.parse(v)))}catch{}}return old(k,v)}}
install();const timer=setInterval(()=>{if(document.getElementById('startForm'))install()},1000);setTimeout(()=>clearInterval(timer),15000);
})();
