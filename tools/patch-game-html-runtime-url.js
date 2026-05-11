const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'game.html');
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/assets\/game-runtime\.js\?v=[^"]+/g,'assets/game-runtime.js?v=1.14.9-preview-roles-chinese-only');
fs.writeFileSync(file, html, 'utf8');
console.log('Patched game.html runtime URL to 1.14.9-preview-roles-chinese-only');
