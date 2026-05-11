(()=>{
'use strict';
const VERSION='1.15.5-canonical-balance';
function buildRows(){return window.DaGoBalancedCharacterPreview&&typeof window.DaGoBalancedCharacterPreview.buildRows==='function'?window.DaGoBalancedCharacterPreview.buildRows():[];}
function normalizeState(st){if(!st)return st;const rows=buildRows();const skills={};for(const row of rows){for(const pair of row.skills||[]){const k=Array.isArray(pair)?pair[0]:pair;skills[k]=Math.min(5,(Number(skills[k])||0)+1);}}st.skills=skills;st.player=st.player||{};st.player.canonicalCharacterRows=rows.map(row=>({kind:row.kind,code:row.code,name:row.name,skillPointCount:(row.skills||[]).length,skills:Object.fromEntries((row.skills||[]).map(x=>Array.isArray(x)?x:[x,1])),talents:row.talents||[]}));st.characterCanonicalBalanceVersion=VERSION;window.DaGoRules?.recalcAttrs?.(st);return st;}
const rawSet=localStorage.setItem.bind(localStorage);
if(!localStorage.__daGoCanonicalBalanceV1155){Object.defineProperty(localStorage,'__daGoCanonicalBalanceV1155',{value:1});localStorage.setItem=function(k,v){if(k==='daGoPlayV7'||k==='daGoPlayV6'){try{v=JSON.stringify(normalizeState(JSON.parse(v)));}catch{}}return rawSet(k,v);};}
function audit(){const rows=buildRows();return {version:VERSION,rowCount:rows.length,allRowsHaveFourSkillPoints:rows.every(row=>(row.skills||[]).length===4),rows:rows.map(row=>({kind:row.kind,code:row.code,name:row.name,skillPointCount:(row.skills||[]).length}))};}
window.DaGoCanonicalBalanceFix=Object.freeze({version:VERSION,buildRows,normalizeState,audit});
})();
