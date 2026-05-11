const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = '1.15.5-stable-preview-pages';

function write(file, text) {
  fs.writeFileSync(path.join(root, file), text, 'utf8');
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

let html = read('game.html');
html = html.replace(/assets\/game-runtime\.js\?v=[^"]+/g, 'assets/game-runtime.js?v=' + version);
write('game.html', html);

let runtime = read('assets/game-runtime.js');
runtime = runtime.replace(/const VERSION='[^']+';/, "const VERSION='" + version + "';");
runtime = runtime.replace(/'assets\/game-character-build-zh\.js',?/g, '');
runtime = runtime.replace(/'assets\/game-no-code-finalizer\.js',?/g, '');
runtime = runtime.replace(/'assets\/character-preview-role-zh-only\.js',?/g, '');
write('assets/game-runtime.js', runtime);

console.log('patched public runtime for ' + version);
