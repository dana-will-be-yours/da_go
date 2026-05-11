const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const expectedVersion = '1.14.5-full-no-code-character-fix';
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function must(text, token, label) { if (!text.includes(token)) throw new Error(`${label}: missing ${token}`); }
function exists(file) { const p = path.join(root, file); if (!fs.existsSync(p)) throw new Error(`missing ${file}`); return p; }
const html=read('game.html'), runtime=read('assets/game-runtime.js');
for (const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox']) must(html, `id="${id}"`, 'game.html');
must(runtime, `const VERSION='${expectedVersion}';`, 'game-runtime.js');
for (const s of ['game-no-code-finalizer.js','game-character-build-zh.js','game-skill-label-zh.js','game-dol-select-combat.js']) must(runtime, s, 'runtime loader');
for (const f of ['assets/game-runtime.js','assets/game-no-code-finalizer.js','assets/game-modular.js','assets/game-bundle-loader.js']) new Function(fs.readFileSync(exists(f),'utf8'));
const finalizer=read('assets/game-no-code-finalizer.js');
for (const token of ['retainer','家臣','innkeeper','客棧掌櫃','scholar','學士','nvhuan','女鬟','未定項目','specialTalents']) must(finalizer, token, 'no code finalizer');
console.log('Public page validation passed for 1.14.5-full-no-code-character-fix.');
