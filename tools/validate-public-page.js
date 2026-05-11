const fs=require('fs');const path=require('path');const vm=require('vm');const root=path.resolve(__dirname,'..');const version='1.16.1-preserve-settings-dol-grammar';
function read(f){return fs.readFileSync(path.join(root,f),'utf8')}
function must(t,k,l){if(!t.includes(k))throw new Error(l+': missing '+k)}
function mustNot(t,k,l){if(t.includes(k))throw new Error(l+': forbidden '+k)}
const html=read('game.html'),runtime=read('assets/game-runtime.js'),dol=read('assets/dago-dol-like-runtime.js');
for(const bad of ['憭批','撟港','閫','頨恍','�'])mustNot(html,bad,'game.html mojibake');
for(const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox'])must(html,'id="'+id+'"','game.html');
must(html,'assets/game-runtime.js?v='+version,'game.html');
must(runtime,"const VERSION='"+version+"';",'game-runtime.js');
must(runtime,'assets/dago-dol-like-runtime.js','game-runtime.js');
for(const token of [':: Start','<<link','<<if','<<set','[[去告示牆看今日招工|WorkBoard]]','DaGoDolLikeRuntime','allRowsHaveFourSkillPoints'])must(dol,token,'DoL-like runtime');
for(const bad of ['MutationObserver','game-no-code-finalizer.js','game-character-build-zh.js','character-preview-role-zh-only.js'])mustNot(runtime,bad,'game-runtime.js');
new vm.Script(runtime);new vm.Script(dol);
console.log('Public page validation passed for '+version);
