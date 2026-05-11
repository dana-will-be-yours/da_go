const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
function read(f){return fs.readFileSync(path.join(root,f),'utf8')}
function must(t,k,l){if(!t.includes(k))throw new Error(`${l}: missing ${k}`)}
const runtime=read('assets/game-runtime.js'),patch=read('assets/character-preview-role-zh-only.js');
must(runtime,"const VERSION='1.14.9-preview-roles-chinese-only';",'runtime');
must(runtime,'assets/character-preview-role-zh-only.js','runtime loader');
for(const token of ['patchBuildPreviewText','collectRoleMap','window.DaGoCharacterCreateUi','媒妁','文選','家世官','邊防關部伍','女宦','地方人士'])must(patch,token,'preview role chinese only');
console.log('Playable architecture validation passed for 1.14.9-preview-roles-chinese-only.');
