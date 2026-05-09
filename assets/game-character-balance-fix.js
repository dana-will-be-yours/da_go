(()=>{
'use strict';
const VERSION='1.10.11-role-rank-table';
const STORE='daGoPlayV6';
const RANKS=['戊','丁','丙','乙','甲'];
const ROLE_ROWS=[
{code:'wenxuan',group:'文人',name:'文選',axis:'mind',ranks:{戊:'初識選簿名目的文選',丁:'熟悉戶籍與薦牘的文選',丙:'能判讀官籍流轉的文選',乙:'可調度州縣名冊的文選',甲:'能憑一冊選簿牽動仕途的文選'}},
{code:'literatus',group:'文人',name:'士子',axis:'mind',ranks:{戊:'初入學舍的士子',丁:'熟讀經義策問的士子',丙:'能在文會立論的士子',乙:'詩文與議論皆有人傳誦的士子',甲:'一篇文字足以改動士林風向的士子'}},
{code:'copyist',group:'文人',name:'抄書人',axis:'mind',ranks:{戊:'初學校字的抄書人',丁:'能按時交卷的抄書人',丙:'可辨偽本與殘頁的抄書人',乙:'掌握坊間書路的抄書人',甲:'能以一卷孤本換來門路的抄書人'}},
{code:'tutor',group:'文人',name:'塾師',axis:'mind',ranks:{戊:'初授蒙學的塾師',丁:'能管束一堂子弟的塾師',丙:'可替人梳理家學的塾師',乙:'受鄉里士族延請的塾師',甲:'足以培養一門聲望的塾師'}},
{code:'poet',group:'文人',name:'詩客',axis:'mind',ranks:{戊:'初赴雅集的詩客',丁:'能在席上得句的詩客',丙:'詩名傳入坊巷的詩客',乙:'可憑詩牽起人脈的詩客',甲:'一首詩能令貴客改席的詩客'}},
{code:'house',group:'門閥世家',name:'門閥子弟',axis:'mind',ranks:{戊:'剛能入族席的門閥子弟',丁:'熟悉家中禮數的門閥子弟',丙:'可替族中走動人情的門閥子弟',乙:'在親族與賓客間已有分量的門閥子弟',甲:'能牽動一族決議的門閥子弟'}},
{code:'house_scion',group:'門閥世家',name:'門閥子弟',axis:'mind',ranks:{戊:'剛能入族席的門閥子弟',丁:'熟悉家中禮數的門閥子弟',丙:'可替族中走動人情的門閥子弟',乙:'在親族與賓客間已有分量的門閥子弟',甲:'能牽動一族決議的門閥子弟'}},
{code:'court_official',group:'官員',name:'京官',axis:'mind',ranks:{戊:'初入朝班的京官',丁:'熟悉章奏門徑的京官',丙:'可主理一司文牘的京官',乙:'朝中多有同僚通問的京官',甲:'能參決部院大議的京官'}},
{code:'local_official',group:'官員',name:'地方官',axis:'mind',ranks:{戊:'初任州縣的地方官',丁:'熟悉田稅刑名的地方官',丙:'能處置一方政務的地方官',乙:'府縣士紳多肯買帳的地方官',甲:'可調停郡縣大案的地方官'}},
{code:'technical_official',group:'官員',name:'技官',axis:'tech',ranks:{戊:'初習營造度量的技官',丁:'能核算器物圖籍的技官',丙:'可獨立驗收工料的技官',乙:'掌一署工務名冊的技官',甲:'能以一圖改動工程成敗的技官'}},
{code:'yamen',group:'兵吏衙差',name:'胥吏',axis:'tech',ranks:{戊:'初識公文格式的胥吏',丁:'能跑完一日差事的胥吏',丙:'可獨立辦案牘的胥吏',乙:'衙中上下皆認得門路的胥吏',甲:'一句話能改變案卷走向的胥吏'}},
{code:'yamen_clerk',group:'兵吏衙差',name:'書吏',axis:'tech',ranks:{戊:'初識公文格式的書吏',丁:'能抄錄案牘的書吏',丙:'可獨立整理一房卷宗的書吏',乙:'衙中上下皆認得筆跡的書吏',甲:'一處批註能改變案卷走向的書吏'}},
{code:'runner',group:'兵吏衙差',name:'差役',axis:'tech',ranks:{戊:'初跟班頭跑腿的差役',丁:'熟悉城中巷路的差役',丙:'能獨自傳拘與查訪的差役',乙:'街坊聽腳步便知來人的差役',甲:'可調動一班人手辦差的差役'}},
{code:'constable',group:'兵吏衙差',name:'捕役',axis:'body',ranks:{戊:'初學拿人的捕役',丁:'能追索尋常盜案的捕役',丙:'可獨自押解重犯的捕役',乙:'黑白兩道皆知名號的捕役',甲:'能讓亡命徒聞風收手的捕役'}},
{code:'soldier',group:'兵吏衙差',name:'兵戶',axis:'body',ranks:{戊:'初入伍籍的兵戶',丁:'能守一段城防的兵戶',丙:'可帶伍行軍的兵戶',乙:'有戰功與袍澤人望的兵戶',甲:'一聲號令能聚起軍心的兵戶'}},
{code:'guard',group:'兵吏衙差',name:'衛士',axis:'body',ranks:{戊:'初持兵器值守的衛士',丁:'能看住一門一院的衛士',丙:'可護送人與物過街巷的衛士',乙:'貴家願托付近身安危的衛士',甲:'能以威名鎮住場面的衛士'}},
{code:'urban_household',group:'坊郭戶',name:'坊郭戶',axis:'tech',ranks:{戊:'初在坊中立戶的坊郭戶',丁:'熟悉鄰里買賣的坊郭戶',丙:'可調停街坊細務的坊郭戶',乙:'一坊消息多會經手的坊郭戶',甲:'能讓坊市人情為己所用的坊郭戶'}},
{code:'workshop',group:'坊郭戶',name:'作坊戶',axis:'tech',ranks:{戊:'初學手藝的作坊戶',丁:'能交付尋常活計的作坊戶',丙:'可承接大戶訂件的作坊戶',乙:'行內會主動問價的作坊戶',甲:'一件器物能定下行市的作坊戶'}},
{code:'teahouse',group:'坊郭戶',name:'茶棚幫閒',axis:'tech',ranks:{戊:'初在茶棚添水的幫閒',丁:'聽得懂客人口風的幫閒',丙:'可把話頭引向所需處的幫閒',乙:'南北客人都肯透露消息的幫閒',甲:'一盞茶能換來整條線索的幫閒'}},
{code:'market_broker',group:'坊郭戶',name:'市牙人',axis:'tech',ranks:{戊:'初識市價的市牙人',丁:'能替小商撮合買賣的市牙人',丙:'可核算貨路盈虧的市牙人',乙:'商戶願把暗價告知的市牙人',甲:'能憑一句估價牽動市面的市牙人'}},
{code:'rural_farmer',group:'鄉村戶',name:'農戶',axis:'body',ranks:{戊:'初掌農具的農戶',丁:'能看懂天時地力的農戶',丙:'可支應一家田事的農戶',乙:'鄉里會請來評斷收成的農戶',甲:'能以糧路牽住一村生計的農戶'}},
{code:'hunter',group:'鄉村戶',name:'獵戶',axis:'body',ranks:{戊:'初入山林的獵戶',丁:'能辨足跡與風向的獵戶',丙:'可獨自追捕猛獸的獵戶',乙:'山民願託付帶路的獵戶',甲:'能在山野間布下生路與死路的獵戶'}},
{code:'fisher',group:'鄉村戶',name:'漁戶',axis:'body',ranks:{戊:'初學下網的漁戶',丁:'熟悉水口與潮聲的漁戶',丙:'可在夜水中辨認船影的漁戶',乙:'沿河船家願聽其判斷的漁戶',甲:'能借水路藏住一整條消息的漁戶'}},
{code:'village_elder',group:'鄉村戶',name:'里正家人',axis:'mind',ranks:{戊:'初替里中跑文書的里正家人',丁:'熟悉戶口與田界的里正家人',丙:'可調停鄉里爭端的里正家人',乙:'縣中差人會先來問話的里正家人',甲:'能以鄉約改變一里走向的里正家人'}},
{code:'strongman',group:'壯士',name:'壯士',axis:'body',ranks:{戊:'初憑氣力立足的壯士',丁:'能在街市打出名號的壯士',丙:'可獨自撐住一場衝突的壯士',乙:'道上人會讓三分的壯士',甲:'能以一身膽氣壓住群雄的壯士'}},
{code:'escort',group:'壯士',name:'鏢客',axis:'body',ranks:{戊:'初隨鏢隊上路的鏢客',丁:'能護送尋常貨物的鏢客',丙:'可獨自押一段險路的鏢客',乙:'道上名聲響亮的鏢頭',甲:'一面鏢旗能讓山路開道的鏢客'}},
{code:'dock_labor',group:'壯士',name:'埠頭力夫',axis:'body',ranks:{戊:'初在埠頭扛包的力夫',丁:'熟悉船期與貨色的力夫',丙:'可領一班人裝卸的力夫',乙:'船主會主動請托的力夫',甲:'能讓一座埠頭按其節奏行事的力夫'}},
{code:'militia',group:'壯士',name:'團練',axis:'body',ranks:{戊:'初入鄉勇名冊的團練',丁:'能操持兵器與哨令的團練',丙:'可帶人巡守村道的團練',乙:'鄉里遇亂會先找來的團練',甲:'能把散戶聚成可用兵力的團練'}},
{code:'wanderer',group:'遊手',name:'遊手',axis:'body',ranks:{戊:'初在街頭混跡的遊手',丁:'熟悉市井門道的遊手',丙:'可在黑白縫隙中辦事的遊手',乙:'遊歷四方百郡的豪傑',甲:'能讓江湖消息為己奔走的遊手'}},
{code:'gambler',group:'遊手',name:'賭徒',axis:'tech',ranks:{戊:'初識牌骰的賭徒',丁:'能看出桌上手勢的賭徒',丙:'可在局中保住本錢的賭徒',乙:'賭坊會暗中留意的賭徒',甲:'能以一局輸贏換來人心的賭徒'}},
{code:'vagrant',group:'遊手',name:'浪人',axis:'body',ranks:{戊:'初離戶籍的浪人',丁:'懂得避開盤查的浪人',丙:'可在陌生城中尋到落腳處的浪人',乙:'多地暗門都有人相識的浪人',甲:'能讓追索者失去方向的浪人'}},
{code:'broker',group:'遊手',name:'掮客',axis:'tech',ranks:{戊:'初替人傳話的掮客',丁:'能替兩邊牽線的掮客',丙:'可判斷一樁交易真假分量的掮客',乙:'各路人馬都肯留一句話的掮客',甲:'能以一個引薦改變局面的掮客'}},
{code:'merchant',group:'商旅',name:'行商',axis:'mind',ranks:{戊:'初背貨上路的行商',丁:'熟悉一條貨路的行商',丙:'可獨自談成遠途買賣的行商',乙:'各地牙行皆認得招牌的行商',甲:'能以貨流牽動城中物價的行商'}},
{code:'medic',group:'醫戶',name:'坊郭醫',axis:'tech',ranks:{戊:'初識方書藥名的坊郭醫',丁:'能處置尋常病痛的坊郭醫',丙:'可獨立診治疑難外傷的坊郭醫',乙:'坊間病家會連夜相請的坊郭醫',甲:'能憑一帖藥方救回聲望與性命的坊郭醫'}},
{code:'artist',group:'伎藝戶',name:'伎伶俳優',axis:'tech',ranks:{戊:'初登小席的伎伶俳優',丁:'能唱念一折拿手戲的伎伶俳優',丙:'可帶動滿座情緒的伎伶俳優',乙:'貴客願專程來看的伎伶俳優',甲:'一場演出能改變眾人立場的伎伶俳優'}},
{code:'disciple',group:'江湖門派',name:'門派弟子',axis:'body',ranks:{戊:'初拜山門的門派弟子',丁:'能守住本門規矩的門派弟子',丙:'直系弟子',乙:'可受命下山辦事的門派弟子',甲:'能以一人聲名牽動門派聲望的門派弟子'}}
];
const ROLE_TABLE=Object.freeze(Object.fromEntries(ROLE_ROWS.map(row=>[row.code,Object.freeze({...row,ranks:Object.freeze(row.ranks)})])));
const ROLE=Object.freeze(Object.fromEntries(ROLE_ROWS.map(row=>[row.code,[row.name,row.axis]])));
const ATTR={inner:'body',outer:'body',light:'body',swim:'body',climb:'body',pierce:'body',slash:'body',strike:'body',sense:'body',sleight:'tech',craft:'tech',appraise:'tech',medicine:'tech',pharma:'tech',ride:'tech',hide:'tech',observe:'tech',listen:'tech',smell:'tech',office:'tech',animal:'tech',threat:'tech',art:'tech',elegance:'tech',appearance:'mind',resource:'mind',wealth:'mind',court:'mind',jianghu:'mind',geo:'mind',nature:'mind',history:'mind',religion:'mind',study:'mind',will:'mind',language:'mind',social:'mind',empathy:'mind',speech:'mind'};
const BONUS={guard:{slash:1,pierce:1},soldier:{slash:1,pierce:1},constable:{strike:1,slash:1},strongman:{strike:2},escort:{slash:2,pierce:1},wanderer:{slash:1,light:1},disciple:{strike:1,slash:1},hunter:{pierce:1},militia:{slash:1,pierce:1},dock_labor:{strike:1,outer:1},vagrant:{strike:1}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
function rankName(n){return RANKS[clamp(n,1,5)-1]}
function phrase(code,n){const row=ROLE_TABLE[code];const rank=rankName(n);return row?.ranks?.[rank]||`${rank}等${row?.name||code}`}
function publicTable(){const out={};for(const row of ROLE_ROWS){out[row.code]={group:row.group,name:row.name,戊:row.ranks.戊,丁:row.ranks.丁,丙:row.ranks.丙,乙:row.ranks.乙,甲:row.ranks.甲}}return out}
function count(arr){const out={};arr.forEach(code=>{out[code]=(out[code]||0)+1});return out}
function roleKey(st){return (st.player?.roles||[]).join('|')}
function selectedRows(st){return Object.entries(count(st.player?.roles||[])).map(([code,n])=>({code,name:ROLE_TABLE[code]?.name||code,rank:rankName(n),phrase:phrase(code,n)}))}
function attrMod(sum){sum=Number(sum)||0;if(sum<=0)return-2;if(sum===1)return-1;if(sum<=3)return 0;if(sum<=5)return 1;if(sum<=8)return 2;if(sum<=11)return 3;if(sum<=15)return 4;if(sum<=19)return 5;return 6}
function add(st,k,v){st.skills=st.skills||{};st.skills[k]=clamp((Number(st.skills[k])||0)+v,-3,5)}
function recalc(st){const sums={body:0,tech:0,mind:0};Object.entries(st.skills||{}).forEach(([k,v])=>{sums[ATTR[k]||'mind']+=Number(v)||0});st.attrSums=sums;st.attrs={body:attrMod(sums.body),tech:attrMod(sums.tech),mind:attrMod(sums.mind)}}
function applyOnce(st,key){if(st.balanceFixRoleKey===key)return;Object.entries(count(st.player?.roles||[])).forEach(([code])=>{Object.entries(BONUS[code]||{}).forEach(([skill,value])=>add(st,skill,value))});st.balanceFixRoleKey=key}
function fix(st){if(!st||typeof st!=='object')return st;const key=roleKey(st);applyOnce(st,key);Object.keys(st.skills||{}).forEach(k=>{st.skills[k]=clamp(st.skills[k],-3,5)});recalc(st);st.roleRankShortPhrases=selectedRows(st);st.roleRankPhraseTableVersion=VERSION;st.balanceFixVersion=VERSION;return st}
function preview(){const box=document.getElementById('buildPreview');if(!box)return;const roles=[...document.querySelectorAll('#startForm [name="roles"]')].map(x=>x.value);const rows=Object.entries(count(roles)).map(([code,n])=>`<li><b>${esc(ROLE_TABLE[code]?.name||code)}(${rankName(n)})</b>：${esc(phrase(code,n))}</li>`);const sp=document.querySelector('#startForm [name="specialOrigin"]:checked');const extra=sp&&sp.value!=='none'?`<li><b>${esc(sp.parentElement?.textContent?.trim()||'特殊身世')}</b>：${esc(sp.parentElement?.textContent?.trim()||'特殊身世')}</li>`:'';box.innerHTML=`<h3>身分品級參照</h3><p>已載入 ${ROLE_ROWS.length} 個身分 × 5 個品級短句。</p><ul>${rows.join('')}${extra}</ul>`}
function install(){const f=document.getElementById('startForm');if(!f||f.dataset.balanceFix===VERSION)return false;f.dataset.balanceFix=VERSION;f.addEventListener('change',preview,true);f.addEventListener('submit',()=>setTimeout(()=>{try{localStorage.setItem(STORE,JSON.stringify(fix(JSON.parse(localStorage.getItem(STORE)||'{}'))))}catch{}},20),true);const random=document.getElementById('randomizeCharacter');if(random)random.addEventListener('click',()=>setTimeout(preview,30),true);preview();return true}
window.DaGoRoleRankPhraseRows=Object.freeze(ROLE_ROWS.map(row=>Object.freeze({...row,ranks:Object.freeze({...row.ranks})})));
window.DaGoRoleRankPhraseTable=Object.freeze(publicTable());
window.DaGoCharacterBalanceFix=Object.freeze({version:VERSION,roleCount:ROLE_ROWS.length,rankCount:RANKS.length});
const oldSet=localStorage.setItem.bind(localStorage);
if(!localStorage.__daGoBalanceFixV1111){Object.defineProperty(localStorage,'__daGoBalanceFixV1111',{value:1});localStorage.setItem=function(k,v){if(k===STORE){try{v=JSON.stringify(fix(JSON.parse(v)))}catch{}}return oldSet(k,v)}}
let tries=0;
const timer=setInterval(()=>{tries++;if(install()||tries>60)clearInterval(timer)},250);
install();
})();
