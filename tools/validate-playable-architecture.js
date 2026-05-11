const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function must(text, token, label) {
  if (!text.includes(token)) throw new Error(`${label}: missing ${token}`);
}

const html = read('game.html');
const runtime = read('assets/game-runtime.js');
const rules = read('assets/game-rules-ui-fix.js');
const modular = read('assets/game-modular.js');
const loader = read('assets/engine-split-loader.js');
const bundle = JSON.parse(read('assets/data/dago-changshan-v1-bundle.json'));
const extension = JSON.parse(read('assets/data/dago-changshan-v1-extension.json'));

for (const id of ['startForm', 'buildPreview', 'randomizeCharacter', 'overviewBox', 'choiceList', 'playPanel']) {
  must(html, `id="${id}"`, 'game.html');
}

must(runtime, "const VERSION='1.13.2-direct-split';", 'runtime');
must(runtime, 'assets/engine-split-loader.js', 'runtime direct split loader');

for (const file of [
  'scenario-select.js',
  'character-create-ui.js',
  'game-rules-ui-fix.js',
  'game-character-balance-fix.js',
  'game-modular.js'
]) {
  must(runtime, file, 'runtime loader');
}

for (const file of ['assets/engine/deck.js', 'assets/engine/combat.js', 'assets/engine/sidebar.js']) {
  must(loader, file, 'engine split loader');
}
for (const [file, token] of [
  ['assets/engine/deck.js', 'window.DaGoDeck'],
  ['assets/engine/combat.js', 'window.DaGoCombat'],
  ['assets/engine/sidebar.js', 'window.DaGoSidebar']
]) {
  must(read(file), token, file);
}

for (const token of ['addPreviewDetail', 'preview-detail-block', '調整值', '技能值', 'renderFullSidebar', 'full-status-sidebar', '人物關係', '衝突']) {
  must(rules, token, 'full ui');
}

for (const token of ['COMBAT_CARDS', 'deckBuilderHtml', 'ensureDeckBuild', 'ownedCards', 'deckCodes', 'combat_card', 'startCombat', 'renderCombat']) {
  must(modular, token, 'full combat runtime');
}

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

console.log('Playable architecture validation passed for 1.13.2-direct-split.');
