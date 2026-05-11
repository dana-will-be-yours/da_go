(()=>{
'use strict';
const VERSION='1.16.1-preserve-settings-dol-grammar';
window.DaGoRuntimeManifest=Object.freeze({
  runtime_name:'da_go_dol_like_runtime',
  runtime_version:VERSION,
  active_engine:'assets/dago-dol-like-runtime.js',
  canonical_runtime:'assets/dago-dol-like-runtime.js',
  grammar:'DoL-like Twee/SugarCube subset',
  mode:'preserve-settings-dol-grammar'
});
try{
  if(new URLSearchParams(location.search).has('reset')){
    localStorage.removeItem('daGoDolLikeSaveV1161');
  }
}catch{}
function add(src){
  return new Promise(resolve=>{
    if(document.querySelector('script[src^="'+src+'"]')) return resolve();
    const script=document.createElement('script');
    script.src=src+'?v='+encodeURIComponent(VERSION);
    script.dataset.loadedBy='game-runtime';
    script.onload=resolve;
    script.onerror=resolve;
    document.body.appendChild(script);
  });
}
add('assets/dago-dol-like-runtime.js').then(()=>{
  document.body.classList.add('dago-ready','dago-dol-like-ready','dago-preserve-settings-ready');
});
})();
