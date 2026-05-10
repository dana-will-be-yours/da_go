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
  'assets/engine/save.js',
  'assets/engine/export-playlog.js',
  'assets/game-modular.js',
  'assets/game-runtime.js'
];
for (const file of jsFiles) {
  const code = fs.readFileSync(path.join(root, file), 'utf8');
  new vm.Script(code, { filename: file });
}

const bundlePath = path.join(root, 'assets/data/dago-changshan-v1-bundle.json');
const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
if (!bundle.metadata || !bundle.metadata.start_passage) throw new Error('metadata.start_passage is required');
if (!Array.isArray(bundle.passages) || bundle.passages.length === 0) throw new Error('passages are required');
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
console.log(`Validated ${jsFiles.length} JS files and ${bundle.passages.length} passages.`);
