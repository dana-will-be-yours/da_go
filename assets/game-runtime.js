(()=>{
'use strict';
const VERSION='1.12.3-static-runtime';
window.DaGoRuntimeManifest=Object.freeze({
  runtime_name:'da_go_modular_runtime',
  runtime_version:VERSION,
  active_engine:'assets/game-modular.js',
  bundle_loader:'assets/game-bundle-loader.js',
  default_bundle:'assets/data/dago-changshan-v1-bundle.json',
  script_loading:'static-defer'
});
document.documentElement.dataset.dagoRuntimeBootstrap=VERSION;
})();
