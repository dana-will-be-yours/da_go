(()=>{
'use strict';
const STORE='daGoPlayV6';
const ROLE={wenxuan:'文選',literatus:'文選',wanderer:'遊俠',escort:'鏢師',disciple:'門派弟子',soldier:'兵戶',constable:'捕役',strongman:'壯士',guard:'衛士',merchant:'行商',medic:'坊郭醫',yamen_clerk:'書吏'};
const R=['','戊','丁','丙','乙','甲'];
const PH={wenxuan:{3:'足以支撐朝堂的中堅',5:'才學冠絕古今往來的國士'},literatus:{3:'足以支撐朝堂的中堅',5:'才學冠絕古今往來的國士'},wanderer:{4:'遊歷四方百郡的豪傑'},escort:{4:'道上名聲響亮的鏢頭'},disciple:{3:'直系弟子'}};
const SP={dongting_wudu:'策師',kunlun_chu:'直系弟子',qishan_ye:'內門弟子',jiannan_yuezong:'道上名聲響亮的鏢頭'};
const ATTR={inner:'body',outer:'body',light:'body',swim:'body',climb:'body',pierce:'body',slash:'body',strike:'body',sense:'body',sleight:'tech',craft:'tech',appraise:'tech',medicine:'tech',pharma:'tech',ride:'tech',hide:'tech',observe:'tech',listen:'tech',smell:'tech',office:'tech',animal:'tech',threat:'tech',art:'tech',elegance:'tech',appearance:'mind',resource:'mind',wealth:'mind',court:'mind',jianghu:'mind',geo:'mind',nature:'mind',history:'mind',religion:'mind',study:'mind',will:'mind',language:'mind',social:'mind',empathy:'mind',speech:'mind'};
const BONUS={soldier:{slash:1,pierce:1},constable:{strike:1,slash:1},strongman:{strike:2},escort:{slash:2,pierce:1},disciple:{strike:1,slash:1},guard:{slash:1,pierce:1},wanderer:{slash:1}};
function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
function attrMod(s){s=Number(s)||0;if(s<=0)return-2;if(s===1)return-1;if(s<=3)return 0;if(s<=5)return 1;if(s<=8)return 2;if(s<=11)return 3;if(s<=15)return 4;if(s<=19)return 5;return 6}
function add(st,k,v){st.skills=st.skills||{};st.skills[k]=clamp((Number(st.skills[k])||0)+v,-3,5)}
function fix(st){if(!st||typeof st!=='object')return st;(st.player?.roles||[]).forEach(r=>{Object.entries(BONUS[r]||{}).forEach(([k,v])=>add(st,k,v))});Object.keys(st.skills||{}).forEach(k=>st.skills[k]=clamp(st.skills[k],-3,5));const sums={body:0,tech:0,mind:0};Object.entries(st.skills||{}).forEach(([k,v])=>sums[ATTR[k]||'mind']+=Number(v)||0);st.attrSums=sums;st.attrs={body:attrMod(sums.body),tech:attrMod(sums.tech),mind:attrMod(sums.mind)};return st}
function count(a){const c={};a.forEach(x=>c[x]=(c[x]||0)+1);return c}
function phrase(k,n){return (PH[k]&&PH[k][n])||(n>=5?`${ROLE[k]||k}中的頂尖人物`:n===4?`${ROLE[k]||k}中聲名遠播的能手`:n===3?`${ROLE[k]||k}中足以獨當一面的中堅`:n===2?`${ROLE[k]||k}中已有根基的熟手`:`${ROLE[k]||k}出身的初行者`)}
function preview(){const box=document.getElementById('buildPreview');if(!box)return;const roles=[...document.querySelectorAll('#startForm [name="roles"]')].map(x=>x.value);const rows=Object.entries(count(roles)).map(([k,n])=>`<li><b>${ROLE[k]||k}(${R[clamp(n,1,5)]})</b>：${phrase(k,n)}</li>`);const sp=document.querySelector('#startForm [name="specialOrigin"]:checked')?.value;if(SP[sp])rows.push(`<li><b>${document.querySelector('#startForm [name="specialOrigin"]:checked').parentElement.textContent.trim()}</b>：${SP[sp]}</li>`);box.innerHTML='<h3>身分品級參照</h3><ul>'+rows.join('')+'</ul>'}
function install(){const f=document.getElementById('startForm');if(!f||f.dataset.balanceFix)return;f.dataset.balanceFix='1';f.addEventListener('change',preview,true);f.addEventListener('submit',()=>setTimeout(()=>{try{localStorage.setItem(STORE,JSON.stringify(fix(JSON.parse(localStorage.getItem(STORE)||'{}'))))}catch{}},20),true);preview()}
const old=localStorage.setItem.bind(localStorage);if(!localStorage.__balanceFix){Object.defineProperty(localStorage,'__balanceFix',{value:1});localStorage.setItem=function(k,v){if(k===STORE){try{v=JSON.stringify(fix(JSON.parse(v)))}catch{}}return old(k,v)}}
install();const obs=new MutationObserver(install);obs.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>obs.disconnect(),20000);
})();
