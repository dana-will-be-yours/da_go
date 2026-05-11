const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const version='1.16.1-preserve-settings-dol-grammar';
function rw(file,fn){const p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')),'utf8');}
rw('game.html',s=>s.replace(/assets\/game-runtime\.js\?v=[^"']+/g,'assets/game-runtime.js?v='+version));
rw('assets/game-runtime.js',s=>s.replace(/const VERSION='[^']+';/,"const VERSION='"+version+"';"));
console.log('patched runtime for '+version);
