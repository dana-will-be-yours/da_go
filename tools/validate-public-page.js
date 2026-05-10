const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'game.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'assets/game-runtime.js'), 'utf8');

for (const id of ['startForm', 'playPanel', 'choiceList', 'buildPreview', 'randomizeCharacter']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`game.html missing #${id}`);
}

if (!html.includes('assets/game-runtime.js?v=1.12.5-restored-ui')) {
  throw new Error('game.html must load assets/game-runtime.js?v=1.12.5-restored-ui after Pages patch');
}

for (const script of [
  'assets/scenario-select.js',
  'assets/game-bundle-loader.js',
  'assets/engine/state.js',
  'assets/engine/rules.js',
  'assets/engine/checks.js',
  'assets/engine/effects.js',
  'assets/engine/passage.js',
  'assets/engine/save.js',
  'assets/engine/export-playlog.js',
  'assets/game-v6-hotfix.js',
  'assets/character-create-ui.js',
  'assets/game-modular.js'
]) {
  if (!runtime.includes(script)) throw new Error(`game-runtime.js does not load ${script}`);
}

for (const file of [
  'assets/scenario-select.js',
  'assets/game-bundle-loader.js',
  'assets/engine/state.js',
  'assets/engine/rules.js',
  'assets/engine/checks.js',
  'assets/engine/effects.js',
  'assets/engine/passage.js',
  'assets/engine/save.js',
  'assets/engine/export-playlog.js',
  'assets/game-v6-hotfix.js',
  'assets/character-create-ui.js',
  'assets/game-modular.js'
]) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`missing ${file}`);
  new Function(fs.readFileSync(full, 'utf8'));
}

for (const symbol of ['DaGoState', 'DaGoPassage', 'DaGoModularRuntime', 'DaGoCharacterCreateUi']) {
  const found = [
    'assets/engine/state.js',
    'assets/engine/passage.js',
    'assets/game-modular.js',
    'assets/character-create-ui.js'
  ].some(file => fs.readFileSync(path.join(root, file), 'utf8').includes(symbol));
  if (!found) throw new Error(`runtime symbol not referenced: ${symbol}`);
}

console.log('Restored public page validation passed.');
