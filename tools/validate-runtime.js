const fs=require('fs');const path=require('path');const vm=require('vm');const root=path.resolve(__dirname,'..');
for(const file of ['assets/game-runtime.js','assets/dago-dol-like-runtime.js']){new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});}
console.log('Validated DoL-like runtime files.');
