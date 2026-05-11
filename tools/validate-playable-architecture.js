const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');

function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function must(text,token,label){if(!text.includes(token))throw new Error(`${label}: missing ${token}`)}
function mustNot(text,token,label){if(text.includes(token))throw new Error(`${label}: forbidden ${token}`)}

const runtime=read('assets/game-runtime.js');
const balanced=read('assets/character-balanced-effects.js');
const html=read('game.html');
const setup=read('assets/character-setup-hotfix-1150.js');
const modular=read('assets/game-modular.js');

must(runtime,"const VERSION='1.15.0-balanced-character-preview';",'runtime');

for(const token of [
  'game-character-balance-fix.js',
  'character-create-ui.js',
  'character-balanced-effects.js',
  'character-setup-hotfix-1150.js',
  'game-modular.js'
]){
  must(runtime,token,'runtime loader');
}

for(const token of [
  'game-character-build-zh.js',
  'character-preview-role-zh-only.js',
  'game-no-code-finalizer.js',
  'dago-dol-like-runtime.js',
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

for(const token of [
  'origin',
  'trait',
  'attributePlan',
  'specialOrigin'
]){
  must(balanced,token,'background coverage');
}

mustNot(balanced,"addEventListener('click'",'balanced character preview');
mustNot(balanced,'MutationObserver','balanced character preview');

for(const token of [
  '身體',
  '頭部',
  '<legend>身分</legend>',
  '背景',
  '出身',
  '性格',
  '屬性點配置',
  '特殊身世',
  '遊戲設置',
  '文字顯示',
  '隨機化',
  '開始遊戲'
]){
  must(html,token,'all previous settings');
}

for(const token of [
  'DaGo1150RestoreSettingsHotfix',
  'randomize',
  'renameRoleFieldset',
  'enforceSpecialOrigins',
  'textStyle'
]){
  must(setup,token,'setup hotfix');
}

for(const token of [
  'safeLabel',
  'renderOverview',
  'formCharacter',
  'startGame',
  'render'
]){
  must(modular,token,'modular runtime');
}

console.log('Playable architecture validation passed for 1.15.0 preview pipeline fix.');