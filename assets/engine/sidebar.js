(()=>{
'use strict';
const VERSION='1.13.1-sidebar';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function kv(k,v){return '<p><strong>'+esc(k)+'</strong> '+esc(v)+'</p>'}
function stats(s){return ['hp','hpMax','spirit','composure','suspicion','fatigue','hunger','coin','day','hour','turn'].filter(k=>s&&k in s).map(k=>k+': '+s[k]).join('｜')}
function list(x){return Array.isArray(x)&&x.length?x.join('、'):'無'}
function rels(r){const keys=Object.keys(r||{});return keys.length?keys.map(k=>{const row=r[k]||{};return (row.name||k)+' '+Object.entries(row).filter(([x])=>x!=='name').map(([a,b])=>a+':'+b).join('/')}).join('、'):'無'}
function html(st){return '<section class="full-status-sidebar"><h3>完整狀態</h3>'+kv('角色',st?.player?.name||'旅人')+kv('狀態',stats(st?.stats||{}))+kv('調整值',Object.entries(st?.attrs||{}).map(([k,v])=>k+' '+(v>=0?'+':'')+v).join('｜'))+kv('技能值',Object.entries(st?.skills||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join('、'))+kv('持有物',list(st?.inventory||[]))+kv('人物關係',rels(st?.relationships||{}))+kv('目前場景',st?.current_passage||'未開始')+'</section>'}
function render(st){const box=document.getElementById('overviewBox');if(box)box.innerHTML=html(st||window.DaGoCurrentState||{})}
function panel(name,st){if(!st)return '<p>尚未開始遊戲。</p>';if(name==='stats')return html(st);if(name==='social')return kv('人物關係',rels(st.relationships||{}));if(name==='traits')return kv('角色',st.player?.name||'旅人')+kv('身分',(st.player?.roles||[]).join('、')||'未設定')+kv('出身',st.player?.origin||'未設定');if(name==='journal')return (st.journal||[]).slice(-30).map(x=>'<p>'+esc(x.text||x)+'</p>').join('')||'<p>尚無日誌。</p>';return html(st)}
window.DaGoSidebar=Object.freeze({version:VERSION,html,render,panel});
})();
