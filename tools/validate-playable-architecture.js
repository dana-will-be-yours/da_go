const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
function read(f){return fs.readFileSync(path.join(root,f),'utf8')}
function must(t,k,l){if(!t.includes(k))throw new Error(`${l}: missing ${k}`)}
function mustNot(t,k,l){if(t.includes(k))throw new Error(`${l}: forbidden ${k}`)}
const runtime=read('assets/game-runtime.js'),balanced=read('assets/character-balanced-effects.js'),html=read('game.html');
must(runtime,"const VERSION='1.15.0-balanced-character-preview';",'runtime');
for(const token of ['character-preview-role-zh-only.js','character-balanced-effects.js','game-modular.js'])must(runtime,token,'runtime loader');
mustNot(runtime,'dago-dol-like-runtime.js','runtime loader');
for(const token of ['ROLE_SKILLS','BG_SKILLS','renderBalancedBlock','patchIdentityLine','身分與背景加成'])must(balanced,token,'balanced character preview');
for(const token of ['origin','trait','attributePlan','specialOrigin'])must(balanced,token,'background coverage');
for(const token of ['身體','頭部','性格與身分','背景','遊戲設置','文字顯示'])must(html,token,'all previous settings');
console.log('Playable architecture validation passed for 1.15.0-balanced-character-preview.');
