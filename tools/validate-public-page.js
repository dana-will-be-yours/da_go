const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const expectedVersion='1.15.0-balanced-character-preview';

function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function must(text,token,label){if(!text.includes(token))throw new Error(`${label}: missing ${token}`)}
function mustNot(text,token,label){if(text.includes(token))throw new Error(`${label}: forbidden ${token}`)}
function exists(file){const full=path.join(root,file);if(!fs.existsSync(full))throw new Error(`missing ${file}`);return full}

const html=read('game.html');
const runtime=read('assets/game-runtime.js');
const balanced=read('assets/character-balanced-effects.js');
const setup=read('assets/character-setup-hotfix-1150.js');

for(const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox']){
  must(html,`id="${id}"`,'game.html');
}

for(const token of [
  '大國年代記',
  '身體',
  '頭部',
  '<legend>身分</legend>',
  '背景',
  '性格',
  '遊戲設置',
  '文字顯示',
  '屬性',
  '社交',
  '特質',
  '日誌',
  '統計',
  '地圖',
  '選項',
  '存檔'
]){
  must(html,token,'settings preserved');
}

must(html,`assets/game-runtime.js?v=${expectedVersion}`,'game.html');
must(runtime,`const VERSION='${expectedVersion}';`,'game-runtime.js');

for(const token of [
  'assets/game-character-balance-fix.js',
  'assets/character-create-ui.js',
  'assets/character-balanced-effects.js',
  'assets/character-setup-hotfix-1150.js',
  'assets/game-modular.js'
]){
  must(runtime,token,'runtime loader');
}

for(const token of [
  'assets/game-character-build-zh.js',
  'assets/character-preview-role-zh-only.js',
  'assets/game-no-code-finalizer.js',
  'assets/dago-dol-like-runtime.js',
  '1.16.0-dol-like-playable',
  '1.16.1-preserve-settings-dol-grammar',
  'DoL-like grammar'
]){
  mustNot(runtime,token,'runtime loader');
  mustNot(html,token,'game.html');
}

for(const token of [
  'ROLE_SKILLS',
  'BG_SKILLS',
  'renderBalancedBlock',
  'patchIdentityLine',
  '身分與背景加成',
  '每一項身分、出身地、性格、屬性點配置、特殊身世皆提供 4 點技能值'
]){
  must(balanced,token,'balanced character preview');
}

mustNot(balanced,"addEventListener('click'",'character-balanced-effects.js');
mustNot(balanced,'MutationObserver','character-balanced-effects.js');

for(const token of [
  'DaGo1150RestoreSettingsHotfix',
  'randomize',
  'renameRoleFieldset',
  'enforceSpecialOrigins',
  'textStyle'
]){
  must(setup,token,'setup hotfix');
}

for(const file of [
  'assets/game-runtime.js',
  'assets/game-character-balance-fix.js',
  'assets/character-create-ui.js',
  'assets/character-balanced-effects.js',
  'assets/character-setup-hotfix-1150.js',
  'assets/game-modular.js'
]){
  const full=exists(file);
  new Function(fs.readFileSync(full,'utf8'));
}

console.log('Public page validation passed for 1.15.0 preview pipeline fix.');