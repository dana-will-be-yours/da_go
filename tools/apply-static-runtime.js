const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'game.html');
let html = fs.readFileSync(file, 'utf8');
const oldLine = '  <script src="assets/game-runtime.js?v=1.12.1-perf"></script>\n';
if (html.includes(oldLine)) html = html.split(oldLine).join('');
const names = [
  'game-runtime.js',
  'game-bundle-loader.js',
  'engine/state.js',
  'engine/rules.js',
  'engine/checks.js',
  'engine/effects.js',
  'engine/passage.js',
  'engine/save.js',
  'engine/export-playlog.js',
  'game-v6-hotfix.js',
  'game-modular.js',
  'game-choice-delegation-fix.js'
];
const lines = names.map(name => '  <script defer src="assets/' + name + '?v=1.12.3-static-runtime"></script>').join('\n');
if (!html.includes(lines)) html = html.replace('</head>', lines + '\n</head>');
fs.writeFileSync(file, html, 'utf8');
console.log('updated game.html');
