(()=>{
'use strict';
const VERSION='1.15.4-stable-preview-runtime';
window.DaGoRuntimeManifest=Object.freeze({
  runtime_name:'da_go_modular_runtime',
  runtime_version:VERSION,
  active_engine:'assets/game-modular.js',
  canonical_runtime:'assets/game-modular.js',
  bundle_loader:'assets/game-bundle-loader.js',
  default_bundle:'assets/data/dago-changshan-v1-bundle.json',
  legacy_engine:'assets/game-playable-v6.js',
  authoring_page:'https://dana-will-be-yours.github.io/trpg-corpus-sqlserver/web/dago-authoring.html',
  mode:'stable-preview-runtime'
});
const scripts=[
  'assets/scenario-select.js',
  'assets/game-bundle-loader.js',
  'assets/engine/state.js',
  'assets/engine/rules.js',
  'assets/engine/checks.js',
  'assets/engine/effects.js',
  'assets/engine/passage.js',
  'assets/engine/events.js',
  'assets/engine-split-loader.js',
  'assets/engine/save.js',
  'assets/engine/export-playlog.js',
  'assets/ui-core.js',
  'assets/game-v6-hotfix.js',
  'assets/game-character-balance-fix.js',
  'assets/role-table-extensible-fix.js',
  'assets/character-create-ui.js',
  'assets/game-rules-ui-fix.js',
  'assets/game-modular.js',
  'assets/game-skill-label-zh.js',
  'assets/game-dol-select-combat.js',
  'assets/character-balanced-effects.js',
  'assets/character-canonical-balance-fix.js'
];
try{
  if(new URLSearchParams(location.search).has('reset')){
    localStorage.removeItem('daGoPlayV7');
    localStorage.removeItem('daGoPlayV6');
  }
}catch{}
function add(src){
  return new Promise(resolve=>{
    const s=document.createElement('script');
    s.src=src+'?v='+encodeURIComponent(VERSION);
    s.dataset.loadedBy='game-runtime';
    s.onload=resolve;
    s.onerror=resolve;
    document.body.appendChild(s);
  });
}
(async()=>{
  for(const src of scripts) await add(src);
  document.body.classList.add('dago-ready','dago-modular-ready','dago-full-ui-ready','dago-stable-preview-runtime-ready');
})();
})();
