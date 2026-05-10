(()=>{
'use strict';
function byId(bundle,id){return (bundle.passages||[]).find(p=>(p.id||p.passage_code)===id)||bundle.passages?.[0]}
function textOf(p){if(Array.isArray(p.text))return p.text.join('\n\n');return p.body||p.body_markdown||p.text||''}
function choicesOf(p,st){return (p?.choices||[]).filter(c=>window.DaGoEffects.visible(c,st))}
function enter(st,bundle,id){const p=byId(bundle,id);st.current_passage=p?.id||p?.passage_code||id;return p}
function applyChoice(st,bundle,choice){
  const check=window.DaGoChecks.test(choice.check||choice.skill_check_json,st);
  const ok=!check.used||check.success;
  const effects=ok?(choice.effects||[]):(choice.failure_effects||[]);
  window.DaGoEffects.applyAll(st,effects);
  const target=ok?(choice.target||choice.next_passage_code):(choice.failure_passage_code||choice.target||choice.next_passage_code);
  const entry={turn:st.stats.turn||0,passage:st.current_passage,choice_id:choice.id||choice.choice_code,text:choice.text||choice.choice_text,result:ok?'success':'failure',check,at:new Date().toISOString()};
  st.history.push(entry);st.last_result=entry;
  if(choice.savePoint||choice.save_point)st.save_point=target||st.current_passage;
  window.DaGoRules.afterAction(st);
  const collapse=window.DaGoRules.collapseCheck(st);
  if(collapse){window.DaGoEffects.addJournal(st,collapse.title);st.current_passage=collapse.target;st.last_result={turn:st.stats.turn,passage:st.current_passage,text:collapse.text,result:'collapse',at:new Date().toISOString()};}
  else if(target){st.current_passage=target;}
  return st;
}
window.DaGoPassage=Object.freeze({byId,textOf,choicesOf,enter,applyChoice});
})();
