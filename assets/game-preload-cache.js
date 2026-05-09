(()=>{
'use strict';
const VERSION='1.9.2-preload-cache-safe';
const CACHE_NAME='da_go_runtime_'+VERSION;
const ASSETS=[
  ['assets/game-screen.css','介面樣式',1,''],
  ['assets/game-v4.css','卡片與地圖樣式',1,''],
  ['assets/game-v6-hotfix.js','角色建立修正',1,'ROLE_GROUPS'],
  ['assets/game-playable-v6.js','南京篇規則引擎',1,'identity-rank-attr-formula'],
  ['assets/data/dago-nanjing-v5-bundle.json','南京資料包',0,'json']
];
window.DaGoRuntimeManifest=Object.freeze({runtime_name:'da_go_unified_runtime',runtime_version:VERSION,active_engine:'assets/game-playable-v6.js',preload_gate:'assets/game-preload-cache.js',target_database:'TRPG_Corpus_DB',export_format:'da_go_playlog_json_v2',staging_target:'stg.DaGo_PlayLog_Import -> stg.Utterance_Import',canonical_runtime:'assets/game-playable-v6.js',cache_name:CACHE_NAME});
const css=document.createElement('style');
css.textContent="#story,#ui-bar{visibility:hidden}body.dago-ready #story,body.dago-ready #ui-bar{visibility:visible}.dago-preload{position:fixed;z-index:9999;inset:0;display:grid;place-items:center;background:#111;color:#eee;font-family:Verdana,Arial,'Microsoft JhengHei',sans-serif}.dago-preload-card{width:min(42rem,92vw);border:1px solid #555;background:#222;padding:1.2rem}.dago-preload h1{margin:0 0 .25rem;color:#ffd700;font-size:1.45rem}.dago-preload p{margin:.35rem 0;color:#bbb}.dago-preload-list{display:grid;gap:.35rem;margin:1rem 0}.dago-preload-row{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid #444;padding:.35rem 0}.dago-preload-row span{color:#bbb;text-align:right}.dago-preload-row.ok span{color:#8ee88e}.dago-preload-row.bad span{color:#ff8989}.dago-preload-row.warn span{color:#ffd700}.dago-preload-meter{height:.65rem;border:1px solid #555;background:#111;margin:.75rem 0}.dago-preload-meter i{display:block;height:100%;width:0;background:#68a0ff}.dago-preload-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem}.dago-preload button{font:inherit;background:#333;color:#eee;border:1px solid #666;padding:.45rem .8rem;cursor:pointer}.dago-preload button:disabled{opacity:.45}.dago-preload small{color:#888}";
document.head.appendChild(css);
const box=document.createElement('section');
box.className='dago-preload';
box.innerHTML='<div class="dago-preload-card"><h1>大國年代記</h1><p>正在預載入南京篇快取。必要檔案確認後即可進入遊戲。</p><div class="dago-preload-meter"><i id="dagoPreloadBar"></i></div><div id="dagoPreloadList" class="dago-preload-list"></div><p id="dagoPreloadMsg"><small>準備檢查資源。</small></p><div class="dago-preload-actions"><button id="dagoEnter" type="button" disabled>進入遊戲</button><button id="dagoRetry" type="button">重新讀取快取</button><button id="dagoBypass" type="button">略過快取直接進入</button></div></div>';
document.body.appendChild(box);
const list=document.getElementById('dagoPreloadList'),bar=document.getElementById('dagoPreloadBar'),msg=document.getElementById('dagoPreloadMsg'),enter=document.getElementById('dagoEnter'),retry=document.getElementById('dagoRetry'),bypass=document.getElementById('dagoBypass');
const rows={};
for(const a of ASSETS){const r=document.createElement('div');r.className='dago-preload-row';r.innerHTML='<b>'+a[1]+'</b><span>等待</span>';list.appendChild(r);rows[a[0]]=r}
function status(a,c,t){const r=rows[a[0]];if(!r)return;r.className='dago-preload-row '+c;r.querySelector('span').textContent=t}
async function cacheTry(url,res){if(!window.caches)return 'no-cache-api';try{const cache=await caches.open(CACHE_NAME);await cache.put(new Request(url),res.clone());return 'cached'}catch(e){return 'cache-skip:'+String(e.message||e)}}
async function one(a){status(a,'','讀取中');const url=a[0]+'?v='+encodeURIComponent(VERSION);const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status);if(a[3]==='json'){await res.clone().json()}else{const txt=await res.clone().text();if(a[3]&&!txt.includes(a[3]))throw new Error('內容驗證失敗')}const c=await cacheTry(url,res);return c}
async function preload(){enter.disabled=true;retry.disabled=true;let done=0,fail=0,warn=0;bar.style.width='0%';msg.innerHTML='<small>檢查檔案並嘗試寫入瀏覽器快取。</small>';for(const a of ASSETS){try{const c=await one(a);if(c==='cached')status(a,'ok','已快取');else{status(a,'warn','可讀取，快取略過');warn++}}catch(e){status(a,a[2]?'bad':'warn','失敗：'+String(e.message||e));if(a[2])fail++;else warn++}done++;bar.style.width=Math.round(done/ASSETS.length*100)+'%'}retry.disabled=false;if(fail){msg.innerHTML='<small>必要檔案未通過檢查。可重新讀取；若 GitHub Pages 尚未同步，仍可略過快取直接嘗試進入。</small>';enter.disabled=true;return}msg.innerHTML=warn?'<small>必要檔案已確認，部分快取略過。可進入遊戲。</small>':'<small>快取檢查無誤。可進入遊戲。</small>';enter.disabled=false}
function load(src){return new Promise((ok,bad)=>{const s=document.createElement('script');s.src=src+'?v='+encodeURIComponent(VERSION);s.dataset.loadedBy='assets/game-preload-cache.js';s.onload=ok;s.onerror=()=>bad(new Error(src));document.body.appendChild(s)})}
async function start(){enter.disabled=true;retry.disabled=true;bypass.disabled=true;msg.innerHTML='<small>啟動遊戲主體。</small>';try{await load('assets/game-v6-hotfix.js');await load('assets/game-playable-v6.js');document.body.classList.add('dago-ready');box.remove()}catch(e){msg.innerHTML='<small>啟動失敗：'+String(e.message||e)+'</small>';retry.disabled=false;bypass.disabled=false}}
enter.onclick=start;bypass.onclick=start;retry.onclick=preload;setTimeout(preload,0);
})();
