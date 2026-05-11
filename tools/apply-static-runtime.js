const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const version = '1.13.1-engine-split';
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
    .replaceAll('1.13.0-ui-core', version);
}
function addLoader(html) {
  if (html.includes('assets/engine-split-loader.js')) return html;
  const tag = '<script src="assets/engine-split-loader.js?v=' + version + '"></script>\n';
  return html.replace('</body>', '  ' + tag + '</body>');
}
let htmlPath = path.join(root, 'game.html');
fs.writeFileSync(htmlPath, addLoader(patchVersion(fs.readFileSync(htmlPath, 'utf8'))), 'utf8');
let rtPath = path.join(root, 'assets/game-runtime.js');
fs.writeFileSync(rtPath, patchVersion(fs.readFileSync(rtPath, 'utf8')), 'utf8');
require('./v113_time.js')(root);
require('./patch-deckbuilder-v114.js')(root);
require('./patch-character-v113.js')(root);
console.log('patched static runtime for ' + version);
