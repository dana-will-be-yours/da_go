const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const version = '1.13.2-direct-split';
function patchVersion(text) {
  return text
    .replaceAll('1.12.1-perf', version)
    .replaceAll('1.12.4-combat', version)
    .replaceAll('1.12.5-restored-ui', version)
    .replaceAll('1.12.6-full-ui', version)
    .replaceAll('1.12.7-panel-check', version)
    .replaceAll('1.12.8-panel-enhance', version)
    .replaceAll('1.12.9-modular-panels', version)
    .replaceAll('1.12.10-card-ui', version)
    .replaceAll('1.12.11-bg-cards', version)
    .replaceAll('1.12.12-events-time', version)
    .replaceAll('1.12.13-deckbuilder', version)
    .replaceAll('1.13.0-ui-core', version)
    .replaceAll('1.13.1-engine-split', version);
}
function writeLeanRuntime() {
  const p = path.join(root, 'assets/game-modular.js');
  const src = [
    "(()=>{",
    "'use strict';",
    "const $=id=>document.getElementById(id);let bundle=null,state=null,choices=[];",
    "const esc=s=>String(s??'').replace(/[&<>\\\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\\"':'&quot;',\"'\":'&#39;'}[c]));",
    "function ch(){const fd=new FormData($('startForm'));return {name:String(fd.get('playerName')||'旅人'),roles:fd.getAll('roles'),origin:fd.get('origin'),trait:fd.get('trait'),skills:{observe:1,speech:1,outer:1,study:1,slash:1}}}",
    "function show(){if(state.combat&&state.combat.active){$('passageTitle').textContent='夢中衝突';$('passageMeta').textContent='牌組戰鬥';$('passageText').innerHTML=DaGoCombat.html(state);$('choiceList').innerHTML='<button type=\\\"button\\\" data-end-turn=\\\"1\\\">收束一息</button>'}else{const p=DaGoPassage.byId(bundle,state.current_passage);$('passageTitle').textContent=p.title||p.id;$('passageMeta').textContent=p.location||'';$('passageText').innerHTML='<p>'+esc(DaGoPassage.textOf(p))+'</p>';choices=DaGoPassage.choicesOf(p,state);$('choiceList').innerHTML=choices.map((c,i)=>'<button type=\\\"button\\\" data-choice=\\\"'+i+'\\\">'+esc(c.text||c.choice_text||'選項')+'</button>').join('')}DaGoSidebar.render(state)}",
    "function start(){state=DaGoState.initialState(bundle,ch());DaGoRules.recalcAttrs(state);DaGoDeck.ensure(state);DaGoDeck.rebuild(state);DaGoCombat.start(state,{returnPassage:state.current_passage});DaGoSave.save(state);$('startPanel').hidden=true;$('playPanel').hidden=false;show()}",
    "function bind(){$('startForm').addEventListener('submit',e=>{e.preventDefault();start()});$('choiceList').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();if(b.dataset.choice!=null){DaGoPassage.applyChoice(state,bundle,choices[Number(b.dataset.choice)]);DaGoEvents.run(bundle,state)}else if(b.dataset.endTurn){DaGoCombat.enemyTurn(state)}DaGoSave.save(state);show()});document.addEventListener('click',e=>{const b=e.target.closest('[data-combat-card]');if(!b)return;e.preventDefault();DaGoCombat.play(state,Number(b.dataset.combatCard));if(state.combat&&state.combat.active)DaGoCombat.enemyTurn(state);DaGoSave.save(state);show()});document.querySelectorAll('[data-action=\\\"panel\\\"]').forEach(x=>x.addEventListener('click',()=>{if(!state)return;$('overlayTitle').textContent=x.textContent;$('overlayContent').innerHTML=DaGoSidebar.panel(x.dataset.panel,state);$('overlayBackdrop').classList.remove('hidden')}));$('closeOverlay')?.addEventListener('click',()=>$('overlayBackdrop').classList.add('hidden'))}",
    "async function boot(){if(new URLSearchParams(location.search).has('reset'))DaGoSave.clear();bundle=DaGoState.normalizeBundle(await DaGoRuntimeBundlePromise);bind();const old=DaGoSave.load();if(old){state=old;$('startPanel').hidden=true;$('playPanel').hidden=false;show()}document.body.classList.add('dago-direct-split-lean-ready')}",
    "window.DaGoModularRuntime=Object.freeze({version:'1.13.2-direct-split',boot});boot();",
    "})();"
  ].join('\n');
  fs.writeFileSync(p, src, 'utf8');
}
let htmlPath = path.join(root, 'game.html');
fs.writeFileSync(htmlPath, patchVersion(fs.readFileSync(htmlPath, 'utf8')), 'utf8');
let rtPath = path.join(root, 'assets/game-runtime.js');
fs.writeFileSync(rtPath, patchVersion(fs.readFileSync(rtPath, 'utf8')), 'utf8');
writeLeanRuntime();
require('./v113_time.js')(root);
require('./patch-deckbuilder-v114.js')(root);
require('./patch-character-v113.js')(root);
console.log('patched static runtime for ' + version);
