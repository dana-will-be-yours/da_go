const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const expectedVersion = '1.15.5-stable-preview-pages';

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function must(text, token, label) {
  if (!text.includes(token)) throw new Error(label + ': missing ' + token);
}

function mustNot(text, token, label) {
  if (text.includes(token)) throw new Error(label + ': forbidden legacy token ' + token);
}

function exists(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error('missing ' + file);
  return full;
}

const html = read('game.html');
const runtime = read('assets/game-runtime.js');
const balanced = read('assets/character-balanced-effects.js');
const canonical = read('assets/character-canonical-balance-fix.js');

for (const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox']) {
  must(html, 'id="' + id + '"', 'game.html');
}

must(html, 'assets/game-runtime.js?v=' + expectedVersion, 'game.html');
must(runtime, "const VERSION='" + expectedVersion + "';", 'game-runtime.js');

for (const token of [
  'role-table-extensible-fix.js',
  'character-balanced-effects.js',
  'character-canonical-balance-fix.js',
  'game-modular.js'
]) {
  must(runtime, token, 'runtime loader');
}

for (const token of [
  'game-character-build-zh.js',
  'game-no-code-finalizer.js',
  'character-preview-role-zh-only.js'
]) {
  mustNot(runtime, token, 'runtime loader');
}

mustNot(balanced, 'MutationObserver', 'character-balanced-effects.js');
mustNot(balanced, "addEventListener('click'", 'character-balanced-effects.js');
must(balanced, '1.15.5-selection-stable', 'character-balanced-effects.js');

must(canonical, 'DaGoCanonicalBalanceFix', 'character-canonical-balance-fix.js');
must(canonical, 'allRowsHaveFourSkillPoints', 'character-canonical-balance-fix.js');

for (const file of [
  'assets/game-runtime.js',
  'assets/role-table-extensible-fix.js',
  'assets/character-balanced-effects.js',
  'assets/character-canonical-balance-fix.js'
]) {
  const full = exists(file);
  new Function(fs.readFileSync(full, 'utf8'));
}

console.log('Public page validation passed for ' + expectedVersion);
