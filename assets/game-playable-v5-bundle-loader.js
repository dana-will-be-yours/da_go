(()=>{
'use strict';
const BUNDLE_URL='assets/data/dago-nanjing-v5-bundle.json?v=1.8.1-bundle';
window.DaGoRuntimeBundleStatus={loaded:false,url:BUNDLE_URL,error:null};
fetch(BUNDLE_URL,{cache:'no-store'})
  .then(r=>{if(!r.ok)throw new Error('bundle http '+r.status);return r.json();})
  .then(j=>{window.DaGoRuntimeBundle=j;window.DaGoRuntimeBundleStatus={loaded:true,url:BUNDLE_URL,error:null};})
  .catch(e=>{window.DaGoRuntimeBundleStatus={loaded:false,url:BUNDLE_URL,error:String(e&&e.message||e)};})
  .finally(()=>{
    const s=document.createElement('script');
    s.src='assets/game-playable-v5.js?v=1.8.1-bundle';
    s.dataset.loadedBy='assets/game-playable-v5-bundle-loader.js';
    s.onload=()=>{
      document.dispatchEvent(new CustomEvent('dago:bundle-ready',{detail:window.DaGoRuntimeBundle||null}));
    };
    document.body.appendChild(s);
  });
})();
