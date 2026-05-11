const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');const expectedVersion='1.15.0-balanced-character-preview';
function read(f){return fs.readFileSync(path.join(root,f),'utf8')}
function must(t,k,l){if(!t.includes(k))throw new Error(`${l}: missing ${k}`)}
function mustNot(t,k,l){if(t.includes(k))throw new Error(`${l}: forbidden ${k}`)}
function exists(f){const p=path.join(root,f);if(!fs.existsSync(p))throw new Error(`missing ${f}`);return p}
const html=read('game.html'),runtime=read('assets/game-runtime.js');
for(const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox'])must(html,`id="${id}"`,'game.html');
must(html,`assets/game-runtime.js?v=${expectedVersion}`,'game.html');
must(runtime,`const VERSION='${expectedVersion}';`,'game-runtime.js');
for(const s of ['assets/character-preview-role-zh-only.js','assets/character-balanced-effects.js','assets/game-modular.js'])must(runtime,s,'runtime loader');
for(const s of ['assets/dago-dol-like-runtime.js'])mustNot(runtime,s,'runtime loader');
for(const f of ['assets/game-runtime.js','assets/character-preview-role-zh-only.js','assets/character-balanced-effects.js']){const p=exists(f);new Function(fs.readFileSync(p,'utf8'))}
const htmlText=read('game.html');
for(const token of ['大國年代記','身體','頭部','性格與身分','背景','遊戲設置','文字顯示','屬性','社交','特質','日誌','統計','地圖','選項','存檔'])must(htmlText,token,'settings preserved');
const balanced=read('assets/character-balanced-effects.js');
for(const token of ['ROLE_SKILLS','BG_SKILLS','renderBalancedBlock','patchIdentityLine','身分與背景加成','每一項身分、出身地、性格、屬性點配置、特殊身世皆提供 4 點技能值'])must(balanced,token,'balanced character preview');
console.log('Public page validation passed for 1.15.0-balanced-character-preview.');
