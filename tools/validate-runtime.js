const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
for (const file of ['assets/dago-dol-like-runtime.js','assets/game-runtime.js']) {
  new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}
const html = fs.readFileSync(path.join(root, 'game.html'), 'utf8');
if (!html.includes('assets/dago-dol-like-runtime.js?v=1.16.0-dol-like-playable')) throw new Error('game.html does not load DoL-like runtime');
console.log('Runtime validation passed for 1.16.0-dol-like-playable.');
