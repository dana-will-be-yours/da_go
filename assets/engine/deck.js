(()=>{
'use strict';
const VERSION='1.13.1-deck';
function clone(x){return JSON.parse(JSON.stringify(x))}
function shuffle(list){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function catalog(){return (window.COMBAT_CARDS||window.DaGoCombatCards||[]).slice()}
function cardByCode(code){return catalog().find(c=>c.code===code||c.id===code)||null}
function ensure(st){st.deckBuild=st.deckBuild||{};st.deckBuild.ownedCards=Array.isArray(st.deckBuild.ownedCards)?st.deckBuild.ownedCards:catalog().map(c=>c.code||c.id).filter(Boolean);st.deckBuild.deckCodes=Array.isArray(st.deckBuild.deckCodes)&&st.deckBuild.deckCodes.length?st.deckBuild.deckCodes:st.deckBuild.ownedCards.slice(0,8);st.deck=st.deck||{};st.deck.drawPile=Array.isArray(st.deck.drawPile)?st.deck.drawPile:[];st.deck.hand=Array.isArray(st.deck.hand)?st.deck.hand:[];st.deck.discard=Array.isArray(st.deck.discard)?st.deck.discard:[];return st.deckBuild}
function rebuild(st){const build=ensure(st);st.deck.drawPile=shuffle(build.deckCodes.map(cardByCode).filter(Boolean).map(clone));st.deck.hand=[];st.deck.discard=[];return st.deck}
function draw(st,count=3){ensure(st);if(!st.deck.drawPile.length&&!st.deck.discard.length)rebuild(st);const drawn=[];for(let i=0;i<count;i++){if(!st.deck.drawPile.length&&st.deck.discard.length){st.deck.drawPile=shuffle(st.deck.discard);st.deck.discard=[]}const card=st.deck.drawPile.shift();if(!card)break;st.deck.hand.push(card);drawn.push(card)}return drawn}
function discardHand(st){ensure(st);st.deck.discard.push(...st.deck.hand);st.deck.hand=[]}
function setDeck(st,codes){const build=ensure(st);const owned=new Set(build.ownedCards);build.deckCodes=(codes||[]).filter(c=>owned.has(c)).slice(0,12);if(!build.deckCodes.length)build.deckCodes=build.ownedCards.slice(0,8);rebuild(st);return build}
function deckBuilderHtml(st){const build=ensure(st);const selected=new Set(build.deckCodes);return '<section class="deck-builder"><h3>式囊編排</h3><p>已選 '+build.deckCodes.length+' 張</p>'+build.ownedCards.map(code=>'<label><input type="checkbox" data-deck-card="'+code+'" '+(selected.has(code)?'checked':'')+'> '+code+'</label>').join('')+'</section>'}
window.DaGoDeck=Object.freeze({version:VERSION,catalog,cardByCode,ensure,rebuild,draw,discardHand,setDeck,deckBuilderHtml});
})();
