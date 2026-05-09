(()=>{
'use strict';
const VERSION='1.11.0-changshan-year';
const STORE='daGoPlayV6';
const RANKS=['戊','丁','丙','乙','甲'];
const ROLE_ROWS=[
{code:'court_official',group:'官員',name:'京官',ranks:{戊:'初入京署，熟悉公文名目。',丁:'能辨章程，知道衙署門路。',丙:'見過朝中文移，說話自帶官樣。',乙:'有可查任歷，人情往來更廣。',甲:'門路深厚，尋常書吏不敢輕慢。'}},
{code:'local_official',group:'官員',name:'地方官',ranks:{戊:'懂縣鄉規矩，能問出地方小事。',丁:'熟悉里甲戶籍，會看人情輕重。',丙:'能調停鄉里糾紛，地方人願給薄面。',乙:'熟悉錢糧刑名，辦事更有章法。',甲:'地方聲望高，縣中人多知其名。'}},
{code:'technical_official',group:'官員',name:'技官',ranks:{戊:'會看器物帳目，懂基本工料。',丁:'能辨工期與用料虛實。',丙:'能指揮小型修造與核算。',乙:'熟悉水利、倉儲或器械規程。',甲:'技藝與官署資歷兼備，難被匠人糊弄。'}},
{code:'yamen_clerk',group:'兵吏衙差',name:'書吏',ranks:{戊:'能抄案卷，認得常見官文。',丁:'知道案卷歸處，查找不致迷路。',丙:'能從舊案裡找出疑點。',乙:'熟悉縣衙人事，懂誰能說話。',甲:'筆札老練，一眼能看出文書破綻。'}},
{code:'runner',group:'兵吏衙差',name:'差役',ranks:{戊:'腿腳勤快，能跑縣城短路。',丁:'認得街巷鋪戶，能帶話送信。',丙:'知道差務暗規，能避開麻煩。',乙:'各處熟面孔不少，探問更便利。',甲:'縣城風聲常先一步入耳。'}},
{code:'constable',group:'兵吏衙差',name:'捕役',ranks:{戊:'會拿人看守，身手比常人硬。',丁:'懂盤問與搜查，能看出可疑腳印。',丙:'能處理街面衝突，敢近身制敵。',乙:'熟悉盜案與夜禁，追查更快。',甲:'街面惡徒多知其手段。'}},
{code:'soldier',group:'兵吏衙差',name:'兵戶',ranks:{戊:'受過操練，會用短兵。',丁:'能守夜巡邏，遇事不易慌。',丙:'熟悉隊列與口令，敢接硬差。',乙:'行伍經驗老到，能看出戰陣門道。',甲:'軍中舊名仍有人記得。'}},
{code:'urban_household',group:'坊郭戶',name:'坊郭戶',ranks:{戊:'熟悉坊巷日用，知道誰家開門。',丁:'能在鋪戶間打聽價錢。',丙:'街坊信任略增，能借到小物。',乙:'熟悉市井人情，買賣話更順。',甲:'坊郭消息流通，許多事瞞不過你。'}},
{code:'workshop',group:'坊郭戶',name:'作坊戶',ranks:{戊:'會做粗活，認得常見工具。',丁:'能修補簡單器物。',丙:'懂材料好壞，能接小件工活。',乙:'能看懂匠作安排，議價更準。',甲:'工坊中有名聲，難題也有人來問。'}},
{code:'teahouse',group:'坊郭戶',name:'茶棚幫閒',ranks:{戊:'會端茶招呼，聽得到碎話。',丁:'知道客人喜惡，能套出閒談。',丙:'能辨旅人來路，消息更雜。',乙:'茶棚熟客願多說幾句。',甲:'人來人往的風聲常落在你耳中。'}},
{code:'market_broker',group:'坊郭戶',name:'市牙人',ranks:{戊:'懂買賣開價，知道常見行規。',丁:'能估貨物粗價。',丙:'會牽線成交，知道誰缺貨。',乙:'能看出帳面與實價差距。',甲:'市場人脈厚，買賣消息來得快。'}},
{code:'rural_farmer',group:'鄉村戶',name:'農戶',ranks:{戊:'會做田活，耐得日曬。',丁:'知道時令與作物收成。',丙:'能分辨地力水勢。',乙:'熟悉鄉村人情與糧價。',甲:'鄉里信服，田間消息易得。'}},
{code:'hunter',group:'鄉村戶',name:'獵戶',ranks:{戊:'認得獸徑，會用短矛或弓弩。',丁:'能循跡尋人尋物。',丙:'山林夜路更有把握。',乙:'能判斷伏藏與逃竄方向。',甲:'野外經驗老到，常能先察危險。'}},
{code:'fisher',group:'鄉村戶',name:'漁戶',ranks:{戊:'熟悉水性，會看河面。',丁:'能駕小舟，懂魚汛。',丙:'知道碼頭與河埠規矩。',乙:'可沿水路打聽消息。',甲:'水上人脈深，船家多願通報。'}},
{code:'village_elder',group:'鄉村戶',name:'里正家人',ranks:{戊:'知道里甲名冊與鄰里關係。',丁:'能進出村中公事。',丙:'可替人說合小爭端。',乙:'鄉里長輩願聽其言。',甲:'村中舊事、人名、債務多能說清。'}},
{code:'literatus',group:'文人',name:'士子',ranks:{戊:'讀過經史，能作短札。',丁:'能辨典故與文義。',丙:'談吐有書卷氣，易入文人席。',乙:'文章可取，士林有人識得。',甲:'名聲在外，文會與官門皆可遞話。'}},
{code:'copyist',group:'文人',name:'抄書人',ranks:{戊:'字跡端正，能抄短卷。',丁:'能校對錯字與缺頁。',丙:'熟悉書鋪、案牘、帳冊格式。',乙:'能辨不同筆跡與改痕。',甲:'抄校老練，藏書人也願託付。'}},
{code:'tutor',group:'文人',name:'塾師',ranks:{戊:'能教孩童識字。',丁:'懂啟蒙與訓誡。',丙:'能用典故勸人。',乙:'鄉紳家中可入座。',甲:'教學名聲足，家長與學生多信任。'}},
{code:'poet',group:'文人',name:'詩客',ranks:{戊:'能吟短句，席間不怯。',丁:'懂唱和規矩。',丙:'可用詩酒結交。',乙:'風雅名聲可傳入客棧茶肆。',甲:'一首詩可換來門路與人情。'}},
{code:'strongman',group:'壯士',name:'壯士',ranks:{戊:'力氣勝常人，能搬扛重物。',丁:'敢擋粗暴爭端。',丙:'出手有章法，街面人會掂量。',乙:'能帶人做硬差。',甲:'勇名傳開，尋常挑釁會先退半步。'}},
{code:'escort',group:'壯士',name:'鏢客',ranks:{戊:'懂護送規矩，會看路面。',丁:'能護一段短途。',丙:'熟悉鏢局口令與行話。',乙:'遇匪不慌，可安排前後照應。',甲:'鏢路聲望足，行商願托重物。'}},
{code:'dock_labor',group:'壯士',name:'埠頭力夫',ranks:{戊:'會扛包上船，耐得潮濕辛勞。',丁:'熟悉碼頭腳夫規矩。',丙:'能辨貨箱去向。',乙:'碼頭人願報一兩句實話。',甲:'水陸搬運門路熟，貨物流向難瞞。'}},
{code:'militia',group:'壯士',name:'團練',ranks:{戊:'會守寨巡邏。',丁:'懂鄉兵器械與口令。',丙:'能召集幾個熟人壯膽。',乙:'熟悉保甲防務。',甲:'鄉勇信服，遇亂可聚人自守。'}},
{code:'wanderer',group:'遊手',name:'遊手',ranks:{戊:'熟悉街面縫隙，知道何處可歇。',丁:'能躲開尋常盤查。',丙:'知道江湖閒話與黑市小路。',乙:'能在灰色地帶找人。',甲:'無名路數很多，消息來得刁鑽。'}},
{code:'gambler',group:'遊手',name:'賭徒',ranks:{戊:'懂賭桌規矩。',丁:'能看出簡單手法。',丙:'能從牌桌聽出欠債與恩怨。',乙:'賭坊人會留神你的手。',甲:'輸贏背後的人情債也看得清。'}},
{code:'vagrant',group:'遊手',name:'浪人',ranks:{戊:'能湊合過夜，熟悉破屋巷尾。',丁:'會尋便宜飯食。',丙:'知道誰收留人、誰趕人。',乙:'能靠臨時人情渡過難關。',甲:'街巷底層消息多半瞞不住你。'}},
{code:'broker',group:'遊手',name:'掮客',ranks:{戊:'會替人傳話。',丁:'能撮合小買賣。',丙:'知道誰欠誰人情。',乙:'能把消息換成實利。',甲:'縣城暗線廣，交易前後多有耳目。'}},
{code:'house_scion',group:'其他身分',name:'門閥子弟',ranks:{戊:'家名可提，但分量有限。',丁:'能借到些許門第薄面。',丙:'懂門第禮數，不易失儀。',乙:'家中舊交可幫一次忙。',甲:'門第名望可開不少門。'}},
{code:'merchant',group:'其他身分',name:'行商',ranks:{戊:'會看貨價與旅費。',丁:'懂契約與欠條。',丙:'知道商路風險。',乙:'商旅同道願通消息。',甲:'貨路、人脈、信用三者皆有積累。'}},
{code:'medic',group:'其他身分',name:'坊郭醫',ranks:{戊:'會辨常見病傷。',丁:'能處理小傷寒熱。',丙:'懂藥材真偽與禁忌。',乙:'病家願請你入門。',甲:'醫名漸起，疑難病人也會來尋。'}},
{code:'artist',group:'其他身分',name:'伎伶俳優',ranks:{戊:'能唱念娛席。',丁:'會察言觀色。',丙:'能在席間引話。',乙:'常出入宴飲與市井場合。',甲:'一場演出可換消息、人情與賞錢。'}},
{code:'disciple',group:'其他身分',name:'門派弟子',ranks:{戊:'認得江湖禮數。',丁:'能報師門名號。',丙:'懂門派往來與禁忌。',乙:'同道願多聽一句。',甲:'江湖聲名已成，門派舊交可用。'}}
];
const ROLE_TABLE=Object.freeze(Object.fromEntries(ROLE_ROWS.map(row=>[row.code,Object.freeze({
  group:row.group,
  name:row.name,
  戊:row.ranks.戊,
  丁:row.ranks.丁,
  丙:row.ranks.丙,
  乙:row.ranks.乙,
  甲:row.ranks.甲
})])));
function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0))}
function rankName(n){return RANKS[clamp(n,1,5)-1]}
function count(roles){const out={};(roles||[]).forEach(code=>{out[code]=(out[code]||0)+1});return out}
function selectedRows(st){return Object.entries(count(st?.player?.roles)).map(([code,n])=>{
  const row=ROLE_TABLE[code]||{name:code};
  const rank=rankName(n);
  return {code,name:row.name,rank,phrase:row[rank]||''};
})}
function fix(st){
  if(!st||typeof st!=='object')return st;
  if(st.skills)Object.keys(st.skills).forEach(k=>{st.skills[k]=clamp(st.skills[k],-3,5)});
  if(st.player)st.player.renownLevel=1;
  if(st.renown)st.renown.level=1;
  st.roleRankShortPhrases=selectedRows(st);
  st.roleRankPhraseTableVersion=VERSION;
  st.balanceFixVersion=VERSION;
  return st;
}
function read(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
function write(st){try{localStorage.setItem(STORE,JSON.stringify(st))}catch{}}
function installFormPulse(){
  const form=document.getElementById('startForm');
  if(form&&!form.dataset.rankPhrasePulse){
    form.dataset.rankPhrasePulse=VERSION;
    form.dispatchEvent(new Event('change',{bubbles:true}));
  }
}
window.DaGoRoleRankPhraseRows=Object.freeze(ROLE_ROWS.map(row=>Object.freeze({...row,ranks:Object.freeze({...row.ranks})})));
window.DaGoRoleRankPhraseTable=ROLE_TABLE;
window.DaGoCharacterBalanceFix=Object.freeze({version:VERSION,roleCount:ROLE_ROWS.length,rankCount:RANKS.length,bonusPolicy:'no-extra-starting-bonus'});
const oldSet=localStorage.setItem.bind(localStorage);
if(!localStorage.__daGoBalanceFixV1110Changshan){
  Object.defineProperty(localStorage,'__daGoBalanceFixV1110Changshan',{value:1});
  localStorage.setItem=function(k,v){if(k===STORE){try{v=JSON.stringify(fix(JSON.parse(v)))}catch{}}return oldSet(k,v)};
}
const st=read();
if(Object.keys(st).length)write(fix(st));
let tries=0;
const timer=setInterval(()=>{tries++;installFormPulse();if(tries>20)clearInterval(timer)},250);
installFormPulse();
})();
