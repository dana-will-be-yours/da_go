(()=>{
'use strict';
const VERSION='1.9.14-staggered-spaced-sidebars';
const MAX_COLUMNS=3;
window.DaGoPreloadSidebarDensityFix={version:VERSION,columnsPerTrack:MAX_COLUMNS,sentencePadding:'fullwidth-space',staggered:true};
const style=document.createElement('style');
style.textContent=`
.dago-vertical-log{width:min(24rem,21vw)!important;}
.dago-vertical-track{gap:3.4rem!important;padding:0 3.2rem!important;align-items:flex-start!important;}
.dago-vcol{font-size:clamp(1rem,1.18vw,1.42rem)!important;line-height:1.86!important;letter-spacing:.2em!important;white-space:nowrap!important;}
.dago-vertical-log.left .dago-vcol:nth-child(1){opacity:.82!important;}
.dago-vertical-log.left .dago-vcol:nth-child(2){opacity:.62!important;}
.dago-vertical-log.left .dago-vcol:nth-child(3){opacity:.74!important;}
.dago-vertical-log.right .dago-vcol:nth-child(1){opacity:.72!important;}
.dago-vertical-log.right .dago-vcol:nth-child(2){opacity:.84!important;}
.dago-vertical-log.right .dago-vcol:nth-child(3){opacity:.58!important;}
@media(max-width:1160px){.dago-vertical-log{width:13.2rem!important;}.dago-vertical-track{gap:2rem!important;padding:0 1.85rem!important;}.dago-vcol{font-size:1rem!important;line-height:1.8!important;}}
@media(max-width:820px){.dago-vertical-track{gap:1.25rem!important;padding:0 1.05rem!important;}.dago-vcol{font-size:.95rem!important;}}
`;
document.head.appendChild(style);
function splitSentences(text){
  return String(text||'').split(/　+/).map(s=>s.trim()).filter(Boolean);
}
function rotate(arr,n){
  if(!arr.length)return arr;
  const k=((n%arr.length)+arr.length)%arr.length;
  return arr.slice(k).concat(arr.slice(0,k));
}
function spaced(parts){
  return parts.map(s=>'　　'+s+'　　').join('　　　　　');
}
function apply(){
  document.querySelectorAll('.dago-vertical-log').forEach((side,sideIndex)=>{
    const sideIsRight=side.classList.contains('right');
    side.querySelectorAll('.dago-vertical-track').forEach((track,trackIndex)=>{
      const cols=[...track.querySelectorAll('.dago-vcol')];
      cols.forEach((col,i)=>{
        if(i>=MAX_COLUMNS){col.remove();return;}
        if(col.dataset.staggeredSpaced==='1')return;
        const parts=splitSentences(col.textContent);
        const shift=(sideIsRight?5:2)+(trackIndex*4)+(i*3);
        const ordered=rotate(parts,shift);
        col.textContent=spaced(ordered);
        const offsetsLeft=[0,15,31];
        const offsetsRight=[22,6,38];
        const base=(sideIsRight?offsetsRight:offsetsLeft)[i]||0;
        const extra=trackIndex?9:0;
        col.style.transform='translateY('+(base+extra)+'rem)';
        col.dataset.staggeredSpaced='1';
      });
    });
  });
}
apply();
const obs=new MutationObserver(apply);
obs.observe(document.documentElement,{childList:true,subtree:true});
setTimeout(()=>obs.disconnect(),12000);
})();
