(()=>{
'use strict';
const VERSION='1.14.1-start-hotfix';
const MAP=[['deck','式囊'],['Deck','式囊'],['card','式牌'],['Card','式牌'],['hand','手式'],['discard','棄式'],['combat','衝突'],['Combat','衝突'],['body','體魄'],['tech','技巧'],['mind','心識'],['observe','觀察'],['speech','口才'],['outer','外功'],['study','學識'],['slash','斬擊'],['pierce','刺擊'],['strike','打擊'],['light','輕身'],['medicine','醫術'],['trust','信任'],['suspicion','疑心'],['fatigue','疲勞'],['hunger','飢餓'],['coin','錢'],['hpMax','氣血上限'],['hp','氣血']];
const SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','OPTION']);
function repl(s){let out=String(s||'');for(const r of MAP)out=out.split(r[0]).join(r[1]);return out}
function walk(n,box){if(!n||box.count>700)return;if(n.nodeType===3){const v=repl(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;box.count++;return}if(n.nodeType!==1||SKIP.has(n.tagName))return;for(const c of Array.from(n.childNodes))walk(c,box)}
function apply(root){walk(root||document.body,{count:0})}
function boot(){apply(document.body);document.body.classList.add('dago-zh-tw-guard-ready')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoZhTwGuard=Object.freeze({version:VERSION,apply});
})();
