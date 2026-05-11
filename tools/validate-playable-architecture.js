const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');function read(f){return fs.readFileSync(path.join(root,f),'utf8')}function must(t,k,l){if(!t.includes(k))throw new Error(`${l}: missing ${k}`)}
const runtime=read('assets/game-runtime.js'),build=read('assets/game-character-build-zh.js'),finalizer=read('assets/game-no-code-finalizer.js'),select=read('assets/game-dol-select-combat.js');
must(runtime,"const VERSION='1.14.6-full-code-cleanup';",'runtime');
for(const token of ['liuwaiguan','staff_officer','coroner','wenxuan','retainer','innkeeper','scholar','nvhuan','border_soldier','family_official','fortuneteller','ranger','specialTalents'])must(build,token,'role coverage');
for(const token of ['未定項目','流外官','幕佐','仵作','文選吏','家臣','客棧掌櫃','學士','女鬟','邊軍','家官','卜者','遊俠'])must(finalizer,token,'no visible code fallback');
for(const token of ['攻擊','自衛','說服','觀察環境','利用環境','使用物品','退避','觀望'])must(select,token,'dropdown combat');
console.log('Playable architecture validation passed for 1.14.6-full-code-cleanup.');
