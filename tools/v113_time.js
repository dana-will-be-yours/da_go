const fs = require('fs');
const path = require('path');
function replaceFn(src, name, repl) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error('missing function ' + name);
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') depth--;
    if (depth === 0) return src.slice(0, start) + repl + src.slice(i + 1);
  }
  throw new Error('unclosed function ' + name);
}
function insertBeforeFn(src, name, code, marker) {
  if (src.includes(marker)) return src;
  const pos = src.indexOf('function ' + name + '(');
  if (pos < 0) throw new Error('missing insertion point ' + name);
  return src.slice(0, pos) + code + '\n' + src.slice(pos);
}
module.exports = function applyTimePatch(root) {
  const file = path.join(root, 'assets', 'game-modular.js');
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('formatStoryTime')) {
    s = s.replace("const H={morning:'晨',noon:'午',dusk:'暮',night:'夜'};", "const H={morning:'卯時',noon:'午時',dusk:'酉時',night:'亥時'};\nfunction monthName(n){return ['正','二','三','四','五','六','七','八','九','十','十一','十二'][Math.max(0,Math.min(11,Number(n||1)-1))]||'正'}\nfunction xunName(d){d=Number(d)||1;return d<=10?'上旬':d<=20?'中旬':'下旬'}\nfunction formatStoryTime(stats={}){const day=Math.max(1,Number(stats.day||1));const idx=day-1;const m=Math.floor(idx/30)%12+1;const dd=idx%30+1;return `大興十年${monthName(m)}月${dd}日 ${xunName(dd)} ${H[stats.hour]||stats.hour||'卯時'}`}" );
  }
  s = replaceFn(s, 'clock', "function clock(){const st=state?.stats||{};return `${formatStoryTime(st)}｜第 ${esc(st.turn||0)} 行動`}");
  if (!s.includes('function settleAfterDream')) {
    const afterDream = "function homePassage(){return (bundle?.passages||[]).some(p=>(p.id||p.passage_code)==='Lodging')?'Lodging':((bundle?.passages||[]).find(p=>String(p.title||'').includes('租屋'))?.id||'Gate')}\nfunction nextPurpose(){const p=state.player||{};const r=new Set(p.roles||[]);let goal='先在橋北租屋整頓行囊，再到東門看今日有無穩當活計。';if(r.has('merchant')||r.has('broker')||r.has('shopkeeper'))goal='先到市集聽米價與貨路，再找能長久往來的人。';else if(r.has('yamen_clerk')||r.has('runner')||r.has('constable'))goal='先往縣衙門廊問差事，弄清常山縣的文書、人情與規矩。';else if(r.has('soldier')||r.has('border_soldier')||r.has('military_commander')||r.has('escort'))goal='先養足氣力，再尋一件能試身手也能餬口的差事。';else if(r.has('scholar')||r.has('tutor')||r.has('storyteller'))goal='先找抄錄、授讀或說書之事，順便記下縣中人事。';else if(r.has('medic'))goal='先問藥材與病患，替人看些小疾來站穩腳跟。';else if(r.has('disciple'))goal='先壓下夢中餘悸，辨明此地是否藏著門派線索。';if(p.trait==='calm')goal+=' 我不必急著出頭，先把路數看清。';if(p.trait==='reckless')goal+=' 但我也不能拖太久，今日就該出門試一試。';if(p.trait==='silver_tongue')goal+=' 多與人說話，或許比悶頭做事更快。';return goal}\nfunction settleAfterDream(resultText){const max=Number(state.stats?.hpMax||state.stats?.vbMax||10);state.stats.hp=max;state.stats.vb=max;state.current_passage=homePassage();state.journal=Array.isArray(state.journal)?state.journal:[];state.notes=Array.isArray(state.notes)?state.notes:[];const text=`夢醒時氣血已復，身在橋北租屋。${nextPurpose()}`;state.journal.push({text,at:new Date().toISOString()});state.notes.push(`夢中衝突${resultText}後，氣血恢復至全滿，地點回到自己家。${nextPurpose()}`)}";
    s = insertBeforeFn(s, 'finishCombat', afterDream, 'function settleAfterDream');
  }
  s = replaceFn(s, 'finishCombat', "function finishCombat(r){const c=state.combat;if(!c)return;const txt={win:'目標達成',escape:'脫出',loss:'敗退'}[r]||r;c.phase='finish';c.log.unshift(`衝突結束：${txt}。`);ensureCombatLogs();state.events.push({type:'combat_finish',encounter_code:c.encounter_code,result:r,round:c.round,at:new Date().toISOString()});state.history.push({type:'combat_finish',encounter_code:c.encounter_code,result:r,round:c.round,at:new Date().toISOString()});state.notes.push(`衝突 ${c.encounter_code}：${txt}，歷 ${c.round} 迴。`);state.journal.push({text:`衝突${txt}。`,at:new Date().toISOString()});countAction('combat_finish');if(c.encounter_code==='tutorial-dream-001')settleAfterDream(txt);else state.current_passage=(r==='win'?c.win_passage:r==='escape'?c.escape_passage:c.loss_passage)||c.returnPassage||state.current_passage;state.combat={active:false,phase:'finish',returnPassage:c.returnPassage,round:c.round,enemies:c.enemies,playerGuard:0,drawPile:c.drawPile,discardPile:c.discardPile,exhaustPile:c.exhaustPile,log:c.log,result:r,result_text:txt};state.stats.turn=Number(state.stats.turn||0)+1;window.DaGoSave.save(state);render()}");
  if (!s.includes('function eventChoices')) {
    const eventCode = "function poolEventsFor(p){const pools=Array.isArray(bundle?.event_pools)?bundle.event_pools:[];const loc=String(p?.location||p?.location_name||'');const pid=String(p?.id||p?.passage_code||state.current_passage||'');return pools.filter(e=>{const x=JSON.stringify(e);return x.includes(pid)||x.includes(loc)||(!e.location&&!e.location_code&&!e.passage_id)}).slice(0,2)}\nfunction relationshipChoices(){return Object.entries(state.relationships||{}).slice(0,2).map(([code,row])=>({text:`與${row.name||code}打聽近況`,event_hook:'relationship_event',npc_code:code,skill:'speech',dc:9}))}\nfunction eventChoices(p){const rows=poolEventsFor(p).map((e,i)=>({text:e.choice_text||e.title||e.event_name||`處理此地事件 ${i+1}`,event_hook:'daily_event',event:e,skill:e.skill||'observe',dc:e.dc||9}));if(rows.length===0)rows.push({text:'觀察此地人事與今日動靜',event_hook:'daily_event',skill:'observe',dc:9});return rows.concat(relationshipChoices()).slice(0,4)}\nfunction applyDailyEvent(c){ensureCombatLogs();const test=window.DaGoChecks.test({skill:c.skill||'observe',dc:c.dc||9},state);const ev=c.event||{};let text=ev.result_text||ev.summary||ev.description||'你留意此地人事，將今日可用的消息記在心裡。';if(c.event_hook==='relationship_event'){const rel=state.relationships[c.npc_code]||(state.relationships[c.npc_code]={name:c.npc_code,trust:0});rel.trust=Number(rel.trust||0)+(test.success?1:0);text=`你與${rel.name||c.npc_code}交換近況，${test.success?'關係稍有進展':'暫時沒有新的收穫'}。`}state.history.push({type:c.event_hook,skill:c.skill,dc:c.dc,success:test.success,total:test.total,at:new Date().toISOString()});state.events.push({type:c.event_hook,text,at:new Date().toISOString()});state.journal=Array.isArray(state.journal)?state.journal:[];state.journal.push({text,at:new Date().toISOString()});state.notes=Array.isArray(state.notes)?state.notes:[];state.notes.push(text);state.stats.turn=Number(state.stats.turn||0)+1;state.last_result={result:test.success?'成功':'失敗',check:test}}";
    s = insertBeforeFn(s, 'choiceHtml', eventCode, 'function eventChoices');
  }
  s = replaceFn(s, 'render', "function render(){if(state?.combat?.active)return renderCombat();const p=window.DaGoPassage.byId(bundle,state.current_passage);if(!p)return;window.DaGoPassage.enter(state,bundle,p.id||p.passage_code);$('passageTitle').textContent=p.title||p.id;$('passageMeta').textContent=`${clock()}｜${p.location||p.location_name||''}`;$('passageText').innerHTML='<p>'+esc(window.DaGoPassage.textOf(p)).replace(/\\n\\n/g,'</p><p>')+'</p>';const choices=window.DaGoPassage.choicesOf(p,state).concat(eventChoices(p));$('choiceList').innerHTML=choices.map(choiceHtml).join('');$('choiceList').querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>choose(choices[Number(btn.dataset.choice)])));$('passageFooter').textContent=state.last_result?.check?.used?`檢定：${esc(L[state.last_result.check.skill]||state.last_result.check.skill)} ${state.last_result.check.total}/${state.last_result.check.dc} ${state.last_result.result}`:'';renderOverview()}");
  s = replaceFn(s, 'choose', "function choose(c){if(c?.event_hook){applyDailyEvent(c);window.DaGoSave.save(state);return render()}if(c?.encounter_code||c?.enemy_json){startCombat(Object.assign({},c,{returnPassage:c.returnPassage||state.current_passage}));window.DaGoSave.save(state);return render()}window.DaGoPassage.applyChoice(state,bundle,c);window.DaGoSave.save(state);render()}");
  s = s.replaceAll('劇情耗時', '劇情時間');
  fs.writeFileSync(file, s, 'utf8');
};
