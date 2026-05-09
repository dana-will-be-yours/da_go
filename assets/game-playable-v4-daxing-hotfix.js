(()=>{
'use strict';
const FROM='大國二十年',TO='大興二十年',STORE='daGoPlayV4';
const fixText=s=>String(s).replaceAll(FROM,TO);
const patchStorage=()=>{
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
    if(k===STORE||k===STORE+'.manual')v=fixText(v);
    return original.call(this,k,v);
  };
  [STORE,STORE+'.manual'].forEach(k=>{
    const v=localStorage.getItem(k);
    if(v&&v.includes(FROM))localStorage.setItem(k,fixText(v));
  });
};
const patchExport=()=>{
  if(navigator.clipboard&&navigator.clipboard.writeText){
    const write=navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText=t=>write(fixText(t));
  }
  const NativeBlob=window.Blob;
  window.Blob=function(parts,opts){
    if(Array.isArray(parts))parts=parts.map(p=>typeof p==='string'?fixText(p):p);
    return new NativeBlob(parts,opts);
  };
  window.Blob.prototype=NativeBlob.prototype;
};
const fixDom=()=>{
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walk.nextNode())nodes.push(walk.currentNode);
  nodes.forEach(n=>{if(n.nodeValue&&n.nodeValue.includes(FROM))n.nodeValue=fixText(n.nodeValue)});
};
patchStorage();
patchExport();
const script=document.createElement('script');
script.src='assets/game-playable-v4.js?v=1.7.1-daxing-era';
script.onload=()=>{
  fixDom();
  const form=document.getElementById('startForm');
  if(form)form.addEventListener('submit',()=>setTimeout(fixDom,0),true);
  new MutationObserver(fixDom).observe(document.body,{childList:true,subtree:true,characterData:true});
};
document.body.appendChild(script);
})();
