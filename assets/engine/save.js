(()=>{
'use strict';
function save(st){return window.DaGoState.save(st)}
function load(){return window.DaGoState.load()}
function clear(){return window.DaGoState.clear()}
function download(st){const blob=new Blob([JSON.stringify(st,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='da_go_save_'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url)}
async function importFile(file){const text=await file.text();return window.DaGoState.migrate(JSON.parse(text))}
window.DaGoSave=Object.freeze({save,load,clear,download,importFile});
})();
