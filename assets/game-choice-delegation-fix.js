(()=>{
'use strict';
function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn()}
ready(()=>{
  const list=document.getElementById('choiceList');
  if(!list||list.dataset.delegationFix)return;
  list.dataset.delegationFix='1';
  list.addEventListener('click',event=>{
    const btn=event.target&&event.target.closest?event.target.closest('[data-choice]'):null;
    if(!btn||!list.contains(btn))return;
    if(btn.dataset.delegationClicked==='1')return;
    btn.dataset.delegationClicked='1';
    setTimeout(()=>{delete btn.dataset.delegationClicked},0);
    if(typeof btn.onclick==='function')return;
    btn.dispatchEvent(new MouseEvent('click',{bubbles:false,cancelable:true,view:window}));
  },true);
});
})();
