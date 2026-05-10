const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'game.html'), 'utf8');
const requiredIds = ['startForm', 'playPanel', 'choiceList'];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`game.html missing #${id}`);
}
const requiredScripts = [
  'assets/game-manifest.js',
  'assets/game-bundle-loader.js',
  'assets/engine/state.js',
  'assets/engine/passage.js',
  'assets/game-modular.js'
];
for (const script of requiredScripts) {
  if (!html.includes(script)) throw new Error(`game.html missing script ${script}`);
}
if (html.includes('assets/game-runtime.js?v=')) {
  throw new Error('published game.html must not load dynamic game-runtime.js');
}
const files = [
  'assets/game-manifest.js',
  'assets/game-bundle-loader.js',
  'assets/engine/state.js',
  'assets/engine/rules.js',
  'assets/engine/checks.js',
  'assets/engine/effects.js',
  'assets/engine/passage.js',
  'assets/engine/save.js',
  'assets/engine/export-playlog.js',
  'assets/game-v6-hotfix.js',
  'assets/game-modular.js'
];
for (const file of files) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`missing ${file}`);
  const source = fs.readFileSync(full, 'utf8');
  new Function(source);
}
const symbols = ['DaGoState', 'DaGoPassage', 'DaGoModularRuntime'];
for (const symbol of symbols) {
  const found = files.some(file => fs.readFileSync(path.join(root, file), 'utf8').includes(symbol));
  if (!found) throw new Error(`runtime symbol not referenced: ${symbol}`);
}
console.log('Public page validation passed.');
