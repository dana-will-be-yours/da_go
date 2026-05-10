(()=>{
'use strict';
const VERSION='1.13.0-events';
function stat(st,key){return Number(st?.stats?.[key]||0)}
function hasItem(st,item){return Array.isArray(st?.inventory)&&st.inventory.includes(item)}
function match(event,st){const t=event?.trigger||{};if(t.passage&&t.passage!==st.current_passage)return false;if(t.suspicion_gte!=null&&stat(st,'suspicion')<Number(t.suspicion_gte))return false;if(t.fatigue_lte!=null&&stat(st,'fatigue')>Number(t.fatigue_lte))return false;if(t.flag&&!hasItem(st,t.flag))return false;if(t.time&&st?.stats?.hour!==t.time)return false;return true}
function pick(bundle,st){const used=st.flags&&st.flags.usedEvents?st.flags.usedEvents:{};return (bundle.event_pools||[]).find(e=>e&&e.event_code&&!used[e.event_code]&&match(e,st))||null}
function run(bundle,st){const ev=pick(bundle,st);if(!ev)return null;st.flags=st.flags||{};st.flags.usedEvents=st.flags.usedEvents||{};st.flags.usedEvents[ev.event_code]=true;if(window.DaGoEffects)window.DaGoEffects.applyAll(st,ev.effects||[]);st.journal=st.journal||[];st.journal.push({turn:st.stats?.turn||0,text:'事件：'+(ev.title||ev.event_code)+'。'+(ev.summary||''),at:new Date().toISOString()});return ev}
window.DaGoEvents=Object.freeze({version:VERSION,match,pick,run});
})();
