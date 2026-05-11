const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const jsFiles = [
  'assets/game-bundle-loader.js',
  'assets/engine/state.js',
  'assets/engine/rules.js',
  'assets/engine/checks.js',
  'assets/engine/effects.js',
  'assets/engine/passage.js',
  'assets/engine/events.js',
  'assets/engine/deck.js',
  'assets/engine/combat.js',
  'assets/engine/sidebar.js',
  'assets/engine/save.js',
  'assets/engine/export-playlog.js',
  'assets/ui-core.js',
  'assets/engine-split-loader.js',
  'assets/game-modular.js',
  'assets/game-runtime.js'
];
for (const file of jsFiles) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  new vm.Script(code, { filename: file });
}
for (const [file, token] of [
  ['assets/engine/deck.js', 'window.DaGoDeck'],
  ['assets/engine/combat.js', 'window.DaGoCombat'],
  ['assets/engine/sidebar.js', 'window.DaGoSidebar']
]) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  if (!code.includes(token)) throw new Error(file + ' missing ' + token);
}
const loader = fs.readFileSync(path.join(root, 'assets/engine-split-loader.js'), 'utf8');
for (const file of ['assets/engine/deck.js','assets/engine/combat.js','assets/engine/sidebar.js']) {
  if (!loader.includes(file)) throw new Error('engine-split-loader does not load ' + file);
}

const bundlePath = path.join(root, 'assets/data/dago-changshan-v1-bundle.json');
const extensionPath = path.join(root, 'assets/data/dago-changshan-v1-extension.json');
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
const extension = JSON.parse(fs.readFileSync(extensionPath, 'utf8'));
function merge(base, patch) {
  const map = new Map((base || []).map(x => [x.id || x.passage_code || x.npc_code || x.event_code, x]));
  for (const x of patch || []) map.set(x.id || x.passage_code || x.npc_code || x.event_code, x);
  return [...map.values()];
}
bundle.passages = merge(bundle.passages, extension.passages);
bundle.relationships = merge(bundle.relationships, extension.relationships);
bundle.event_pools = merge(bundle.event_pools, extension.event_pools);
if (!bundle.metadata || !bundle.metadata.start_passage) throw new Error('metadata.start_passage is required');
if (!Array.isArray(bundle.passages) || bundle.passages.length < 12) throw new Error('at least 12 passages are required after extension merge');
if (!Array.isArray(bundle.relationships) || bundle.relationships.length < 5) throw new Error('at least 5 relationships are required after extension merge');
if (!Array.isArray(bundle.event_pools) || bundle.event_pools.length < 4) throw new Error('at least 4 event pool entries are required after extension merge');
const ids = new Set(bundle.passages.map(p => p.id || p.passage_code));
if (!ids.has(bundle.metadata.start_passage)) throw new Error('start_passage does not exist: ' + bundle.metadata.start_passage);
for (const passage of bundle.passages) {
  const id = passage.id || passage.passage_code;
  if (!id) throw new Error('passage id is required');
  if (!passage.title) throw new Error('passage title is required: ' + id);
  for (const choice of passage.choices || []) {
    const target = choice.target || choice.next_passage_code || choice.failure_passage_code;
    if (target && !ids.has(target)) throw new Error(`choice target does not exist: ${id} -> ${target}`);
    if (choice.check && (!choice.check.skill || !choice.check.dc)) throw new Error(`invalid check in ${id}`);
  }
}
console.log(`Validated ${jsFiles.length} JS files, ${bundle.passages.length} passages, ${bundle.relationships.length} relationships, and ${bundle.event_pools.length} events.`);
