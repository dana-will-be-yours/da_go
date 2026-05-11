(()=>{
'use strict';
const VERSION='1.14.0-chinese-simple-combat';
const TEXT_MAP=new Map([
 ['Runtime 錯誤','執行錯誤'],['Runtime error','執行錯誤'],['Error','錯誤'],
 ['deck','式囊'],['Deck','式囊'],['card','式牌'],['Card','式牌'],['hand','手式'],['discard','棄式'],
 ['combat','衝突'],['Combat','衝突'],['body','體魄'],['tech','技巧'],['mind','心識'],
 ['observe','觀察'],['speech','口才'],['outer','外功'],['study','學識'],['slash','斬擊'],['pierce','刺擊'],['strike','打擊'],['light','輕身'],['medicine','醫術'],
 ['trust','信任'],['favor','好感'],['fear','畏懼'],['suspicion','疑心'],['fatigue','疲勞'],['hunger','飢餓'],['coin','錢'],['hpMax','氣血上限'],['hp','氣血']
]);
const SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','OPTION']);
function replaceVisibleText(text){let out=String(text);for(const [from,to] of TEXT_MAP)out=out.split(from).join(to);return out}
function walk(node){if(!node)return;if(node.nodeType===3){const next=replaceVisibleText(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;return}if(node.nodeType!==1||SKIP.has(node.tagName))return;for(const child of Array.from(node.childNodes))walk(child)}
function localizeAttributes(root){if(!root.querySelectorAll)return;root.querySelectorAll('[title],[aria-label]').forEach(el=>{for(const attr of ['title','aria-label']){const value=el.getAttribute(attr);if(value)el.setAttribute(attr,replaceVisibleText(value))}})}
function apply(){walk(document.body);localizeAttributes(document.body)}
function boot(){apply();const observer=new MutationObserver(()=>apply());observer.observe(document.body,{childList:true,subtree:true,characterData:true});document.body.classList.add('dago-zh-tw-guard-ready')}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoZhTwGuard=Object.freeze({version:VERSION,apply});
})();
