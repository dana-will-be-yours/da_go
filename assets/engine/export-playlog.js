(()=>{
'use strict';
function pad(n){return String(n).padStart(5,'0')}
function build(st){
  const meta=st.bundle_metadata||{};
  const rows=(st.history||[]).map((item,index)=>({
    source_row_no:index+1,
    project_code:meta.project_code||'DAGO',
    team_code:meta.team_code||'DAGO-T01',
    session_code:meta.session_code||'DC10-XIAOCHENG-001',
    scene_code:item.passage||st.current_passage,
    turn_no_text:String(index+1),
    sub_turn_no_text:'0',
    utterance_code:'DAGO-'+pad(index+1),
    speaker_type:'PL',
    speaker_code:'PLAYER',
    speaker_label_raw:'玩家',
    utterance_function:item.utterance_function||'decision',
    is_in_character_text:'1',
    is_gm_narration_text:'0',
    is_rule_related_text:item.check&&item.check.used?'1':'0',
    is_decision_related_text:'1',
    is_knowledge_related_text:'0',
    utterance_text_raw:item.text||'',
    utterance_text_clean:item.text||'',
    utterance_text_verified:item.text||'',
    language_code:'zh-TW',
    ai_summary:item.result||'',
    ai_annotation_json:JSON.stringify(item),
    review_status:'raw',
    include_in_analysis_text:'1'
  }));
  return {metadata:{export_format:'da_go_playlog_json_v2',project_code:meta.project_code||'DAGO',team_code:meta.team_code||'DAGO-T01',session_code:meta.session_code||'DC10-XIAOCHENG-001',import_batch_code:'DAGO_'+new Date().toISOString().slice(0,10).replaceAll('-',''),exported_at:new Date().toISOString()},stg_Import_Batch:{source_file_name:'da_go_playlog.json'},stg_Utterance_Import:rows};
}
function download(st){const blob=new Blob([JSON.stringify(build(st),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='da_go_playlog.json';a.click();URL.revokeObjectURL(url)}
window.DaGoExportPlaylog=Object.freeze({build,download});
})();
