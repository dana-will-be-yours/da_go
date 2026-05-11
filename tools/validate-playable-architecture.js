const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function must(text, token, label) { if (!text.includes(token)) throw new Error(`${label}: missing ${token}`); }
const runtime=read('assets/game-runtime.js'), finalizer=read('assets/game-no-code-finalizer.js'), select=read('assets/game-dol-select-combat.js');
must(runtime, "const VERSION='1.14.5-full-no-code-character-fix';", 'runtime');
for (const token of ['retainer','家臣','innkeeper','客棧掌櫃','scholar','學士','nvhuan','女鬟','ROLE_EFFECTS','ORIGIN_EFFECTS']) must(finalizer, token, 'role/origin coverage');
for (const token of ['攻擊','自衛','說服','觀察環境','利用環境','使用物品','退避','觀望']) must(select, token, 'dropdown combat');
console.log('Playable architecture validation passed for 1.14.5-full-no-code-character-fix.');
