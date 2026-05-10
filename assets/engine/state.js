(()=>{
'use strict';
const STORE='daGoPlayV7';
const DEFAULT_STATS={spirit:50,composure:50,suspicion:0,fatigue:0,hunger:0,coin:12,hp:10,hpMax:10,turn:0,day:1,hour:'morning'};
function clamp(n,min,max){n=Number(n)||0;if(Number.isFinite(min))n=Math.max(min,n);if(Number.isFinite(max))n=Math.min(max,n);return n}
function getPath(obj,path){return String(path||'').split('.').reduce((acc,key)=>acc&&acc[key],obj)}
function setPath(obj,path,value){const keys=String(path||'').split('.').filter(Boolean);let cur=obj;while(keys.length>1){const key=keys.shift();cur[key]=cur[key]&&typeof cur[key]==='object'?cur[key]:{};cur=cur[key]}if(keys.length)cur[keys[0]]=value;return obj}
function normalizeBundle(bundle){
  const b=bundle&&typeof bundle==='object'?bundle:{};
  if(!b.metadata){b.metadata={};}
  if(!Array.isArray(b.passages)&&Array.isArray(b.scenes))b.passages=b.scenes;
  if(!Array.isArray(b.passages))b.passages=[];
  if(!Array.isArray(b.states))b.states=[];
  if(!Array.isArray(b.relationships))b.relationships=[];
  if(!Array.isArray(b.event_pools))b.event_pools=[];
  b.passages=b.passages.map((p,i)=>Object.assign({id:p.passage_code||p.id||('P'+i),choices:[]},p));
  b.passages.forEach(p=>{p.id=p.id||p.passage_code;p.passage_code=p.passage_code||p.id;p.choices=Array.isArray(p.choices)?p.choices:[]});
  b.metadata.start_passage=b.metadata.start_passage||b.start_passage||b.passages.find(p=>p.is_start)?.id||b.passages[0]?.id||'Gate';
  return b;
}
function initialState(bundle,character){
  const b=normalizeBundle(bundle);
  const stats=Object.assign({},DEFAULT_STATS);
  for(const def of b.states){
    const key=String(def.key||'').replace(/^stats\./,'');
    if(def.group==='stats'||String(def.key||'').startsWith('stats.'))stats[key]=Number(def.default??def.default_value_text??stats[key]??0);
  }
  const st={schema_version:'da_go_save_v7',created_at:new Date().toISOString(),updated_at:new Date().toISOString(),bundle_metadata:b.metadata,bundle_source:b.__bundle_source||'unknown',current_passage:b.metadata.start_passage,save_point:b.metadata.start_passage,player:character||{},stats,skills:Object.assign({},character?.skills||{}),flags:{},inventory:[],relationships:{},journal:[],history:[],last_result:null};
  for(const rel of b.relationships){
    const code=rel.npc_code||rel.code;if(!code)continue;st.relationships[code]={name:rel.npc_name||rel.name||code};
    for(const m of (rel.metrics||[]))st.relationships[code][m.key]=Number(m.default||0);
  }
  return st;
}
function migrate(st){
  if(!st||typeof st!=='object')return null;
  st.schema_version='da_go_save_v7';
  st.stats=Object.assign({},DEFAULT_STATS,st.stats||{});
  st.flags=st.flags||{};st.inventory=Array.isArray(st.inventory)?st.inventory:[];st.relationships=st.relationships||{};st.journal=Array.isArray(st.journal)?st.journal:[];st.history=Array.isArray(st.history)?st.history:[];
  return st;
}
function load(){try{return migrate(JSON.parse(localStorage.getItem(STORE)||'null'))}catch{return null}}
function save(st){st.updated_at=new Date().toISOString();localStorage.setItem(STORE,JSON.stringify(st));return st}
function clear(){localStorage.removeItem(STORE)}
window.DaGoState=Object.freeze({STORE,DEFAULT_STATS,clamp,getPath,setPath,normalizeBundle,initialState,migrate,load,save,clear});
})();
