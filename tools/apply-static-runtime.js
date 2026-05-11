const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const version = '1.14.1-start-hotfix';
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
    .replaceAll('1.12.12-events-time', version)
    .replaceAll('1.12.13-deckbuilder', version)
    .replaceAll('1.13.0-ui-core', version)
    .replaceAll('1.13.1-engine-split', version)
    .replaceAll('1.13.2-direct-split', version)
    .replaceAll('1.14.0-chinese-simple-combat', version);
}
const htmlPath = path.join(root, 'game.html');
fs.writeFileSync(htmlPath, patchVersion(fs.readFileSync(htmlPath, 'utf8')), 'utf8');
const runtimePath = path.join(root, 'assets/game-runtime.js');
fs.writeFileSync(runtimePath, patchVersion(fs.readFileSync(runtimePath, 'utf8')), 'utf8');
require('./v113_time.js')(root);
require('./patch-deckbuilder-v114.js')(root);
require('./patch-character-v113.js')(root);
console.log('patched full game runtime for ' + version);
