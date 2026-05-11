(()=>{
'use strict';
const VERSION='1.14.9-preview-roles-chinese-only';
if(window.DaGoPreviewRoleChineseOnly&&window.DaGoPreviewRoleChineseOnly.version===VERSION) return;

const BASE_MAP={"wenxuan":"文選","family_official":"家世官","xunguan":"勳官","sanguan":"散官","liuwaiguan":"流外官","nvhuan":"女宦","weishi":"衛士","yamen_clerk":"胥吏","runner":"皂快","constable":"捕役","coroner":"仵作穩婆","soldier":"介冑","border_soldier":"邊防關部伍","staff_officer":"參軍","military_commander":"武將","broker":"掮客","innkeeper":"邸店主","shopkeeper":"舖戶","crafts_household":"手工戶","house_scion":"門閥子弟","performer":"伎伶俳優","medic":"坊郭醫","rural_farmer":"農圃","hunter":"採戶","fisher":"疍戶","village_elder":"村落豪紳","storyteller":"說書人","scholar":"書生","aesthete":"雅士","tutor":"教書先生","matchmaker":"媒妁","fortuneteller":"相命","literati_artist":"丹青琴棋","ranger":"遊俠","militia":"團屯","guard":"護院","escort":"鏢師","retainer":"門客","disciple":"門派弟子","merchant":"行商","wanderer":"雲遊士","gambler":"賭徒","vagrant":"叫化子","dock_labor":"埠頭力夫","court_official":"京官","local_official":"地方官","technical_official":"技官","urban_household":"坊郭戶","workshop":"作坊戶","teahouse":"茶棚幫閒","market_broker":"市牙人","literatus":"士子","copyist":"抄書人","poet":"詩客","strongman":"壯士","artist":"伎伶俳優","official":"官員","doctor":"醫者","farmer":"農人","artisan":"匠人","iron_guest":"鐵客","frontier_guard":"邊軍戍戶嫡支","apprentice_medic":"醫徒","peddler":"貨郎","boatman":"船夫","scribe":"書手","mendicant":"行腳人","jiang":"江郡","nanyang":"南陽郡","yinchuan":"銀川郡","kunlun":"崑崙外州","wudu":"洞庭五毒境","huayin":"華陰山麓","donglai":"東萊郡","jiannan":"劍南郡","nanjiang":"南疆邊郡","taihu":"太湖郡","shangqiu":"商丘郡","changshan":"常山縣本地人","tianjin":"天津郡郡城","hengshui":"衡水縣","hengwan":"珩灣縣","cangbei":"滄北邑","nanjing":"南京","daxing_cui":"大興崔氏旁支","jinling_xie":"金陵謝氏遠房","longxi_li":"隴西李氏遠支","shangqiu_gongsun":"商丘公孫家遠支","general_son":"將門之子","fallen_captain":"敗軍校尉之後","taihu_wei":"太湖魏家旁支","jinling_yang":"金陵陽家旁支","cangbei_bei":"滄北北家舊識","qishan_ye":"岐山葉氏","kunlun_chu":"蓬萊崑崙外系","dongting_wudu":"洞庭五毒外緣","huayin_jiuqu":"華陰九曲外門","donglai_xuanhai":"東萊玄海舊友","jiannan_yuezong":"劍南越宗道緣","nanjiang_xiaoyao":"南境逍遙故人","wanminhui":"萬民會暗語"};

function hasLatin(s){ return /[A-Za-z_]/.test(String(s||'')); }
function cleanText(s){ return String(s||'').replace(/\s+/g,'').trim(); }
function visibleLabelFromOption(opt){
  if(!opt) return '';
  const label=cleanText(opt.textContent||opt.label||'');
  return hasLatin(label)?'':label;
}
function collectRoleMap(){
  const map=Object.assign({}, BASE_MAP);
  const form=document.getElementById('startForm');
  if(form){
    form.querySelectorAll('select[name="roles"] option[value]').forEach(opt=>{
      const code=String(opt.value||'').trim();
      const label=visibleLabelFromOption(opt);
      if(code&&label) map[code]=label;
    });
  }
  if(window.DaGoRoleRankPhraseTable){
    Object.entries(window.DaGoRoleRankPhraseTable).forEach(([code,row])=>{
      const label=cleanText(row&&row.name);
      if(code&&label&&!hasLatin(label)) map[code]=label;
    });
  }
  return map;
}
function escRe(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
function replaceByMap(text,map){
  let out=String(text??'');
  const keys=Object.keys(map).sort((a,b)=>b.length-a.length);
  for(const code of keys){
    const label=map[code];
    out=out.replace(new RegExp(`(^|[^A-Za-z_])${escRe(code)}(?=戊|丁|丙|乙|甲|\\s|:|：|、|，|/|$|[^A-Za-z_])`,'g'), `$1${label}`);
  }
  out=out.replace(/未定身分|未定項目/g,'地方人士');
  return out;
}
function patchBuildPreviewText(){
  const root=document.getElementById('buildPreview');
  if(!root) return;
  const map=collectRoleMap();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const next=replaceByMap(node.nodeValue,map);
    if(next!==node.nodeValue) node.nodeValue=next;
  });
}
function wrapPreview(){
  const api=window.DaGoCharacterCreateUi;
  if(!api||api.__roleChineseWrapped||typeof api.preview!=='function') return;
  const original=api.preview.bind(api);
  api.preview=function(...args){
    const result=original(...args);
    queuePatch();
    return result;
  };
  api.__roleChineseWrapped=VERSION;
}
let scheduled=false;
function queuePatch(){
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    patchBuildPreviewText();
  });
}
function boot(){
  wrapPreview();
  patchBuildPreviewText();
  const root=document.getElementById('buildPreview');
  if(root){
    const observer=new MutationObserver(queuePatch);
    observer.observe(root,{childList:true,subtree:true,characterData:true});
  }
  const form=document.getElementById('startForm');
  if(form){
    form.addEventListener('change',queuePatch,true);
    form.addEventListener('input',queuePatch,true);
  }
  [0,50,150,350,800,1500].forEach(t=>setTimeout(()=>{wrapPreview();patchBuildPreviewText();},t));
  document.body.classList.add('dago-preview-role-chinese-only-ready');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

window.DaGoPreviewRoleChineseOnly=Object.freeze({version:VERSION,patch:patchBuildPreviewText,collectRoleMap});
})();
