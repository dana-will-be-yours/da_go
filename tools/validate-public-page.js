const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const expectedVersion = '1.16.0-dol-like-playable';
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function must(text, token, label) { if (!text.includes(token)) throw new Error(label + ': missing ' + token); }
function mustNot(text, token, label) { if (text.includes(token)) throw new Error(label + ': forbidden ' + token); }
const html = read('game.html');
const runtime = read('assets/dago-dol-like-runtime.js');
for (const id of ['startPanel','playPanel','choiceList','overviewBox','overlayBackdrop']) must(html, 'id="' + id + '"', 'game.html');
must(html, 'assets/dago-dol-like-runtime.js?v=' + expectedVersion, 'game.html');
must(runtime, "const VERSION='" + expectedVersion + "';", 'dago-dol-like-runtime.js');
for (const token of [':: Gate','<<link','<<if','$fatigue','DoL-like passage grammar runtime','allRowsHaveFourSkillPoints']) must(runtime, token, 'dago-dol-like-runtime.js');
for (const token of ['game-character-build-zh.js','game-no-code-finalizer.js','character-preview-role-zh-only.js','MutationObserver']) mustNot(runtime, token, 'dago-dol-like-runtime.js');
for (const token of ['憭','閮','撟','�']) mustNot(html, token, 'game.html encoding');
new vm.Script(runtime, { filename: 'assets/dago-dol-like-runtime.js' });
new vm.Script(read('assets/game-runtime.js'), { filename: 'assets/game-runtime.js' });
console.log('Public page validation passed for ' + expectedVersion);
