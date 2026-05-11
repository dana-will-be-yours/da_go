const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const expectedVersion = '1.14.3-character-build-select-combat';
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function must(text, token, label) { if (!text.includes(token)) throw new Error(`${label}: missing ${token}`); }
function exists(file) { const p = path.join(root, file); if (!fs.existsSync(p)) throw new Error(`missing ${file}`); return p; }

const html = read('game.html');
const runtime = read('assets/game-runtime.js');
for (const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox']) must(html, `id="${id}"`, 'game.html');
must(runtime, `const VERSION='${expectedVersion}';`, 'game-runtime.js');
for (const s of ['game-character-build-zh.js','game-modular.js','game-skill-label-zh.js','game-dol-select-combat.js']) must(runtime, s, 'runtime loader');

for (const f of [
 'assets/game-runtime.js',
 'assets/game-character-build-zh.js',
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

const build = read('assets/game-character-build-zh.js');
for (const token of ['ROLE_EFFECTS','ORIGIN_EFFECTS','TRAIT_EFFECTS','PLAN_EFFECTS','SPECIAL_EFFECTS','specialTalents','身分與背景加成']) must(build, token, 'character build');
for (const token of ['court_official','soldier','disciple','changshan','nanjing','qishan_ye','wanminhui']) must(build, token, 'character build coverage');
const select = read('assets/game-dol-select-combat.js');
for (const token of ['data-dago-combat-action','攻擊','自衛','說服','觀察環境','利用環境','使用物品','退避','觀望']) must(select, token, 'select combat');
const labels = read('assets/game-skill-label-zh.js');
for (const token of ['內功','外功','觀察','口才','智識']) must(labels, token, 'skill labels');

console.log('Public page validation passed for 1.14.3-character-build-select-combat.');
