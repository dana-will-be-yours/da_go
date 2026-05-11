const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');const expectedVersion='1.15.0-balanced-character-preview';
function read(f){return fs.readFileSync(path.join(root,f),'utf8')}
function must(t,k,l){if(!t.includes(k))throw new Error(`${l}: missing ${k}`)}
function exists(f){const p=path.join(root,f);if(!fs.existsSync(p))throw new Error(`missing ${f}`);return p}
const html=read('game.html'), runtime=read('assets/game-runtime.js');
for(const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox']) must(html,`id="${id}"`,'game.html');
must(runtime,`const VERSION='${expectedVersion}';`,'game-runtime.js');
for(const s of ['character-balanced-effects.js','character-preview-role-zh-only.js','game-modular.js']) must(runtime,s,'runtime loader');
for(const f of ['assets/game-runtime.js','assets/character-balanced-effects.js','assets/character-preview-role-zh-only.js']){const p=exists(f);new Function(fs.readFileSync(p,'utf8'))}
const balanced=read('assets/character-balanced-effects.js');
for(const token of ['liuwaiguan','流外官','staff_officer','參軍','coroner','仵作穩婆','wenxuan','文選','matchmaker','媒妁','每一項身分、出身地、性格、屬性點配置、特殊身世皆提供 4 點技能值']) must(balanced,token,'balanced preview');
console.log('Public page validation passed for 1.15.0-balanced-character-preview.');
