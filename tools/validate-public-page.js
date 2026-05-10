const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'game.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'assets/game-runtime.js'), 'utf8');
const rules = fs.readFileSync(path.join(root, 'assets/game-rules-ui-fix.js'), 'utf8');
for (const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`missing #${id}`);
}
if (!html.includes('assets/game-runtime.js?v=1.12.10-card-ui')) throw new Error('wrong public runtime version');
for (const s of ['scenario-select.js','game-bundle-loader.js','engine/state.js','engine/rules.js','engine/checks.js','engine/effects.js','engine/passage.js','engine/save.js','engine/export-playlog.js','game-v6-hotfix.js','character-create-ui.js','game-rules-ui-fix.js','game-character-balance-fix.js','game-modular.js']) {
  if (!runtime.includes(s)) throw new Error(`runtime missing ${s}`);
}
for (const f of ['assets/scenario-select.js','assets/game-bundle-loader.js','assets/engine/state.js','assets/engine/rules.js','assets/engine/checks.js','assets/engine/effects.js','assets/engine/passage.js','assets/engine/save.js','assets/engine/export-playlog.js','assets/game-v6-hotfix.js','assets/character-create-ui.js','assets/game-rules-ui-fix.js','assets/game-character-balance-fix.js','assets/game-modular.js']) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) throw new Error(`missing ${f}`);
  new Function(fs.readFileSync(p, 'utf8'));
}
for (const token of ['preview-detail-block','full-status-sidebar','renderFullSidebar','addPreviewDetail']) {
  if (!rules.includes(token)) throw new Error(`rules ui missing ${token}`);
}
for (const token of ['COMBAT_CARDS','drawPile','hand','discardPile','exhaustPile','endCombatTurn']) {
  if (!fs.readFileSync(path.join(root, 'assets/game-modular.js'), 'utf8').includes(token)) throw new Error(`combat runtime missing ${token}`);
}
console.log('Full UI public page validation passed.');
