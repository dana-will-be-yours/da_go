const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const runtime = fs.readFileSync(path.join(root, 'assets/dago-dol-like-runtime.js'), 'utf8');
for (const token of ['ROLE_SKILLS','BG_SKILLS','renderCharacterForm','renderPreview','STORY_SOURCE','<<link','skill:office','dc:10','[[']) {
  if (!runtime.includes(token)) throw new Error('playable runtime missing ' + token);
}
for (const token of ['origin','trait','attributePlan','specialOrigin','每一項身分、出身地、性格、屬性點配置、特殊身世皆提供 4 點技能值']) {
  if (!runtime.includes(token)) throw new Error('character balance missing ' + token);
}
if (runtime.includes('MutationObserver')) throw new Error('legacy watcher still exists');
new vm.Script(runtime, { filename: 'assets/dago-dol-like-runtime.js' });
console.log('Playable DoL-like architecture validation passed for 1.16.0-dol-like-playable.');
