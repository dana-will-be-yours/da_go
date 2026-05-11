const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const expectedVersion = '1.14.2-dol-select-combat';
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function must(text, token, label) { if (!text.includes(token)) throw new Error(`${label}: missing ${token}`); }
function exists(file) { const p = path.join(root, file); if (!fs.existsSync(p)) throw new Error(`missing ${file}`); return p; }

const html = read('game.html');
const runtime = read('assets/game-runtime.js');
for (const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox']) must(html, `id="${id}"`, 'game.html');
must(runtime, `const VERSION='${expectedVersion}';`, 'game-runtime.js');
for (const s of ['game-modular.js','game-skill-label-zh.js','game-dol-select-combat.js']) must(runtime, s, 'runtime loader');

for (const f of [
 'assets/game-runtime.js',
 'assets/game-skill-label-zh.js',
 'assets/game-dol-select-combat.js',
 'assets/game-modular.js',
 'assets/game-bundle-loader.js',
 'assets/engine/rules.js',
 'assets/engine/passage.js',
 'assets/engine/events.js'
]) {
  const p = exists(f);
  new Function(fs.readFileSync(p, 'utf8'));
}

must(read('assets/game-dol-select-combat.js'), 'data-dago-combat-action', 'select combat');
must(read('assets/game-dol-select-combat.js'), '觀察環境', 'select combat');
must(read('assets/game-dol-select-combat.js'), '說服', 'select combat');
must(read('assets/game-dol-select-combat.js'), '自衛', 'select combat');
must(read('assets/game-skill-label-zh.js'), '內功', 'skill labels');
must(read('assets/game-skill-label-zh.js'), '智識', 'skill labels');

console.log('Public page validation passed for 1.14.2-dol-select-combat.');
