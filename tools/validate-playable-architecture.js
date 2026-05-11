const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
function read(f){return fs.readFileSync(path.join(root,f),'utf8')}
function must(t,k,l){if(!t.includes(k))throw new Error(`${l}: missing ${k}`)}
const runtime=read('assets/game-runtime.js'), balanced=read('assets/character-balanced-effects.js');
must(runtime,"const VERSION='1.15.0-balanced-character-preview';",'runtime');
for(const token of ['ROLE_SKILLS','BG_SKILLS','renderBalancedBlock','patchIdentityLine','身分與背景加成']) must(balanced,token,'balanced character preview');
for(const token of ['origin','trait','attributePlan','specialOrigin']) must(balanced,token,'background coverage');
console.log('Playable architecture validation passed for 1.15.0-balanced-character-preview.');
