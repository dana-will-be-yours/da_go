(()=>{
'use strict';
const VERSION='1.11.0-changshan-year';
window.DaGoRuntimeManifest=Object.freeze({
  runtime_name:'da_go_unified_runtime',
  runtime_version:VERSION,
  active_engine:'assets/game-playable-v6.js',
  canonical_runtime:'assets/game-playable-v6.js',
  cache_gate:false,
  role_rank_table:'assets/game-character-balance-fix.js',
  authoring_page:'https://dana-will-be-yours.github.io/trpg-corpus-sqlserver/web/dago-authoring.html'
});
const scripts=[
  'assets/game-v6-hotfix.js',
  'assets/game-playable-v6.js',
  'assets/preload-sidebar-density-fix.js',
  'assets/scenario-select.js',
  'assets/game-rules-ui-fix.js',
  'assets/game-character-balance-fix.js'
];
try{if(new URLSearchParams(location.search).has('reset'))localStorage.removeItem('daGoPlayV6')}catch{}
function alreadyLoaded(src){return !!document.querySelector(`script[src^="${src.replace(/"/g,'\\"')}"]`)}
function add(src){return new Promise(resolve=>{if(alreadyLoaded(src))return resolve();const s=document.createElement('script');s.src=src+'?v='+encodeURIComponent(VERSION);s.dataset.loadedBy='game-runtime';s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)})}
(async()=>{for(const src of scripts)await add(src);document.body.classList.add('dago-ready')})();
})();
