(()=>{
'use strict';
const CN={body:'體魄',tech:'技巧',mind:'智識',name:'姓名',trust:'信任',spirit:'精神',composure:'鎮定',suspicion:'疑心',fatigue:'疲勞',hunger:'飢餓',coin:'錢',hp:'氣血',hpMax:'氣血上限',turn:'行動',day:'日期',hour:'時段'};
const H={morning:'晨',noon:'午',dusk:'暮',night:'夜'};
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n}
function rowsFrom(root){return [...root.querySelectorAll('dt')].map(dt=>[dt.textContent.trim(),dt.nextElementSibling?dt.nextElementSibling.textContent.trim():''])}
function addCard(parent,title,rows,note){const c=el('article','dago-detail-card');c.appendChild(el('h3','',title));if(note)c.appendChild(el('p','detail-note',note));const dl=el('dl','sidebar-kv');rows.forEach(r=>{dl.appendChild(el('dt','',CN[r[0]]||r[0]));dl.appendChild(el('dd','',r[1]))});c.appendChild(dl);parent.appendChild(c)}
function currentTime(rows){const m=Object.fromEntries(rows);return '大興十年｜第 '+(m.day||'1')+' 日｜'+(H[m.hour]||m.hour||'晨')+'｜第 '+(m.turn||'0')+' 行動'}
function enhance(){const out=document.getElementById('overlayContent'), title=document.getElementById('overlayTitle');if(!out||!title||!out.textContent.trim())return;const panel=title.textContent.trim();if(out.dataset.enhancedTitle===panel)return;const old=out.cloneNode(true);const rows=rowsFrom(old);const wrap=el('section','dago-panel-detail');if(panel.includes('屬性')){addCard(wrap,'屬性調整值',rows,'這裡顯示三項核心調整值，用於 4D3 檢定。');addCard(wrap,'技能判定說明',[['body','體魄技能影響斬擊、刺擊、打擊、外功、輕功'],['tech','技巧技能影響觀察、醫術、政務、躲藏'],['mind','智識技能影響口才、學藝、財富、江湖']]);}
else if(panel.includes('社交')){const arts=[...old.querySelectorAll('article')];if(arts.length){arts.forEach(a=>addCard(wrap,a.querySelector('h3')?.textContent||'人物',rowsFrom(a),'人物關係以信任、怒氣、標籤與事件紀錄追蹤。'))}else addCard(wrap,'人物關係',[['狀態','尚無人物關係']]);}
else if(panel.includes('統計')){addCard(wrap,'劇情時間',[['time',currentTime(rows)]],'時間是劇情推進、事件池與資料庫回寫的重要欄位。');addCard(wrap,'完整狀態',rows,'這裡保留所有核心狀態，不輸出裸資料表。');}
else if(panel.includes('地圖')){addCard(wrap,'地圖與場景',rows.length?rows:[['目前場景',document.getElementById('passageTitle')?.textContent||'未定'],['場景資訊',document.getElementById('passageMeta')?.textContent||'未標示']],'地圖面板用於追蹤當前 passage、劇情時間與行動紀錄。');}
else if(panel.includes('選項')||panel.includes('存檔')){addCard(wrap,'存檔與資料來源',rows,'此處顯示 runtime bundle、存檔格式與語料匯出狀態。');}
else if(panel.includes('特質')){[...old.querySelectorAll('p')].forEach(p=>wrap.appendChild(p.cloneNode(true)));addCard(wrap,'角色能力說明',[['身分','身分會推導技能與調整值'],['出身','出身連結世界觀與地點資料'],['性格','性格影響敘事標籤與判定傾向']]);}
else if(panel.includes('日誌')){addCard(wrap,'劇情時間',[['time',document.getElementById('passageMeta')?.textContent||'大興十年']]);[...old.querySelectorAll('p')].forEach(p=>{const a=el('article','log-card');a.appendChild(p.cloneNode(true));wrap.appendChild(a)});}
else return;out.replaceChildren(wrap);out.dataset.enhancedTitle=panel;}
document.addEventListener('click',()=>setTimeout(enhance,30),true);
window.DaGoPanelEnhanceV127={enhance};
})();
