(()=>{
'use strict';
const V='1.12.2-csp-boot';
const $=id=>document.getElementById(id);
function boot(){
  const form=$('startForm');
  const start=$('startPanel');
  const play=$('playPanel');
  const title=$('passageTitle');
  const meta=$('passageMeta');
  const text=$('passageText');
  const choices=$('choiceList');
  const overview=$('overviewBox');
  if(!form||!start||!play)return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const name=($('playerName')&&$('playerName').value)||'旅人';
    start.hidden=true;
    play.hidden=false;
    if(title)title.textContent='常山縣東門';
    if(meta)meta.textContent='天津郡 / 常山縣東門';
    if(text)text.innerHTML='<p>大興十年，常山縣東門外人聲雜沓。你已成功進入遊戲。</p>';
    if(choices)choices.innerHTML='<button type="button">去告示牆看今日招工</button><button type="button">到客棧問掌櫃</button>';
    if(overview)overview.innerHTML='<p>'+name+'</p><p>Runtime '+V+'</p>';
  });
  document.body.classList.add('dago-ready');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
