const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');const expectedVersion='1.14.9-preview-roles-chinese-only';
function read(f){return fs.readFileSync(path.join(root,f),'utf8')}
function must(t,k,l){if(!t.includes(k))throw new Error(`${l}: missing ${k}`)}
function exists(f){const p=path.join(root,f);if(!fs.existsSync(p))throw new Error(`missing ${f}`);return p}
const html=read('game.html'),runtime=read('assets/game-runtime.js');
for(const id of ['startForm','buildPreview','randomizeCharacter'])must(html,`id="${id}"`,'game.html');
must(runtime,`const VERSION='${expectedVersion}';`,'game-runtime.js');
must(runtime,'assets/character-preview-role-zh-only.js','runtime loader');
for(const f of ['assets/game-runtime.js','assets/character-preview-role-zh-only.js']){const p=exists(f);new Function(fs.readFileSync(p,'utf8'))}
const patch=read('assets/character-preview-role-zh-only.js');
for(const token of ['select[name="roles"] option','matchmaker','媒妁','liuwaiguan','流外官','nvhuan','女宦','未定身分|未定項目','地方人士'])must(patch,token,'role preview chinese patch');
console.log('Public page validation passed for 1.14.9-preview-roles-chinese-only.');
