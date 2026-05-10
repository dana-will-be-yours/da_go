const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'game.html');
let html = fs.readFileSync(file, 'utf8');
for (const v of ['1.12.1-perf', '1.12.4-combat']) {
  const old = '  <scr' + 'ipt src="assets/game-runtime.js?v=' + v + '"></scr' + 'ipt>\n';
  html = html.split(old).join('');
}
const names = [
  'game-manifest.js',
  'game-bundle-loader.js',
  'engine/state.js',
  'engine/rules.js',
  'engine/checks.js',
  'engine/effects.js',
  'engine/passage.js',
  'engine/save.js',
  'engine/export-playlog.js',
  'game-v6-hotfix.js',
  'game-modular.js'
];
const open = '  <scr' + 'ipt defer src="assets/';
const close = '?v=1.12.4-combat"></scr' + 'ipt>';
const lines = names.map(name => open + name + close).join('\n');
if (!html.includes('assets/game-manifest.js?v=1.12.4-combat')) html = html.replace('</head>', lines + '\n</head>');
fs.writeFileSync(file, html, 'utf8');
console.log('updated game.html for static runtime');
