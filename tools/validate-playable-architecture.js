const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function must(text, token, label) { if (!text.includes(token)) throw new Error(`${label}: missing ${token}`); }

const runtime = read('assets/game-runtime.js');
const select = read('assets/game-dol-select-combat.js');
const labels = read('assets/game-skill-label-zh.js');
const bundle = JSON.parse(read('assets/data/dago-changshan-v1-bundle.json'));
const extension = JSON.parse(read('assets/data/dago-changshan-v1-extension.json'));

must(runtime, "const VERSION='1.14.2-dol-select-combat';", 'runtime');
for (const token of ['攻擊','自衛','說服','觀察環境','利用環境','使用物品','退避','觀望','select']) must(select, token, 'DoL-style select combat');
for (const token of ['inner','內功','outer','外功','observe','觀察','speech','口才','body','體魄','tech','技巧','mind','智識']) must(labels, token, 'Chinese skill labels');

function merge(base, patch) {
  const map = new Map((base || []).map(x => [x.id || x.passage_code || x.npc_code || x.event_code, x]));
  for (const x of patch || []) map.set(x.id || x.passage_code || x.npc_code || x.event_code, x);
  return [...map.values()];
}
const passages = merge(bundle.passages, extension.passages);
const relationships = merge(bundle.relationships, extension.relationships);
const events = merge(bundle.event_pools, extension.event_pools);
if (!bundle.metadata || bundle.metadata.project_code !== 'DAGO') throw new Error('bundle metadata.project_code must be DAGO');
if (!Array.isArray(passages) || passages.length < 12) throw new Error('merged bundle needs at least 12 passages');
if (!Array.isArray(relationships) || relationships.length < 5) throw new Error('merged bundle needs at least 5 relationships');
if (!Array.isArray(events) || events.length < 4) throw new Error('merged bundle needs at least 4 event_pool entries');

console.log('Playable architecture validation passed for 1.14.2-dol-select-combat.');
