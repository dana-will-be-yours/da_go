(()=>{
'use strict';
function num(v){return Number(v)||0}
function addJournal(st,text){if(text)st.journal.push({turn:st.stats.turn||0,text:String(text),at:new Date().toISOString()})}
function conditionOk(cond,st){
  if(!cond)return true;
  const op=cond.op||'has';const path=cond.path||'';const current=window.DaGoState.getPath(st,path);
  if(op==='has')return Array.isArray(current)?current.includes(cond.value):!!current;
  if(op==='not_has')return Array.isArray(current)?!current.includes(cond.value):!current;
  if(op==='gte')return num(current)>=num(cond.value);
  if(op==='lte')return num(current)<=num(cond.value);
  if(op==='eq')return current==cond.value;
  return true;
}
function visible(choice,st){return (choice.conditions||choice.visibility||[]).every(c=>conditionOk(c,st))}
function applyOne(st,effect){
  if(!effect)return st;
  const op=effect.op||'add';
  if(op==='add'){const path=effect.path||'stats.spirit';window.DaGoState.setPath(st,path,num(window.DaGoState.getPath(st,path))+num(effect.value));}
  else if(op==='set'){window.DaGoState.setPath(st,effect.path,effect.value);}
  else if(op==='gain'){if(effect.value&&!st.inventory.includes(effect.value))st.inventory.push(effect.value);addJournal(st,'取得：'+effect.value);}
  else if(op==='flag'){st.flags[effect.key||effect.value]=true;}
  else if(op==='log'){addJournal(st,effect.value||effect.text);}
  else if(op==='meet_npc'){const code=effect.npc_code||effect.value;if(code){st.relationships[code]=st.relationships[code]||{name:code};st.relationships[code].met=true;}}
  else if(op==='relationship'){const code=effect.npc_code;const key=effect.key||'trust';if(code){st.relationships[code]=st.relationships[code]||{name:code};st.relationships[code][key]=num(st.relationships[code][key])+num(effect.value);}}
  return st;
}
function normalizeStats(st){const s=st.stats||{};['spirit','composure','suspicion','fatigue','hunger'].forEach(k=>s[k]=window.DaGoState.clamp(s[k],0,100));s.coin=window.DaGoState.clamp(s.coin,-99,999);s.hp=window.DaGoState.clamp(s.hp,0,s.hpMax||30);return st}
function applyAll(st,effects){(effects||[]).forEach(e=>applyOne(st,e));normalizeStats(st);return st}
window.DaGoEffects=Object.freeze({conditionOk,visible,applyOne,applyAll,normalizeStats,addJournal});
})();
