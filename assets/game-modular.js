(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let bundle=null, state=null;
const COMBAT_ACTIONS=Object.freeze([
  {code:'slash',text:'斬擊',skill:'slash',dc:10,type:'attack',damage:[3,5],tags:['武器','行動']},
  {code:'pierce',text:'刺擊',skill:'pierce',dc:10,type:'attack',damage:[2,6],tags:['精準','行動']},
  {code:'strike',text:'鈍擊',skill:'strike',dc:10,type:'attack',damage:[2,4],anger:1,tags:['壓制','行動']},
  {code:'guard',text:'防守',skill:'outer',dc:8,type:'guard',guard:4,tags:['防禦']},
  {code:'dodge',text:'閃避',skill:'light',dc:10,type:'dodge',guard:3,tags:['機動']},
  {code:'threat',text:'威嚇',skill:'threat',dc:11,type:'threat',anger:2,trust:-1,tags:['交涉']},
  {code:'negotiate',text:'求和',skill:'speech',dc:11,type:'negotiate',trust:3,anger:-2,tags:['交涉']},
  {code:'item',text:'使用持有物',skill:'medicine',dc:8,type:'item',heal:2,tags:['道具']}
]);
const COMBAT_DEFAULT_ENEMY=Object.freeze({code:'dream-guard',name:'夢中持棍者',hp:18,hpMax:18,trust:0,anger:1,damage:3,tags:['tutorial','dream']});
function formCharacter(){const fd=new FormData($('startForm'));return {name:String(fd.get('playerName')||'旅人'),roles:fd.getAll('roles'),gender:fd.get('gender'),origin:fd.get('origin'),trait:fd.get('trait'),skills:{observe:1,speech:1,outer:1,study:1,slash:1,pierce:1,strike:1,light:1,threat:1,medicine:1}}}
function ensureStart(){const form=$('startForm');if(!form||form.dataset.modularBound)return;form.dataset.modularBound='1';form.addEventListener('submit',ev=>{ev.preventDefault();startGame(formCharacter())});}
function startGame(character){state=window.DaGoState.initialState(bundle,character);window.DaGoRules.recalcAttrs(state);startCombat({encounter_code:'tutorial-dream-001',returnPassage:state.current_passage,enemy_json:[COMBAT_DEFAULT_ENEMY],combat_tags:['tutorial','card-combat','research'],intro:'你已進入一個夢。霧像翻動的牌面一樣鋪開，一名持棍者擋在前方。這場教學戰鬥用行動卡呈現，每次選擇都會記錄到行動統計與 playlog。'});window.DaGoSave.save(state);$('startPanel').hidden=true;$('playPanel').hidden=false;render();}
function loadExisting(){const old=window.DaGoSave.load();if(old){state=old;window.DaGoRules.recalcAttrs(state);$('startPanel').hidden=true;$('playPanel').hidden=false;render();return true}return false}
function statLine(){const s=state.stats;return `精神 ${s.spirit}｜鎮定 ${s.composure}｜疑心 ${s.suspicion}｜疲勞 ${s.fatigue}｜飢餓 ${s.hunger}｜錢 ${s.coin}｜氣血 ${s.hp}/${s.hpMax}`}
function renderOverview(){const box=$('overviewBox');if(!box||!state)return;box.innerHTML=`<p>${esc(state.player?.name||'旅人')}</p><p>${esc(statLine())}</p><p>第 ${esc(state.stats.day)} 日 / ${esc(state.stats.hour)}</p><p>來源：${esc(bundle.__bundle_source||'unknown')}</p>${state.combat?.active?'<p>戰鬥中</p>':''}`}
function choiceHtml(c,i){const chance=(c.skill&&c.dc&&window.DaGoChecks)?window.DaGoChecks.chance(c.skill,c.dc,state):null;const meta=[];if(c.skill)meta.push(c.skill);if(c.dc)meta.push('DC '+c.dc);if(chance!==null)meta.push(chance+'%');return `<button type="button" data-choice="${i}"><span>${esc(c.text||c.choice_text||'選項')}</span>${meta.length?`<small>${esc(meta.join(' / '))}</small>`:''}</button>`}
function combatActionHtml(a){const chance=window.DaGoChecks?.chance(a.skill,a.dc,state);const tags=Array.isArray(a.tags)?a.tags.join('、'):'';return `<button type="button" class="combat-card" data-combat-action="${esc(a.code)}"><strong>${esc(a.text)}</strong><small>${esc(a.skill)} / DC ${esc(a.dc)}${chance!==null&&chance!==undefined?' / '+esc(chance)+'%':''}</small>${tags?`<small>${esc(tags)}</small>`:''}</button>`}
function startCombat(cfg={}){
  if(!state)return;
  const enemies=(Array.isArray(cfg.enemy_json)?cfg.enemy_json:[cfg.enemy_json||COMBAT_DEFAULT_ENEMY]).filter(Boolean).map((e,i)=>({
    code:String(e.code||e.enemy_code||('enemy-'+(i+1))),
    name:String(e.name||e.enemy_name||('敵人'+(i+1))),
    hp:Number(e.hp??e.max_hp??10),
    hpMax:Number(e.hpMax??e.max_hp??e.hp??10),
    trust:Number(e.trust??e.enemytrust??0),
    anger:Number(e.anger??e.enemyanger??0),
    damage:Number(e.damage??e.base_damage??2),
    tags:Array.isArray(e.tags)?e.tags:[]
  }));
  state.combat={
    active:true,
    encounter_code:cfg.encounter_code||'encounter-local',
    returnPassage:cfg.returnPassage||state.current_passage,
    win_passage:cfg.win_passage||cfg.winPassage||cfg.returnPassage||state.current_passage,
    escape_passage:cfg.escape_passage||cfg.escapePassage||cfg.returnPassage||state.current_passage,
    loss_passage:cfg.loss_passage||cfg.lossPassage||cfg.returnPassage||state.current_passage,
    combat_tags:Array.isArray(cfg.combat_tags)?cfg.combat_tags:[],
    round:1,
    enemies,
    playerGuard:0,
    log:[cfg.intro||'戰鬥開始。']
  };
  state.events=Array.isArray(state.events)?state.events:[];
  state.events.push({type:'combat_start',encounter_code:state.combat.encounter_code,at:new Date().toISOString(),tags:state.combat.combat_tags});
}
function liveEnemies(){return (state.combat?.enemies||[]).filter(e=>e.hp>0)}
function enemyStateText(e){const hpRate=e.hp/Math.max(1,e.hpMax);if(e.anger>=6)return '暴怒';if(e.trust>=5)return '可談';if(hpRate<=0.25)return '退縮';if(hpRate<=0.55)return '吃痛';return '氣勢正盛'}
function enemyPanelHtml(){return liveEnemies().map(e=>`<article class="combat-enemy"><h3>${esc(e.name)}</h3><p>氣血 ${esc(e.hp)}/${esc(e.hpMax)}｜信任 ${esc(e.trust)}｜怒氣 ${esc(e.anger)}｜${esc(enemyStateText(e))}</p></article>`).join('')||'<p>敵人已退場。</p>'}
function renderCombat(){
  const c=state.combat;
  $('passageTitle').textContent='夢中戰鬥';
  $('passageMeta').textContent=`${c.encounter_code}｜第 ${c.round} 回合`;
  $('passageText').innerHTML=`<p>你已進入一個夢。霧面像牌桌一樣展開，敵人的血量、怒氣與信任會改變回饋狀態。</p><p>你的護勢：${esc(c.playerGuard)}。玩家氣血：${esc(state.stats.hp)}/${esc(state.stats.hpMax)}。</p>${enemyPanelHtml()}<section class="combat-log"><h3>戰鬥紀錄</h3>${(c.log||[]).slice(0,8).map(x=>`<p>${esc(x)}</p>`).join('')}</section>`;
  $('choiceList').innerHTML=COMBAT_ACTIONS.map(combatActionHtml).join('');
  $('choiceList').querySelectorAll('[data-combat-action]').forEach(btn=>btn.addEventListener('click',()=>combatRound(btn.dataset.combatAction)));
  $('passageFooter').textContent='教學戰鬥：攻擊、防守、逃離與談判均使用 da_go 4d3 檢定。';
  renderOverview();
}
function combatRound(actionCode){
  const c=state.combat;if(!c?.active)return;
  const action=COMBAT_ACTIONS.find(a=>a.code===actionCode);if(!action)return;
  const enemy=liveEnemies()[0];
  const check=window.DaGoChecks.test({skill:action.skill,dc:action.dc},state);
  state.actionCounts=state.actionCounts||{};state.actionCounts[action.code]=(state.actionCounts[action.code]||0)+1;
  state.history=Array.isArray(state.history)?state.history:[];
  const entry={type:'combat_action',encounter_code:c.encounter_code,round:c.round,action_code:action.code,skill:action.skill,dc:action.dc,success:check.success,total:check.total,at:new Date().toISOString()};
  state.history.push(entry);
  c.log.unshift(`${action.text}檢定：${check.total}/${check.dc}，${check.success?'成功':'失敗'}。`);
  if(action.type==='attack'&&enemy){
    if(check.success){const [min,max]=action.damage;const dmg=min+Math.floor(Math.random()*(max-min+1));enemy.hp=Math.max(0,enemy.hp-dmg);enemy.anger+=Number(action.anger||0);c.log.unshift(`${enemy.name}受到 ${dmg} 點傷害，狀態為${enemyStateText(enemy)}。`);if(enemy.hp<=0)c.log.unshift(`${enemy.name}退場。`);}else{enemy.anger+=1;c.log.unshift(`${enemy.name}看穿了你的攻勢。`);}
  }
  if(action.type==='guard'){c.playerGuard=check.success?c.playerGuard+action.guard:c.playerGuard+1;c.log.unshift(check.success?`你穩住架勢，護勢增加 ${action.guard}。`:'你勉強抬手，護勢增加 1。');}
  if(action.type==='dodge'){c.playerGuard=check.success?c.playerGuard+action.guard:c.playerGuard;c.log.unshift(check.success?'你讓開敵人的進路。':'你沒有完全脫離攻擊線。');}
  if(action.type==='threat'&&enemy){enemy.anger+=check.success?Number(action.anger||0):1;enemy.trust+=check.success?Number(action.trust||0):-1;c.log.unshift(check.success?'你壓住對手氣勢，但敵意升高。':'威嚇失準，對方更加不信任你。');}
  if(action.type==='negotiate'&&enemy){enemy.trust+=check.success?Number(action.trust||0):0;enemy.anger+=check.success?Number(action.anger||0):1;c.log.unshift(check.success?'你讓對手遲疑，局面轉向可談。':'求和沒有立即奏效。');if(enemy.trust>=6){finishCombat('escape');return;}}
  if(action.type==='item'){if(check.success){state.stats.hp=Math.min(Number(state.stats.hpMax)||10,(Number(state.stats.hp)||0)+Number(action.heal||1));c.log.unshift('你用隨身物穩住氣血。');}else c.log.unshift('你沒能及時用上持有物。');}
  if(liveEnemies().length===0){finishCombat('win');return;}
  enemyTurn();
  if(Number(state.stats.hp)<=0){finishCombat('loss');return;}
  c.round+=1;c.playerGuard=0;window.DaGoSave.save(state);renderCombat();
}
function enemyTurn(){
  const c=state.combat;const enemies=liveEnemies();let total=0;
  for(const e of enemies){const mood=enemyStateText(e);let dmg=e.damage+(e.anger>=6?2:0);if(mood==='退縮'||mood==='可談')dmg=Math.max(1,dmg-1);total+=dmg;c.log.unshift(`${e.name}${mood==='暴怒'?'猛攻':'出手'}，威脅 ${dmg}。`)}
  const blocked=Math.min(c.playerGuard,total);const harm=Math.max(0,total-blocked);state.stats.hp=Math.max(0,(Number(state.stats.hp)||0)-harm);c.log.unshift(`你以護勢抵消 ${blocked}，承受 ${harm} 點傷害。`);
}
function advanceAfterCombat(){
  const order=['morning','noon','dusk','night'];const cur=String(state.stats.hour||'morning');const idx=order.indexOf(cur);state.stats.hour=order[(idx+1+order.length)%order.length];if(cur==='night')state.stats.day=Number(state.stats.day||1)+1;state.stats.turn=Number(state.stats.turn||0)+1;
}
function finishCombat(result){
  const c=state.combat;if(!c)return;
  const resultText={win:'勝利',escape:'脫離',loss:'戰敗'}[result]||result;
  c.log.unshift(`戰鬥結束：${resultText}。`);
  state.events=Array.isArray(state.events)?state.events:[];state.notes=Array.isArray(state.notes)?state.notes:[];state.journal=Array.isArray(state.journal)?state.journal:[];
  state.events.push({type:'combat_finish',encounter_code:c.encounter_code,result,round:c.round,at:new Date().toISOString()});
  state.notes.push(`戰鬥 ${c.encounter_code}：${resultText}，共 ${c.round} 回合。`);
  state.journal.push({text:`夢中戰鬥${resultText}。`,at:new Date().toISOString()});
  const next=result==='win'?c.win_passage:result==='escape'?c.escape_passage:c.loss_passage;
  state.current_passage=next||c.returnPassage||state.current_passage;
  state.combat={active:false,returnPassage:c.returnPassage,round:c.round,enemies:c.enemies,playerGuard:0,log:c.log,result};
  advanceAfterCombat();
  window.DaGoSave.save(state);render();
}
function render(){if(state?.combat?.active){renderCombat();return;}const p=window.DaGoPassage.byId(bundle,state.current_passage);if(!p)return;window.DaGoPassage.enter(state,bundle,p.id||p.passage_code);$('passageTitle').textContent=p.title||p.id;$('passageMeta').textContent=p.location||p.location_name||'';$('passageText').innerHTML='<p>'+esc(window.DaGoPassage.textOf(p)).replace(/\n\n/g,'</p><p>')+'</p>';const choices=window.DaGoPassage.choicesOf(p,state);$('choiceList').innerHTML=choices.map(choiceHtml).join('');$('choiceList').querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>choose(choices[Number(btn.dataset.choice)])));$('passageFooter').textContent=state.last_result?.check?.used?`檢定：${state.last_result.check.skill} ${state.last_result.check.total}/${state.last_result.check.dc} ${state.last_result.result}`:'';renderOverview();}
function choose(choice){if(choice?.encounter_code||choice?.enemy_json){startCombat(Object.assign({},choice,{returnPassage:choice.returnPassage||state.current_passage}));window.DaGoSave.save(state);render();return;}window.DaGoPassage.applyChoice(state,bundle,choice);window.DaGoSave.save(state);render();}
function table(obj){return '<dl class="sidebar-kv">'+Object.entries(obj||{}).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')+'</dl>'}
function panel(name){
  if(!state)return '<p>尚未開始遊戲。</p>';
  if(name==='saves')return `<button id="saveNow">保存</button> <button id="exportSave">下載存檔</button> <button id="restartGame">重開</button> <button id="exportLog">匯出語料 playlog</button>`;
  if(name==='journal')return (state.journal||[]).slice(-30).map(x=>`<p>${esc(x.text)}</p>`).join('')||'<p>尚無日誌。</p>';
  if(name==='stats')return table(state.stats);
  if(name==='social')return Object.entries(state.relationships||{}).map(([code,row])=>`<article><h3>${esc(row.name||code)}</h3>${table(row)}</article>`).join('')||'<p>尚無人物關係。</p>';
  if(name==='attributes')return table(state.attrs||{});
  if(name==='traits')return `<p>角色：${esc(state.player?.name||'旅人')}</p><p>身分：${esc((state.player?.roles||[]).join('、')||'未設定')}</p><p>出身：${esc(state.player?.origin||'未設定')}</p><p>性格：${esc(state.player?.trait||'未設定')}</p>`;
  if(name==='achievements')return `<p>目前場景：${esc(state.current_passage)}</p><p>已記錄行動：${esc((state.history||[]).length)}</p>${state.combat?.result?`<p>最近戰鬥：${esc(state.combat.result)}</p>`:''}`;
  if(name==='options')return `<p>存檔格式：${esc(state.schema_version)}</p><p>Bundle：${esc(state.bundle_source||bundle.__bundle_source||'unknown')}</p>`;
  return '<p>此面板尚未實作。</p>';
}
function bindPanels(){document.querySelectorAll('[data-action="panel"]').forEach(btn=>{if(btn.dataset.panelBound)return;btn.dataset.panelBound='1';btn.addEventListener('click',()=>{if(!state)return;const name=btn.dataset.panel;$('overlayTitle').textContent=btn.textContent;$('overlayContent').innerHTML=panel(name);$('overlayBackdrop').classList.remove('hidden');$('saveNow')?.addEventListener('click',()=>window.DaGoSave.save(state));$('exportSave')?.addEventListener('click',()=>window.DaGoSave.download(state));$('restartGame')?.addEventListener('click',()=>{window.DaGoSave.clear();location.search='?reset=1'});$('exportLog')?.addEventListener('click',()=>window.DaGoExportPlaylog.download(state));});});$('closeOverlay')?.addEventListener('click',()=>$('overlayBackdrop').classList.add('hidden'));}
async function boot(){bundle=window.DaGoState.normalizeBundle(await window.DaGoRuntimeBundlePromise);ensureStart();bindPanels();if(new URLSearchParams(location.search).has('reset'))window.DaGoSave.clear();loadExisting();}
window.DaGoModularRuntime=Object.freeze({boot,startCombat,renderCombat,combatRound,finishCombat});
boot();
})();
