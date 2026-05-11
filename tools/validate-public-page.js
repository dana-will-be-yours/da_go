const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const expectedVersion = '1.13.2-direct-split';

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}
function must(text, token, label) {
  if (!text.includes(token)) throw new Error(`${label}: missing ${token}`);
}
function exists(file) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) throw new Error(`missing ${file}`);
  return p;
}

const html = read('game.html');
const runtime = read('assets/game-runtime.js');
const modular = read('assets/game-modular.js');
const hotfix = read('assets/game-v6-hotfix.js');
const rules = read('assets/game-rules-ui-fix.js');

for (const id of ['startForm', 'playPanel', 'choiceList', 'buildPreview', 'randomizeCharacter', 'overviewBox']) {
  must(html, `id="${id}"`, 'game.html');
}

must(runtime, `const VERSION='${expectedVersion}';`, 'game-runtime.js');
must(runtime, 'assets/engine-split-loader.js', 'game-runtime.js');

for (const s of [
  'scenario-select.js',
  'game-bundle-loader.js',
  'engine/state.js',
  'engine/rules.js',
  'engine/checks.js',
  'engine/effects.js',
  'engine/passage.js',
  'engine/events.js',
  'engine-split-loader.js',
  'engine/save.js',
  'engine/export-playlog.js',
  'ui-core.js',
  'game-v6-hotfix.js',
  'character-create-ui.js',
  'game-rules-ui-fix.js',
  'game-character-balance-fix.js',
  'game-modular.js'
]) {
  must(runtime, s, 'runtime loader');
}

for (const f of [
  'assets/scenario-select.js',
  'assets/game-bundle-loader.js',
  'assets/engine/state.js',
  'assets/engine/rules.js',
  'assets/engine/checks.js',
  'assets/engine/effects.js',
  'assets/engine/passage.js',
  'assets/engine/events.js',
  'assets/engine/deck.js',
  'assets/engine/combat.js',
  'assets/engine/sidebar.js',
  'assets/engine/save.js',
  'assets/engine/export-playlog.js',
  'assets/engine-split-loader.js',
  'assets/ui-core.js',
  'assets/game-v6-hotfix.js',
  'assets/character-create-ui.js',
  'assets/game-rules-ui-fix.js',
  'assets/game-character-balance-fix.js',
  'assets/game-modular.js'
]) {
  const p = exists(f);
  new Function(fs.readFileSync(p, 'utf8'));
}

const loader = read('assets/engine-split-loader.js');
for (const s of ['assets/engine/deck.js', 'assets/engine/combat.js', 'assets/engine/sidebar.js']) {
  must(loader, s, 'engine-split-loader.js');
}

for (const [file, token] of [
  ['assets/engine/deck.js', 'window.DaGoDeck'],
  ['assets/engine/combat.js', 'window.DaGoCombat'],
  ['assets/engine/sidebar.js', 'window.DaGoSidebar']
]) {
  must(read(file), token, file);
}

for (const token of ['formatStoryTime', 'monthName', 'xunName', '大興十年', 'settleAfterDream', 'nextPurpose']) {
  must(modular, token, 'time runtime');
}
for (const token of ['poolEventsFor', 'relationshipChoices', 'eventChoices', 'applyDailyEvent', 'event_hook']) {
  must(modular, token, 'event runtime');
}
for (const token of ['deckBuilderHtml', 'ensureDeckBuild', 'buildOwnedCards', 'deckCodesForCombat', 'ownedCards', 'deckCodes', '式囊編排']) {
  must(modular, token, 'full game modular runtime');
}
for (const token of ['DaGoOriginSpecialV113', '依五項身分開放大國世家', '將門之子']) {
  must(hotfix, token, 'hotfix');
}
for (const token of ['preview-detail-block', 'full-status-sidebar', 'renderFullSidebar', 'addPreviewDetail']) {
  must(rules, token, 'rules ui');
}

console.log('Public page validation passed for 1.13.2-direct-split.');
