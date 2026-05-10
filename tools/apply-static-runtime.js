const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const version = '1.12.13-deckbuilder';
function patchVersion(text) {
  return text
    .replaceAll('1.12.1-perf', version)
    .replaceAll('1.12.4-combat', version)
    .replaceAll('1.12.5-restored-ui', version)
    .replaceAll('1.12.6-full-ui', version)
    .replaceAll('1.12.7-panel-check', version)
    .replaceAll('1.12.8-panel-enhance', version)
    .replaceAll('1.12.9-modular-panels', version)
    .replaceAll('1.12.10-card-ui', version)
    .replaceAll('1.12.11-bg-cards', version)
    .replaceAll('1.12.12-events-time', version);
}
for (const file of ['game.html', 'assets/game-runtime.js']) {
  const full = path.join(root, file);
  fs.writeFileSync(full, patchVersion(fs.readFileSync(full, 'utf8')), 'utf8');
}
require('./patch-time-events-v113.js')(root);
require('./patch-deckbuilder-v113.js')(root);
require('./patch-character-v113.js')(root);
console.log('patched static runtime for ' + version);
