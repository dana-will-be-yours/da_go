(()=>{
'use strict';
const VERSION='1.9.11-readable-slow-sidebars';
const CACHE_NAME='da_go_runtime_'+VERSION;
const ASSETS=[['assets/game-screen.css','介面樣式',1,''],['assets/game-v4.css','卡片與地圖樣式',1,''],['assets/game-v6-hotfix.js','角色建立修正',1,'ROLE_GROUPS'],['assets/game-playable-v6.js','南京篇規則引擎',1,'identity-rank-attr-formula'],['assets/data/dago-nanjing-v5-bundle.json','南京資料包',0,'json']];
const SCROLL_LINES=[
'風將住而雨將來……可這雨不知能沖刷走多少眼淚，抑會有多少眼淚留下。',
'那是恨不得從一塊銅錢裡再無中生有扳出另一塊的呢喃。',
'殤年過去，眾人無論是醒是夢、是清是醉，他等閉目回憶，當時城內一草一葉、一磚一瓦卻皆是一清二楚。',
'那鉛雲似比墨還濃還黑，正隨勁風如浪翻湧，猶如宣示明日將不復平靜。',
'你若未聽聞，便聽我來道。江河生來入海，幼鳥自當翱翔蒼穹。花滿月圓之際，明玉閃亮之時，獨枝終成碧海。',
'眨眼間彷彿回到那年黃土上，於猶如要融化大地的烈日光輝下，彼此踏出步伐遲緩卻堅定。',
'只是心神再一動，風再起漣、浪去留漪，憶景似池面波紋般迅速模糊，還未能發出惆悵嘆息之前就已隱去。',
'這不過是自欺欺人，或許騙得過有情聖上一時，卻騙不過無情現實。',
'該是時候放下，拳頭卻緊緊攥著不放。硬是將手掌打開，裡頭反倒空無一物。因為最為珍貴的事物不再留存於手，正是自己親手放開的。',
'來往浮年塵土間，過客空佇立。離群索居道今無以為家，心懷願景卻道此不為家。驀然回首，才終是醒悟，且看天下無處不是家。',
'問汝等所求，是何物期望？昂首望宮闕，可彤庭空蕩。問君是何意？只見玉門敞啟，金簾搖，銀鈴噹啷。',
'觀釦砌之下，萬書奏札懇求重歸過往。眼神迷茫，呢喃期盼著萬年永世流芳。且看山川疇隴，鄉邑間不解的目光。捫心自問，還欲背負那時的輝煌？',
'第一發帶著火焰的箭矢飛來，後方如赤色雨滴般的飛矢緊隨其後。',
'不睹明月繁星，但觀夜空烏雲湧動。那鉛雲似比墨還濃還黑，正隨勁風如浪翻湧，猶如宣示明日將不復平靜。',
'卸下那戎裝，黎民高舉起門閥的玉觴，不論國仇、不道家恨，只求傷亡能不枉。',
'說道兒女情長，那便是滾滾的滄浪，哪怕身死魂亡，也無法阻擋。',
'是這樣相同的明天可遠航，但有逝者在昨日永遠的駐足不前。'
];
window.DaGoRuntimeManifest=Object.freeze({runtime_name:'da_go_unified_runtime',runtime_version:VERSION,active_engine:'assets/game-playable-v6.js',preload_gate:'assets/game-preload-cache.js',target_database:'TRPG_Corpus_DB',export_format:'da_go_playlog_json_v2',staging_target:'stg.DaGo_PlayLog_Import -> stg.Utterance_Import',canonical_runtime:'assets/game-playable-v6.js',cache_name:CACHE_NAME,authoring_page:'https://dana-will-be-yours.github.io/trpg-corpus-sqlserver/web/dago-authoring.html'});
function esc(t){return String(t).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function shuffle(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function makeColumn(seed){return shuffle(seed).join('　　')}
function makeTrack(seed){let html='';for(let i=0;i<7;i++)html+='<span class="dago-vcol">'+esc(makeColumn(seed))+'</span>';return html}
const LEFT_LINES=shuffle(SCROLL_LINES);
let RIGHT_LINES=shuffle(SCROLL_LINES);
if(RIGHT_LINES.join('|')===LEFT_LINES.join('|')||RIGHT_LINES[0]===LEFT_LINES[0])RIGHT_LINES.push(RIGHT_LINES.shift());
const leftTrack=makeTrack(LEFT_LINES);
const rightTrack=makeTrack(RIGHT_LINES);
const css=document.createElement('style');
css.textContent=`#story,#ui-bar{visibility:hidden}body.dago-ready #story,body.dago-ready #ui-bar{visibility:visible}.dago-preload{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;overflow:hidden;isolation:isolate;background:radial-gradient(circle at 50% 35%,rgba(206,213,225,.16),transparent 38%),linear-gradient(135deg,#040506 0%,#0a111b 48%,#020303 100%);color:#eee;font-family:Verdana,Arial,'Microsoft JhengHei',sans-serif}.dago-preload:before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.62),transparent 26%,transparent 74%,rgba(0,0,0,.66)),linear-gradient(180deg,rgba(255,255,255,.035),rgba(0,0,0,.76))}.dago-preload-card{position:relative;z-index:3;width:min(42rem,92vw);border:1px solid rgba(154,174,204,.34);background:rgba(16,20,29,.9);padding:1.2rem;box-shadow:0 1.2rem 4rem rgba(0,0,0,.58);backdrop-filter:blur(3px)}.dago-preload h1{margin:0 0 .25rem;color:#ffd700;font-size:1.45rem}.dago-preload p{margin:.35rem 0;color:#bbb}.dago-preload-list{display:grid;gap:.35rem;margin:1rem 0}.dago-preload-row{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid #444;padding:.35rem 0}.dago-preload-row span{color:#bbb;text-align:right}.dago-preload-row.ok span{color:#8ee88e}.dago-preload-row.bad span{color:#ff8989}.dago-preload-row.warn span{color:#ffd700}.dago-preload-meter{height:.65rem;border:1px solid #555;background:#111;margin:.75rem 0}.dago-preload-meter i{display:block;height:100%;width:0;background:#68a0ff}.dago-preload-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem}.dago-preload button{font:inherit;background:#333;color:#eee;border:1px solid #666;padding:.45rem .8rem;cursor:pointer}.dago-preload button:disabled{opacity:.45}.dago-preload small{color:#888}.dago-preload-atmosphere{position:absolute;inset:0;z-index:1;pointer-events:none}.dago-vertical-log{position:absolute;top:0;width:min(24rem,21vw);height:100vh;overflow:hidden;box-sizing:border-box;border-left:1px solid rgba(216,226,240,.24);border-right:1px solid rgba(216,226,240,.2);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(0,0,0,.34)),rgba(2,5,10,.26);box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 0 2.2rem rgba(22,40,62,.22);mask-image:linear-gradient(to bottom,transparent 0%,black 9%,black 91%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,black 9%,black 91%,transparent 100%)}.dago-vertical-log.left{left:max(2.4vw,2.1rem)}.dago-vertical-log.right{right:max(2.4vw,2.1rem)}.dago-scroll-cycle{display:block;animation:dagoScrollDown 180s linear infinite;will-change:transform}.dago-vertical-log.right .dago-scroll-cycle{animation-duration:210s;animation-delay:-18s}.dago-vertical-track{display:flex;flex-direction:row-reverse;align-items:flex-start;justify-content:center;gap:1.05rem;padding:0 1.2rem;margin:0}.dago-vcol{display:block;writing-mode:vertical-rl;text-orientation:mixed;margin:0;color:rgba(236,240,247,.82);font-family:'DFKai-SB','標楷體','BiauKai','KaiTi','STKaiti','PMingLiU',serif;font-size:clamp(1.05rem,1.32vw,1.62rem);font-weight:400;line-height:1.62;letter-spacing:.16em;white-space:nowrap;text-shadow:0 0 .55rem rgba(198,216,238,.18)}.dago-vcol:nth-child(2n){color:rgba(218,226,238,.72)}.dago-vcol:nth-child(3n){font-size:clamp(.98rem,1.16vw,1.36rem);opacity:.78}.dago-vcol:nth-child(5n){opacity:.62}@keyframes dagoScrollDown{from{transform:translateY(-50%)}to{transform:translateY(0)}}@media(max-width:1160px){.dago-vertical-log{width:13.2rem}.dago-vcol{font-size:1rem}.dago-preload-card{width:min(40rem,72vw)}}@media(max-width:820px){.dago-preload-atmosphere{opacity:.42}.dago-vertical-log{width:7.8rem}.dago-vertical-log.left{left:.75rem}.dago-vertical-log.right{right:.75rem}.dago-preload-card{background:rgba(16,20,29,.95)}}@media(max-width:620px){.dago-vertical-log{display:none}.dago-preload-card{width:92vw}}@media(prefers-reduced-motion:reduce){.dago-scroll-cycle{animation:none;transform:translateY(-18%)}}`;
document.head.appendChild(css);
const box=document.createElement('section');
box.className='dago-preload';
box.innerHTML='<div class="dago-preload-atmosphere" aria-hidden="true"><div class="dago-vertical-log left"><div class="dago-scroll-cycle"><div class="dago-vertical-track">'+leftTrack+'</div><div class="dago-vertical-track">'+leftTrack+'</div></div></div><div class="dago-vertical-log right"><div class="dago-scroll-cycle"><div class="dago-vertical-track">'+rightTrack+'</div><div class="dago-vertical-track">'+rightTrack+'</div></div></div></div><div class="dago-preload-card"><h1>大國年代記</h1><p>正在預載入南京篇快取。必要檔案確認後即可進入遊戲。</p><div class="dago-preload-meter"><i id="dagoPreloadBar"></i></div><div id="dagoPreloadList" class="dago-preload-list"></div><p id="dagoPreloadMsg"><small>準備檢查資源。</small></p><div class="dago-preload-actions"><button id="dagoEnter" type="button" disabled>進入遊戲</button><button id="dagoRetry" type="button">重新讀取快取</button><button id="dagoBypass" type="button">略過快取直接進入</button></div></div>';
document.body.appendChild(box);
const list=document.getElementById('dagoPreloadList'),bar=document.getElementById('dagoPreloadBar'),msg=document.getElementById('dagoPreloadMsg'),enter=document.getElementById('dagoEnter'),retry=document.getElementById('dagoRetry'),bypass=document.getElementById('dagoBypass');
const rows={};
for(const a of ASSETS){const r=document.createElement('div');r.className='dago-preload-row';r.innerHTML='<b>'+a[1]+'</b><span>等待</span>';list.appendChild(r);rows[a[0]]=r}
function status(a,c,t){const r=rows[a[0]];if(!r)return;r.className='dago-preload-row '+c;r.querySelector('span').textContent=t}
async function cacheTry(url,res){if(!window.caches)return 'no-cache-api';try{const cache=await caches.open(CACHE_NAME);await cache.put(new Request(url),res.clone());return 'cached'}catch(e){return 'cache-skip:'+String(e.message||e)}}
async function one(a){status(a,'','讀取中');const url=a[0]+'?v='+encodeURIComponent(VERSION);const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);if(a[3]==='json'){await res.clone().json()}else{const txt=await res.clone().text();if(a[3]&&!txt.includes(a[3]))throw new Error('內容驗證失敗')}return await cacheTry(url,res)}
async function preload(){enter.disabled=true;retry.disabled=true;let done=0,fail=0,warn=0;bar.style.width='0%';msg.innerHTML='<small>檢查檔案並嘗試寫入瀏覽器快取。</small>';for(const a of ASSETS){try{const c=await one(a);if(c==='cached')status(a,'ok','已快取');else{status(a,'warn','可讀取，快取略過');warn++}}catch(e){status(a,a[2]?'bad':'warn','失敗：'+String(e.message||e));if(a[2])fail++;else warn++}done++;bar.style.width=Math.round(done/ASSETS.length*100)+'%'}retry.disabled=false;if(fail){msg.innerHTML='<small>必要檔案未通過檢查。可重新讀取；若 GitHub Pages 尚未同步，仍可略過快取直接嘗試進入。</small>';enter.disabled=true;return}msg.innerHTML=warn?'<small>必要檔案已確認，部分快取略過。可進入遊戲。</small>':'<small>快取檢查無誤。可進入遊戲。</small>';enter.disabled=false}
function load(src){return new Promise((ok,bad)=>{const s=document.createElement('script');s.src=src+'?v='+encodeURIComponent(VERSION);s.dataset.loadedBy='assets/game-preload-cache.js';s.onload=ok;s.onerror=()=>bad(new Error(src));document.body.appendChild(s)})}
async function start(){enter.disabled=true;retry.disabled=true;bypass.disabled=true;msg.innerHTML='<small>啟動遊戲主體。</small>';try{await load('assets/game-v6-hotfix.js');await load('assets/game-playable-v6.js');document.body.classList.add('dago-ready');box.remove()}catch(e){msg.innerHTML='<small>啟動失敗：'+String(e.message||e)+'</small>';retry.disabled=false;bypass.disabled=false}}
enter.onclick=start;bypass.onclick=start;retry.onclick=preload;setTimeout(preload,0);
})();
