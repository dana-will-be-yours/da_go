(()=>{
'use strict';
const ROLL={4:1,5:4,6:10,7:16,8:19,9:16,10:10,11:4,12:1};
function roll4d3(){let total=0;for(let i=0;i<4;i++)total+=1+Math.floor(Math.random()*3);return total}
function attrMod(st,skill){const attr=window.DaGoRules?.skillAttr(skill)||'mind';return Number(st.attrs?.[attr]||0)}
function skillValue(st,skill){return Number(st.skills?.[skill]||0)}
function statusPenalty(st){let p=0;const s=st.stats||{};if(s.spirit<20)p-=1;if(s.composure<20)p-=1;if(s.suspicion>70)p-=1;if(s.fatigue>70)p-=1;if(s.hunger>70)p-=1;return p}
function chance(skill,dc,st){if(!skill||!dc)return null;let wins=0;const mod=attrMod(st,skill)+skillValue(st,skill)+statusPenalty(st);for(const [roll,count] of Object.entries(ROLL)){if(Number(roll)+mod>=dc)wins+=count}return Math.round(wins/81*100)}
function test(check,st){if(!check||!check.skill||!check.dc)return {used:false,success:true,total:null,detail:null};const base=roll4d3();const mod=attrMod(st,check.skill)+skillValue(st,check.skill)+statusPenalty(st);const total=base+mod;return {used:true,success:total>=Number(check.dc),roll:base,modifier:mod,total,dc:Number(check.dc),skill:check.skill,chance:chance(check.skill,Number(check.dc),st)}}
window.DaGoChecks=Object.freeze({roll4d3,attrMod,skillValue,statusPenalty,chance,test});
})();
