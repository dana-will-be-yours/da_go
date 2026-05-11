(()=>{
'use strict';
const VERSION='1.15.2-role-table-extensible-fix';
function cloneRow(row){
  if(!row || typeof row!=='object') return row;
  return Object.assign({}, row);
}
function makeExtensible(){
  const table=window.DaGoRoleRankPhraseTable;
  if(!table || typeof table!=='object') return false;
  if(Object.isExtensible(table)) return true;
  const clone={};
  for(const [code,row] of Object.entries(table)) clone[code]=cloneRow(row);
  window.DaGoRoleRankPhraseTable=clone;
  return true;
}
makeExtensible();
window.DaGoRoleTableExtensibleFix=Object.freeze({version:VERSION,makeExtensible});
})();
