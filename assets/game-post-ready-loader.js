(()=>{
'use strict';
const VERSION='1.10.5-stable-entry-cache';
window.DaGoPostReadyLoader={version:VERSION};
const SCRIPTS=[
  'assets/preload-sidebar-density-fix.js?v=1.9.14',
  'assets/scenario-select.js?v=1.10.2',
  'assets/game-rules-ui-fix.js?v=1.10.3',
  'assets/game-character-balance-fix.js?v=1.10.4'
];
function add(src){return new Promise(ok=>{if(document.querySelector('script[src="'+src.replace(/"/g,'\\"')+'"]'))return ok();const s=document.createElement('script');s.src=src;s.dataset.loadedBy='game-post-ready-loader';s.onload=ok;s.onerror=ok;document.body.appendChild(s)})}
function idle(fn){if('requestIdleCallback'in window)requestIdleCallback(fn,{timeout:1200});else setTimeout(fn,80)}
async function loadAll(){for(const src of SCRIPTS){await new Promise(r=>idle(r));await add(src)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadAll,{once:true});else loadAll();
})();
