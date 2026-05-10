const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file){return fs.readFileSync(path.join(root,file),'utf8')}
function must(text, token, label){if(!text.includes(token)) throw new Error(label + ': missing ' + token)}
const html = read('game.html');
const runtime = read('assets/game-runtime.js');
const rules = read('assets/game-rules-ui-fix.js');
const modular = read('assets/game-modular.js');
const bundle = JSON.parse(read('assets/data/dago-changshan-v1-bundle.json'));
for (const id of ['startForm','buildPreview','randomizeCharacter','overviewBox','choiceList','playPanel']) must(html, `id="${id}"`, 'html');
must(runtime, "const VERSION='1.12.13-deckbuilder';", 'runtime');
for (const file of ['scenario-select.js','character-create-ui.js','game-rules-ui-fix.js','game-character-balance-fix.js','game-modular.js']) must(runtime, file, 'runtime loader');
for (const token of ['addPreviewDetail','preview-detail-block','調整值','技能值','renderFullSidebar','full-status-sidebar','人物關係','衝突']) must(rules, token, 'full ui');
for (const token of ['COMBAT_CARDS','deckBuilderHtml','ensureDeckBuild','ownedCards','deckCodes','combat_card','startCombat','renderCombat']) must(modular, token, 'combat runtime');
if (!bundle.metadata || bundle.metadata.project_code !== 'DAGO') throw new Error('bundle metadata.project_code must be DAGO');
if (!Array.isArray(bundle.passages) || bundle.passages.length < 6) throw new Error('bundle needs at least 6 passages');
if (!Array.isArray(bundle.relationships) || bundle.relationships.length < 1) throw new Error('bundle needs relationships');
if (!Array.isArray(bundle.event_pools)) throw new Error('bundle event_pools must be array');
console.log('Playable architecture validation passed.');
