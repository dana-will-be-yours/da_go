const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'game.html');
let html = fs.readFileSync(file, 'utf8');

html = html
  .replaceAll('1.12.1-perf', '1.12.7-panel-check')
  .replaceAll('1.12.4-combat', '1.12.7-panel-check')
  .replaceAll('1.12.5-restored-ui', '1.12.7-panel-check')
  .replaceAll('1.12.6-full-ui', '1.12.7-panel-check');

fs.writeFileSync(file, html, 'utf8');
console.log('updated game.html runtime version to 1.12.7-panel-check');
