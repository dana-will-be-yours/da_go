const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function must(text, token, label) { if (!text.includes(token)) throw new Error(`${label}: missing ${token}`); }

const html = read('game.html');
const runtime = read('assets/game-runtime.js');
const rules = read('assets/game-rules-ui-fix.js');
const modular = read('assets/game-modular.js');
const zh = read('assets/game-zh-tw-guard.js');
const simple = read('assets/game-simple-conflict-mode.js');
const bundle = JSON.parse(read('assets/data/dago-changshan-v1-bundle.json'));
const extension = JSON.parse(read('assets/data/dago-changshan-v1-extension.json'));

for (const id of ['startForm', 'buildPreview', 'randomizeCharacter', 'overviewBox', 'choiceList', 'playPanel']) must(html, `id="${id}"`, 'game.html');

must(runtime, "const VERSION='1.14.0-chinese-simple-combat';", 'runtime');
must(runtime, 'assets/game-zh-tw-guard.js', 'runtime Chinese guard');
must(runtime, 'assets/game-simple-conflict-mode.js', 'runtime simple conflict');

for (const token of ['window.DaGoZhTwGuard', 'TEXT_MAP', '體魄', '技巧', '心識']) must(zh, token, 'Chinese guard');
for (const token of ['window.DaGoSimpleConflictMode', 'simple-conflict-panel', '進擊', '防守', '交涉', '觀望']) must(simple, token, 'simple conflict');

for (const token of ['addPreviewDetail', 'preview-detail-block', '調整值', '技能值', 'renderFullSidebar', 'full-status-sidebar', '人物關係', '衝突']) must(rules, token, 'full ui');
for (const token of ['COMBAT_CARDS', 'deckBuilderHtml', 'ensureDeckBuild', 'ownedCards', 'deckCodes', 'combat_card', 'startCombat', 'renderCombat']) must(modular, token, 'full combat runtime preserved');

function merge(base, patch) {
  const map = new Map((base || []).map(x => [x.id || x.passage_code || x.npc_code || x.event_code, x]));
  for (const x of patch || []) map.set(x.id || x.passage_code || x.npc_code || x.event_code, x);
  return [...map.values()];
}
const passages = merge(bundle.passages, extension.passages);
const relationships = merge(bundle.relationships, extension.relationships);
const events = merge(bundle.event_pools, extension.event_pools);

if (!bundle.metadata || bundle.metadata.project_code !== 'DAGO') throw new Error('bundle metadata.project_code must be DAGO');
if (!Array.isArray(passages) || passages.length < 12) throw new Error('merged bundle needs at least 12 passages');
if (!Array.isArray(relationships) || relationships.length < 5) throw new Error('merged bundle needs at least 5 relationships');
if (!Array.isArray(events) || events.length < 4) throw new Error('merged bundle needs at least 4 event_pool entries');

console.log('Playable architecture validation passed for 1.14.0-chinese-simple-combat.');
