(()=>{
'use strict';
const VERSION='1.13.0-ui-core';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function kv(label,value){return '<p><strong>'+esc(label)+'</strong> '+esc(value)+'</p>'}
function statsText(s){if(!s)return '';return ['hp','hpMax','spirit','composure','suspicion','fatigue','hunger','coin','day','hour','turn'].filter(k=>k in s).map(k=>k+': '+s[k]).join('｜')}
function skillText(skills){return Object.entries(skills||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join('、')}
function attrText(st){return Object.entries(st?.attrs||{}).map(([k,v])=>k+' '+(v>=0?'+':'')+v).join('｜')}
function characterPreviewHtml(character, skills, attrs){return '<section class="preview-detail-block"><h4>調整值</h4>'+kv('屬性',attrText({attrs:attrs||{}}))+'<h4>技能值</h4>'+kv('技能',skillText(skills||character?.skills||{}))+'</section>'}
function sidebarHtml(st){return '<section class="full-status-sidebar"><h3>完整狀態</h3>'+kv('角色',st?.player?.name||'旅人')+kv('主要狀態',statsText(st?.stats||{}))+kv('調整值',attrText(st))+kv('技能值',skillText(st?.skills||{}))+kv('持有物',(st?.inventory||[]).join('、')||'無')+kv('人物關係',Object.keys(st?.relationships||{}).join('、')||'無')+kv('目前場景',st?.current_passage||'未開始')+'</section>'}
function patchPreview(){const box=document.getElementById('buildPreview');if(!box||box.querySelector('.preview-detail-block'))return;box.insertAdjacentHTML('beforeend',characterPreviewHtml({}, {observe:1,speech:1,outer:1,study:1}, {body:0,tech:0,mind:0}))}
function renderSidebar(st){const box=document.getElementById('overviewBox');if(box)box.innerHTML=sidebarHtml(st||window.DaGoCurrentState||{})}
window.DaGoUiCore=Object.freeze({version:VERSION,characterPreviewHtml,sidebarHtml,patchPreview,renderSidebar});
})();
