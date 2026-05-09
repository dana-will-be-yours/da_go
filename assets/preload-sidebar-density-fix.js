(()=>{
'use strict';
const VERSION='1.9.13-sentence-spaced-sidebars';
window.DaGoPreloadSidebarDensityFix={version:VERSION,columnsPerTrack:4,sentencePadding:'ideographic-space'};
const style=document.createElement('style');
style.textContent=`
.dago-vertical-log{width:min(24rem,21vw)!important;}
.dago-vertical-track{gap:2.8rem!important;padding:0 2.8rem!important;}
.dago-vcol{font-size:clamp(1.02rem,1.22vw,1.48rem)!important;line-height:1.78!important;letter-spacing:.18em!important;}
@media(max-width:1160px){.dago-vertical-track{gap:1.75rem!important;padding:0 1.65rem!important;}.dago-vcol{font-size:1rem!important;}}
@media(max-width:820px){.dago-vertical-track{gap:1.1rem!important;padding:0 1rem!important;}}
`;
document.head.appendChild(style);
function addSentencePadding(col){
  if(col.dataset.sentenceSpaced==='1')return;
  const parts=col.textContent.split('　　').map(s=>s.trim()).filter(Boolean);
  if(parts.length)col.textContent=parts.map(s=>'　'+s+'　').join('　　');
  col.dataset.sentenceSpaced='1';
}
function apply(){
  document.querySelectorAll('.dago-vertical-track').forEach(track=>{
    const cols=[...track.querySelectorAll('.dago-vcol')];
    cols.forEach((col,i)=>{ if(i>=4) col.remove(); else addSentencePadding(col); });
  });
}
apply();
const obs=new MutationObserver(apply);
obs.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>obs.disconnect(),10000);
})();
