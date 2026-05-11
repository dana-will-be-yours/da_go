const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const version = '1.15.0-balanced-character-preview';
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
    .replaceAll('1.14.0-chinese-simple-combat', version)
    .replaceAll('1.14.1-start-hotfix', version)
    .replaceAll('1.14.2-dol-select-combat', version)
    .replaceAll('1.14.3-character-build-select-combat', version)
    .replaceAll('1.14.4-no-english-codes', version)
    .replaceAll('1.14.5-full-no-code-character-fix', version)
    .replaceAll('1.14.6-full-code-cleanup', version)
    .replaceAll('1.14.8-resolved-character-identity', version)
    .replaceAll('1.14.9-preview-roles-chinese-only', version)
    .replaceAll('1.16.0-dol-like-playable', version)
    .replaceAll('1.16.1-preserve-settings-dol-grammar', version);
}
for (const file of ['game.html','assets/game-runtime.js']) {
  const full = path.join(root, file);
  let text = patchVersion(fs.readFileSync(full, 'utf8'));
  if (file === 'game.html') text = text.replace('<legend>性格與身分</legend>', '<legend>身分</legend>');
  if (file === 'assets/game-runtime.js') {
    text = text.replace(/'assets\/dago-dol-like-runtime\.js',?/g, '');
    if (!text.includes('assets/character-setup-hotfix-1150.js')) text = text.replace("'assets/game-no-code-finalizer.js'", "'assets/game-no-code-finalizer.js','assets/character-setup-hotfix-1150.js'");
  }
  fs.writeFileSync(full, text, 'utf8');
}
require('./v113_time.js')(root);
require('./patch-deckbuilder-v114.js')(root);
require('./patch-character-v113.js')(root);
console.log('patched full game runtime for ' + version);
