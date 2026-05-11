const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = '1.15.0-balanced-character-preview';

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function write(file, text) {
  fs.writeFileSync(path.join(root, file), text, 'utf8');
}

function removeScript(runtime, scriptPath) {
  const escaped = scriptPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return runtime.replace(new RegExp("\\s*'" + escaped + "'\\s*,?", 'g'), '');
}

let html = read('game.html');
html = html
  .replace(/assets\/game-runtime\.js\?v=[^"]+/g, 'assets/game-runtime.js?v=' + version)
  .replace(/<legend>性格與身分<\/legend>/g, '<legend>身分</legend>')
  .replace(/DoL-like grammar [^<]*/g, '');
write('game.html', html);

let runtime = read('assets/game-runtime.js');
runtime = runtime.replace(/const VERSION='[^']+';/, "const VERSION='" + version + "';");

for (const scriptPath of [
  'assets/game-character-build-zh.js',
  'assets/character-preview-role-zh-only.js',
  'assets/game-no-code-finalizer.js',
  'assets/dago-dol-like-runtime.js'
]) {
  runtime = removeScript(runtime, scriptPath);
}

if (!runtime.includes('assets/character-setup-hotfix-1150.js')) {
  runtime = runtime.replace(
    "'assets/character-balanced-effects.js'",
    "'assets/character-balanced-effects.js','assets/character-setup-hotfix-1150.js'"
  );
}

runtime = runtime
  .replace(/,\s*,/g, ',')
  .replace(/\[\s*,/g, '[')
  .replace(/,\s*\]/g, ']')
  .replace(/mode:'[^']+'/g, "mode:'balanced-character-preview'");

write('assets/game-runtime.js', runtime);

console.log('patched public runtime for ' + version);