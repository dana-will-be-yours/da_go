(()=>{
'use strict';
const VERSION='1.13.1-engine-split';
const files=['assets/engine/deck.js','assets/engine/combat.js','assets/engine/sidebar.js'];
function loaded(src){return !!document.querySelector('script[src^="'+src+'"]')}
function add(src){return new Promise(resolve=>{if(loaded(src))return resolve();const s=document.createElement('script');s.src=src+'?v='+VERSION;s.onload=resolve;s.onerror=resolve;document.body.appendChild(s)})}
(async()=>{for(const f of files)await add(f);document.body.classList.add('dago-engine-split-ready')})();
})();
