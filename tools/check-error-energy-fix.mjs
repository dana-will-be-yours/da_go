import fs from 'node:fs';
const runtime=fs.readFileSync('assets/game-runtime.js','utf8');
const balanced=fs.readFileSync('assets/character-balanced-effects.js','utf8');
const extensible=fs.readFileSync('assets/role-table-extensible-fix.js','utf8');
const failures=[];
if(!runtime.includes("assets/role-table-extensible-fix.js")) failures.push('runtime 未載入 role-table-extensible-fix.js');
if(!runtime.includes("assets/character-canonical-balance-fix.js")) failures.push('runtime 未載入 character-canonical-balance-fix.js');
if(!balanced.includes('1.15.2-no-observer-loop')) failures.push('character-balanced-effects.js 版本不正確');
if(/new\s+MutationObserver/.test(balanced)) failures.push('character-balanced-effects.js 仍含 MutationObserver，可能造成預覽重繪迴圈');
if(!extensible.includes('Object.isExtensible')) failures.push('role-table-extensible-fix.js 未檢查 Object.isExtensible');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('error-energy-fix 檢查通過');
