
(()=>{
'use strict';
const VERSION='1.16.0-dol-like-playable';
const STORE='daGoDolLikeSaveV1160';
const RANKS='戊丁丙乙甲';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SKILL_NAMES={inner:'內功',outer:'外功',light:'輕功',swim:'水性',pierce:'刺擊',slash:'斬擊',strike:'打擊',sleight:'巧手',craft:'工藝',appraise:'辨別',medicine:'醫術',pharma:'調藥',hide:'躲藏',observe:'觀察',listen:'聆聽',office:'政務',threat:'威嚇',art:'表達',elegance:'雅藝',resource:'資源',wealth:'財富',court:'官場',jianghu:'江湖',geo:'地理',nature:'自然',history:'歷史',study:'學藝',will:'意志',language:'語言',empathy:'共情',speech:'口才'};
const ROLE_OPTIONS=[['yamen_clerk','胥吏'],['runner','皂快'],['constable','捕役'],['soldier','介冑'],['urban_household','坊郭戶'],['workshop','作坊戶'],['teahouse','茶棚幫閒'],['market_broker','市牙人'],['rural_farmer','農圃'],['hunter','採戶'],['fisher','疍戶'],['literatus','士子'],['copyist','抄書人'],['strongman','壯士'],['escort','鏢師'],['dock_labor','埠頭力夫'],['wanderer','雲遊士'],['merchant','行商'],['medic','坊郭醫'],['disciple','門派弟子']];
const ROLE_SKILLS={yamen_clerk:['office','study','observe','language'],runner:['observe','light','jianghu','listen'],constable:['observe','outer','strike','threat'],soldier:['outer','slash','strike','will'],urban_household:['speech','resource','observe','jianghu'],workshop:['craft','appraise','resource','study'],teahouse:['listen','speech','jianghu','empathy'],market_broker:['appraise','wealth','speech','listen'],rural_farmer:['nature','outer','resource','will'],hunter:['observe','nature','pierce','hide'],fisher:['swim','nature','listen','outer'],literatus:['study','language','history','elegance'],copyist:['study','appraise','observe','language'],strongman:['outer','strike','threat','will'],escort:['slash','pierce','observe','jianghu'],dock_labor:['outer','resource','listen','will'],wanderer:['hide','jianghu','listen','will'],merchant:['wealth','resource','appraise','speech'],medic:['medicine','pharma','nature','observe'],disciple:['inner','light','pierce','jianghu']};
const ORIGIN_OPTIONS=[['changshan','常山縣本地人'],['tianjin','天津郡郡城'],['hengshui','衡水縣'],['hengwan','珩灣縣'],['cangbei','滄北邑'],['nanjing','南京']];
const TRAIT_OPTIONS=[['calm','冷靜'],['streetwise','熟路'],['silver_tongue','善談'],['sturdy','耐勞'],['upright','雅正'],['reckless','急烈']];
const PLAN_OPTIONS=[['balanced','均衡'],['body','體魄'],['tech','技巧'],['mind','智識'],['social','交際'],['travel','行路']];
const SPECIAL_OPTIONS=[['none','無'],['taihu_wei','太湖魏家旁支'],['jinling_yang','金陵陽家旁支'],['cangbei_bei','滄北北家舊識'],['qishan_ye','岐山葉氏'],['kunlun_chu','蓬萊崑崙外系'],['wanminhui','萬民會暗語']];
const BG_SKILLS={changshan:['geo','nature','jianghu','listen'],tianjin:['court','speech','resource','office'],hengshui:['geo','nature','resource','will'],hengwan:['swim','resource','listen','geo'],cangbei:['jianghu','will','history','listen'],nanjing:['court','study','elegance','speech'],calm:['will','observe','empathy','study'],streetwise:['jianghu','listen','observe','speech'],silver_tongue:['speech','empathy','listen','elegance'],sturdy:['outer','will','nature','resource'],upright:['elegance','empathy','will','speech'],reckless:['slash','threat','outer','will'],balanced:['outer','observe','study','speech'],body:['outer','inner','strike','will'],tech:['sleight','observe','craft','appraise'],mind:['study','history','language','observe'],social:['speech','empathy','elegance','listen'],travel:['light','geo','nature','jianghu'],none:['observe','will','speech','listen'],taihu_wei:['wealth','court','history','speech'],jinling_yang:['study','speech','elegance','language'],cangbei_bei:['jianghu','history','will','listen'],qishan_ye:['slash','outer','will','observe'],kunlun_chu:['pierce','light','elegance','inner'],wanminhui:['jianghu','listen','hide','speech']};
const STORY_SOURCE=`
:: Gate
<<set $place to "常山縣東門">>
大興十年，天津郡常山縣。東門外的土路還帶著晨霧，告示牆、客棧、市集與縣衙都在一日行程之內。

你要在此地生活一年。所有行動都會留下日誌，可回寫為語料資料。

<<link "去告示牆看今日招工" "WorkBoard" skill:observe dc:8 stat:fatigue:+1 stat:hunger:+1>><</link>>
<<link "到驛路客棧問掌櫃" "Inn" skill:speech dc:8 stat:fatigue:+1>><</link>>
<<link "去市集聽米價" "Market" skill:listen dc:9 stat:fatigue:+1>><</link>>
<<link "回橋北租屋整理行囊" "Lodging" stat:spirit:+1>><</link>>

:: WorkBoard
牆上貼著米倉搬運、修車棚、客棧灑掃與縣衙抄錄幾張舊告示。梁三站在牆邊，替人牽線。

<<link "應米倉搬運短工" "WorkBoard" skill:outer dc:8 stat:coin:+5 stat:fatigue:+8 stat:hunger:+5 journal:接下米倉短工>><</link>>
<<link "替梁三抄一張工簿" "Yamen" skill:office dc:10 stat:coin:+3 stat:fatigue:+2 item:工簿抄件>><</link>>
<<link "回東門" "Gate" stat:fatigue:+1>><</link>>

:: Inn
客棧掌櫃姚娘把算盤放在櫃上。外地客不多，鄉里人卻常來此說事。

<<link "向姚娘問灑掃差事" "Inn" skill:speech dc:8 stat:coin:+3 stat:fatigue:+4 item:姚娘的照應>><</link>>
<<link "買一碗熱湯餅" "Inn" need:coin:2 stat:coin:-2 stat:hunger:-18 stat:spirit:+2>><</link>>
<<link "回東門" "Gate" stat:fatigue:+1>><</link>>

:: Market
市集沿著石渠鋪開，賣柴、賣藥、賣粗布的人各占一角。若要在此地站住腳，先得懂得哪句話該接，哪句話該放過。

<<link "聽貨郎講鄰村米價" "Market" skill:listen dc:10 item:米價傳聞 stat:fatigue:+1>><</link>>
<<link "買油紙與炭筆" "Market" need:coin:2 stat:coin:-2 item:油紙炭筆>><</link>>
<<link "往縣衙門廊打聽差事" "Yamen" skill:office dc:10 stat:suspicion:+1>><</link>>
<<link "回東門" "Gate" stat:fatigue:+1>><</link>>

:: Yamen
縣衙門廊不寬，紙卷與潮氣混在一起。書吏唐簡看你手腳還算俐落，問你可願抄幾張舊案目錄。

<<link "抄錄舊案目錄" "Yamen" skill:office dc:10 stat:coin:+4 stat:fatigue:+3 stat:suspicion:+1 item:舊案目錄摘記>><</link>>
<<link "向唐簡打聽縣中人事" "Yamen" skill:speech dc:11 stat:suspicion:+1 item:縣中人事>><</link>>
<<link "離開縣衙" "Gate" stat:fatigue:+1>><</link>>

:: Lodging
橋北租屋只有一張窄榻、一盞油燈與幾件行囊。窗外能聽見更夫走過石渠橋。

<<if $fatigue >= 30>>你很疲憊。再硬撐會讓檢定變差。<</if>>
<<if $hunger >= 30>>腹中空得發疼，最好先找吃食。<</if>>

<<link "睡到次日清晨" "Gate" stat:spirit:+8 stat:composure:+4 stat:fatigue:-40 stat:hunger:+4 stat:suspicion:-1 journal:在橋北租屋休息>><</link>>
<<link "整理今日聽來的話" "Lodging" skill:study dc:8 item:常山生活札記>><</link>>
<<link "回東門" "Gate" stat:fatigue:+1>><</link>>
`;
function pairsToMap(rows){return Object.fromEntries(rows);}const ROLE_NAME=pairsToMap(ROLE_OPTIONS),ORIGIN_NAME=pairsToMap(ORIGIN_OPTIONS),TRAIT_NAME=pairsToMap(TRAIT_OPTIONS),PLAN_NAME=pairsToMap(PLAN_OPTIONS),SPECIAL_NAME=pairsToMap(SPECIAL_OPTIONS);
function parseStory(source){const passages={};let current=null,buf=[];for(const line of source.split(/\r?\n/)){const m=line.match(/^::\s*(.+)$/);if(m){if(current)passages[current]=buf.join('\n').trim();current=m[1].trim();buf=[];}else if(current){buf.push(line);}}if(current)passages[current]=buf.join('\n').trim();return passages;}
const PASSAGES=parseStory(STORY_SOURCE);
function defaultState(){return {version:VERSION,passage:'Gate',turn:0,day:1,hour:'卯時',player:null,stats:{spirit:50,composure:50,suspicion:0,fatigue:0,hunger:0,coin:12,hp:10,hpMax:10},skills:{},items:['素布行囊'],journal:[],history:[],flags:{}};}
let state=load();function load(){try{return JSON.parse(localStorage.getItem(STORE)||'null')||defaultState();}catch{return defaultState();}}
function save(){localStorage.setItem(STORE,JSON.stringify(state));}
function clear(){localStorage.removeItem(STORE);state=defaultState();renderAll();}
function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0));}
function addStat(k,v){if(!(k in state.stats))state.stats[k]=0;state.stats[k]=clamp(Number(state.stats[k])+Number(v),k==='coin'?-99:0,k==='coin'?999:100);}
function roll4d3(){let n=0;for(let i=0;i<4;i++)n+=1+Math.floor(Math.random()*3);return n;}
function applySkill(k,v){state.skills[k]=clamp((Number(state.skills[k])||0)+Number(v||1),0,5);}
function selectedRowsFromForm(){const f=$('characterForm');if(!f)return [];const fd=new FormData(f);const roles=fd.getAll('roles');const roleRows=roles.map(code=>({kind:'身分',code,name:ROLE_NAME[code]||code,skills:(ROLE_SKILLS[code]||['observe','speech','listen','will']).slice(0,4)}));const bg=[['origin','出身地',ORIGIN_NAME],['trait','性格',TRAIT_NAME],['attributePlan','屬性點配置',PLAN_NAME],['specialOrigin','特殊身世',SPECIAL_NAME]].map(([field,kind,names])=>{const code=String(fd.get(field)||'none');return {kind,code,name:names[code]||code,skills:(BG_SKILLS[code]||['observe','speech','listen','will']).slice(0,4)};});return roleRows.concat(bg);}
function recomputeCharacterSkills(rows){state.skills={};for(const row of rows){for(const k of row.skills)applySkill(k,1);}}
function skillText(list){return list.map(k=>`${SKILL_NAMES[k]||k} 1`).join('、');}
function rankSummary(rows){const c={};return rows.filter(r=>r.kind==='身分').map(r=>{c[r.code]=(c[r.code]||0)+1;return `${r.name}${RANKS[Math.max(0,Math.min(4,c[r.code]-1))]}`;}).join('、');}
function renderCharacterForm(){const start=$('startPanel');$('playPanel').hidden=true;start.hidden=false;const opt=(rows,sel)=>rows.map(([v,t])=>`<option value="${esc(v)}" ${v===sel?'selected':''}>${esc(t)}</option>`).join('');const radio=(name,rows,sel)=>rows.map(([v,t])=>`<label><input type="radio" name="${name}" value="${esc(v)}" ${v===sel?'checked':''}> ${esc(t)}</label>`).join('');start.innerHTML=`<h1>大國年代記</h1><p class="version">類 DoL 文法可遊玩版｜${VERSION}</p><form id="characterForm" class="start-form"><label>角色名<input id="playerName" name="playerName" type="text" value="常山人" maxlength="16" autocomplete="off"></label><fieldset><legend>身分</legend><p class="field-help">五項身分可重複；每一項固定給 4 點技能值。</p><div class="role-stack-grid">${[0,1,2,3,4].map((i)=>`<label>第 ${i+1} 身分<select name="roles">${opt(ROLE_OPTIONS,['yamen_clerk','wanderer','merchant','medic','soldier'][i])}</select></label>`).join('')}</div></fieldset><fieldset><legend>背景</legend><div class="field-group"><span>出身地</span>${radio('origin',ORIGIN_OPTIONS,'changshan')}</div><div class="field-group"><span>性格</span>${radio('trait',TRAIT_OPTIONS,'calm')}</div><div class="field-group"><span>屬性點配置</span>${radio('attributePlan',PLAN_OPTIONS,'balanced')}</div><div class="field-group"><span>特殊身世</span>${radio('specialOrigin',SPECIAL_OPTIONS,'none')}</div><div id="buildPreview" class="build-preview"></div></fieldset><div class="start-actions"><button id="randomizeCharacter" type="button">隨機化</button><button id="startButton" type="submit">開始遊戲</button></div></form>`;const f=$('characterForm');f.addEventListener('input',renderPreview,true);f.addEventListener('change',renderPreview,true);f.addEventListener('submit',ev=>{ev.preventDefault();const rows=selectedRowsFromForm();state=defaultState();state.player={name:String(new FormData(f).get('playerName')||'常山人').slice(0,16),roles:rows.filter(r=>r.kind==='身分').map(r=>r.code),roleNames:rows.filter(r=>r.kind==='身分').map(r=>r.name),backgroundRows:rows.filter(r=>r.kind!=='身分'),characterRows:rows};recomputeCharacterSkills(rows);state.journal.push({turn:0,text:`角色建立：${rankSummary(rows)}`,at:new Date().toISOString()});save();renderAll();});$('randomizeCharacter').addEventListener('click',()=>{const selects=[...f.querySelectorAll('select[name="roles"]')];for(const sel of selects)sel.selectedIndex=Math.floor(Math.random()*sel.options.length);for(const name of ['origin','trait','attributePlan','specialOrigin']){const radios=[...f.querySelectorAll(`input[name="${name}"]`)];radios[Math.floor(Math.random()*radios.length)].checked=true;}renderPreview();});renderPreview();renderOverview();}
function renderPreview(){const box=$('buildPreview');if(!box)return;const rows=selectedRowsFromForm();box.innerHTML=`<p><b>身分：</b>${esc(rankSummary(rows))}</p><section class="character-balanced-effects-block"><h4>身分與背景加成</h4>${rows.map(r=>`<p>${esc(r.kind)}「${esc(r.name)}」：${esc(skillText(r.skills))}；特技：${esc(r.name)}見聞</p>`).join('')}<p>平衡規則：每一項身分、出身地、性格、屬性點配置、特殊身世皆提供 4 點技能值。</p></section>`;}
function parseParams(raw){const out={effects:[],need:null};const parts=String(raw||'').trim().split(/\s+/).filter(Boolean);for(const p of parts){let m;if(m=p.match(/^skill:([\w_]+)$/))out.skill=m[1];else if(m=p.match(/^dc:(\d+)$/))out.dc=Number(m[1]);else if(m=p.match(/^stat:([\w_]+):([+-]?\d+)$/))out.effects.push({type:'stat',key:m[1],value:Number(m[2])});else if(m=p.match(/^item:([^\s]+)$/))out.effects.push({type:'item',value:m[1]});else if(m=p.match(/^journal:([^\s]+)$/))out.effects.push({type:'journal',value:m[1]});else if(m=p.match(/^need:([\w_]+):(\d+)$/))out.need={key:m[1],value:Number(m[2])};}return out;}
function evalCond(expr){return String(expr).replace(/\$([a-zA-Z_][\w]*)/g,(_,k)=>JSON.stringify(state.stats[k]??state.flags[k]??0));}
function processText(text){let out=text.replace(/<<set\s+\$([\w]+)\s+to\s+"([^"]*)"\s*>>/g,(_,k,v)=>{state.flags[k]=v;return '';});out=out.replace(/<<if\s+([^>]+)>>([\s\S]*?)<\/if>>/g,(_,cond,body)=>{try{return Function('return ('+evalCond(cond).replace(/\bis\b/g,'===').replace(/\bgt\b/g,'>').replace(/\bgte\b/g,'>=').replace(/\blt\b/g,'<').replace(/\blte\b/g,'<=')+')')()?body:'';}catch{return '';}});return out;}
let currentChoices=[];
function renderPassage(){const title=state.passage;let src=PASSAGES[title]||PASSAGES.Gate;currentChoices=[];src=processText(src);src=src.replace(/<<link\s+"([^"]+)"\s+"([^"]+)"([^>]*)>><<\/link>>/g,(_,text,target,raw)=>{currentChoices.push(Object.assign({text,target},parseParams(raw)));return '';});src=src.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g,(_,text,target)=>{currentChoices.push({text,target,effects:[]});return '';});$('startPanel').hidden=true;$('playPanel').hidden=false;$('passageTitle').textContent=title;$('passageMeta').textContent=`大興十年｜第 ${state.day} 日 ${state.hour}｜第 ${state.turn} 行動`;$('passageText').innerHTML='<p>'+esc(src.trim()).replace(/\n\s*\n/g,'</p><p>')+'</p>';$('choiceList').innerHTML=currentChoices.map((c,i)=>{const check=c.skill?` <span class="choice-meta">${esc(SKILL_NAMES[c.skill]||c.skill)} / 難度 ${esc(c.dc)}</span>`:'';const locked=c.need&&Number(state.stats[c.need.key]||0)<c.need.value;return `<button type="button" data-choice="${i}" class="link-internal${locked?' link-disabled':''}" ${locked?'disabled':''}>${esc(i+1)}. ${esc(c.text)}${check}${locked?`<span class="choice-lock"> 需要 ${esc(c.need.key)} ${esc(c.need.value)}</span>`:''}</button>`;}).join('');$('choiceList').querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>choose(Number(btn.dataset.choice))));$('passageFooter').textContent=`DoL-like passage grammar runtime ${VERSION}`;renderOverview();}
function choose(i){const c=currentChoices[i];if(!c)return;let ok=true,total=null,roll=null;if(c.skill&&c.dc){roll=roll4d3();total=roll+Number(state.skills[c.skill]||0);ok=total>=Number(c.dc);if(ok)applySkill(c.skill,1);}if(ok){for(const e of c.effects||[]){if(e.type==='stat')addStat(e.key,e.value);if(e.type==='item'&&!state.items.includes(e.value))state.items.unshift(e.value);if(e.type==='journal')state.journal.unshift({turn:state.turn,text:e.value,at:new Date().toISOString()});}}else{addStat('composure',-2);addStat('suspicion',1);}state.history.push({turn:state.turn,from:state.passage,to:c.target,text:c.text,skill:c.skill||null,dc:c.dc||null,roll,total,outcome:ok?'success':'failure',at:new Date().toISOString()});state.journal.unshift({turn:state.turn,text:`${c.text}：${ok?'成功':'失敗'}${c.skill?`（${SKILL_NAMES[c.skill]||c.skill} ${total}/${c.dc}）`:''}`,at:new Date().toISOString()});state.passage=c.target;state.turn++;if(state.turn%4===0)state.day++;save();renderPassage();}
function renderOverview(){const box=$('overviewBox');if(!box)return;if(!state.player){box.innerHTML=`<p><b>尚未建立角色</b></p><p>Runtime ${esc(VERSION)}</p>`;return;}box.innerHTML=`<p><b>${esc(state.player.name)}</b></p><p>${esc((state.player.roleNames||[]).join('、'))}</p><p>錢 ${esc(state.stats.coin)}｜精神 ${esc(state.stats.spirit)}｜疲勞 ${esc(state.stats.fatigue)}｜飢餓 ${esc(state.stats.hunger)}</p><p>物品：${esc(state.items.slice(0,5).join('、')||'無')}</p>`;}
function panelHtml(name){if(name==='attributes'){return `<h3>角色</h3><p>${esc(state.player?.name||'尚未建立角色')}</p><h3>技能值</h3>${Object.entries(state.skills||{}).sort().map(([k,v])=>`<p>${esc(SKILL_NAMES[k]||k)}：${esc(v)}</p>`).join('')||'<p>無</p>'}`;}if(name==='journal')return (state.journal||[]).slice(0,40).map(x=>`<p>${esc(x.text)}</p>`).join('')||'<p>尚無日誌。</p>';if(name==='stats')return `<pre>${esc(JSON.stringify({stats:state.stats,items:state.items,history:state.history.slice(-10)},null,2))}</pre>`;if(name==='rules')return `<p>文法採類 DoL / SugarCube 形式：passage 以 <code>:: Passage</code> 標記，選項使用 <code>&lt;&lt;link "文字" "Passage" skill:office dc:10 stat:coin:+3&gt;&gt;&lt;&lt;/link&gt;&gt;</code>，條件使用 <code>&lt;&lt;if $fatigue &gt;= 30&gt;&gt;</code>。</p><p>每項身分與背景固定提供 4 點技能值；技能上限為 5。</p>`;if(name==='saves')return `<button id="saveNow">保存</button> <button id="resetNow">重開</button> <button id="downloadSave">下載存檔</button>`;return '<p>無內容。</p>';}
function openPanel(name,title){$('overlayTitle').textContent=title;$('overlayContent').innerHTML=panelHtml(name);$('overlayBackdrop').classList.remove('hidden');$('saveNow')?.addEventListener('click',save);$('resetNow')?.addEventListener('click',()=>{clear();$('overlayBackdrop').classList.add('hidden');});$('downloadSave')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='da_go_save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});}
function bind(){document.querySelectorAll('[data-action="panel"]').forEach(btn=>btn.addEventListener('click',()=>openPanel(btn.dataset.panel,btn.textContent)));$('closeOverlay')?.addEventListener('click',()=>$('overlayBackdrop').classList.add('hidden'));}
function renderAll(){if(!state.player)renderCharacterForm();else renderPassage();renderOverview();}
window.DaGoRuntimeManifest=Object.freeze({runtime_name:'da_go_dol_like_runtime',runtime_version:VERSION,mode:'dol-like-passage-grammar',grammar:[':: Passage','<<set $var to value>>','<<if condition>>','<<link "text" "target" skill:office dc:10 stat:coin:+1>>','[[text|target]]']});
window.DaGoDolLikeRuntime=Object.freeze({version:VERSION,passages:PASSAGES,renderAll,clear,get state(){return state;},audit(){const rows=state.player?.characterRows||[];return {version:VERSION,allRowsHaveFourSkillPoints:rows.every(r=>(r.skills||[]).length===4),rowCount:rows.length,loaded:true};}});
if(new URLSearchParams(location.search).has('reset'))localStorage.removeItem(STORE);
bind();renderAll();
})();
