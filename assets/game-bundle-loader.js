(()=>{
'use strict';
const VERSION='1.12.0-modular-runtime';
const DEFAULT_URL='assets/data/dago-changshan-v1-bundle.json?v='+encodeURIComponent(VERSION);
const STORAGE_KEYS=['daGoRuntimeBundle','daGoImportedRuntimeBundle'];
function getParam(name){try{return new URLSearchParams(location.search).get(name)}catch{return null}}
async function fetchJson(url){const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('HTTP '+res.status+' '+url);return await res.json()}
function parseStored(raw){if(!raw)return null;const obj=JSON.parse(raw);return obj&&obj.bundle?obj.bundle:obj}
function fallbackBundle(){return {metadata:{runtime_name:'da_go_modular_runtime',runtime_version:VERSION,project_code:'DAGO',team_code:'DAGO-T01',session_code:'DC10-XIAOCHENG-001',scenario_code:'fallback_demo',title:'大國年代記',start_passage:'Gate'},states:[],passages:[{id:'Gate',title:'常山縣東門',location:'天津郡 / 常山縣東門',body:'大興十年，常山縣東門外還有薄霜。你在城門下停住，聽見客棧、市集、縣衙與河埠各有活計與消息。',is_start:true,choices:[{id:'wait',text:'在東門整理行囊',target:'Gate',utterance_function:'summary',effects:[{op:'add',path:'stats.spirit',value:1}]}]}],relationships:[],event_pools:[]}}
async function loadBundle(){
  const attempts=[];
  const url=getParam('bundle')||getParam('runtime_bundle');
  if(url)attempts.push({source:'url',load:()=>fetchJson(url)});
  for(const key of STORAGE_KEYS)attempts.push({source:'localStorage:'+key,load:()=>Promise.resolve(parseStored(localStorage.getItem(key)))});
  attempts.push({source:'default',load:()=>fetchJson(DEFAULT_URL)});
  for(const attempt of attempts){
    try{const bundle=await attempt.load();if(bundle&&typeof bundle==='object'){bundle.__bundle_source=attempt.source;return bundle;}}
    catch(error){console.warn('[da_go] bundle load failed',attempt.source,error);}
  }
  const bundle=fallbackBundle();bundle.__bundle_source='fallback';return bundle;
}
function saveImportedBundle(bundle){localStorage.setItem('daGoImportedRuntimeBundle',JSON.stringify(bundle));}
window.DaGoBundleLoader=Object.freeze({version:VERSION,loadBundle,saveImportedBundle,defaultUrl:DEFAULT_URL});
window.DaGoRuntimeBundlePromise=loadBundle();
})();
