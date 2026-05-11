(()=>{
'use strict';
const VERSION='1.14.6-full-code-cleanup';
const STORE7='daGoPlayV7', STORE6='daGoPlayV6';

const SKILL_LABEL={
 inner:'內功',outer:'外功',light:'輕功',swim:'水性',climb:'攀行',pierce:'刺擊',slash:'斬擊',strike:'打擊',sense:'感知',
 sleight:'巧手',craft:'工藝',appraise:'辨別',medicine:'醫術',pharma:'調藥',ride:'騎術',hide:'躲藏',observe:'觀察',listen:'聆聽',smell:'品嗅',office:'政務',animal:'馴養',threat:'威嚇',art:'表達',elegance:'雅藝',
 appearance:'相貌',resource:'資源',wealth:'財富',court:'官場',jianghu:'江湖',geo:'地理',nature:'自然',history:'歷史',religion:'信仰',study:'學藝',will:'意志',language:'語言',social:'交際',empathy:'共情',speech:'口才'
};
const ROLE_EFFECTS={
 court_official:{name:'京官',skills:{court:2,office:1,speech:1},talents:['官署門路','章程通曉']},
 local_official:{name:'地方官',skills:{court:1,office:2,observe:1},talents:['里甲熟手','地方調停']},
 technical_official:{name:'技官',skills:{craft:2,appraise:1,office:1},talents:['工料核算','修造眼光']},
 liuwaiguan:{name:'流外官',skills:{office:1,court:1,resource:1,observe:1},talents:['流外門路','雜任熟規']},
 staff_officer:{name:'幕佐',skills:{office:1,study:1,history:1,speech:1},talents:['幕府籌議','案牘判斷']},
 coroner:{name:'仵作',skills:{medicine:1,observe:2,appraise:1},talents:['驗傷辨跡','屍格常識']},
 wenxuan:{name:'文選吏',skills:{office:2,study:1,court:1},talents:['選簿門路','官資辨識']},
 family_official:{name:'家官',skills:{office:1,resource:1,speech:1,court:1},talents:['家政調度','主家人情']},
 border_soldier:{name:'邊軍',skills:{outer:1,slash:1,will:1,geo:1},talents:['邊地軍規','風沙耐性']},
 yamen_clerk:{name:'書吏',skills:{office:2,study:1,observe:1},talents:['案卷查找','文書破綻']},
 runner:{name:'差役',skills:{observe:2,light:1,jianghu:1},talents:['街巷熟路','差務暗規']},
 constable:{name:'捕役',skills:{observe:2,outer:1,strike:1},talents:['盤問搜查','近身制敵']},
 soldier:{name:'兵戶',skills:{outer:1,slash:1,strike:1,resource:1},talents:['即時備戰','行伍口令']},
 urban_household:{name:'坊郭戶',skills:{speech:1,resource:1,observe:1,jianghu:1},talents:['街坊人情','鋪戶打聽']},
 workshop:{name:'作坊戶',skills:{craft:2,appraise:1,resource:1},talents:['器物修補','材料辨識']},
 teahouse:{name:'茶棚幫閒',skills:{listen:2,speech:1,jianghu:1},talents:['閒談套話','旅人辨路']},
 market_broker:{name:'市牙人',skills:{appraise:2,wealth:1,speech:1},talents:['估價牽線','行規辨識']},
 rural_farmer:{name:'農戶',skills:{nature:2,outer:1,resource:1},talents:['時令農事','田間耐勞']},
 hunter:{name:'獵戶',skills:{observe:1,nature:2,pierce:1},talents:['循跡尋物','伏藏警覺']},
 fisher:{name:'漁戶',skills:{swim:2,nature:1,listen:1},talents:['水性熟稔','魚汛船路']},
 village_elder:{name:'里正家人',skills:{office:1,speech:1,history:1,jianghu:1},talents:['名冊人情','鄉里說合']},
 literatus:{name:'士子',skills:{study:2,language:1,history:1},talents:['經史文義','士林入席']},
 copyist:{name:'抄書人',skills:{study:1,appraise:1,observe:1,language:1},talents:['校對缺頁','筆跡辨改']},
 tutor:{name:'塾師',skills:{study:2,language:1,empathy:1},talents:['啟蒙訓誡','典故勸人']},
 poet:{name:'詩客',skills:{art:1,elegance:1,speech:1,language:1},talents:['詩酒唱和','風雅結交']},
 strongman:{name:'壯士',skills:{outer:2,strike:1,threat:1},talents:['硬差擔當','勇名壓場']},
 escort:{name:'鏢客',skills:{slash:1,pierce:1,observe:1,jianghu:1},talents:['護送規矩','鏢路口令']},
 dock_labor:{name:'埠頭力夫',skills:{outer:2,resource:1,listen:1},talents:['碼頭門路','貨箱去向']},
 militia:{name:'團練',skills:{outer:1,slash:1,observe:1,resource:1},talents:['保甲防務','聚人自守']},
 wanderer:{name:'遊手',skills:{hide:1,jianghu:2,listen:1},talents:['街面縫隙','灰路找人']},
 gambler:{name:'賭徒',skills:{sleight:1,observe:1,jianghu:1,speech:1},talents:['賭桌眼光','欠債消息']},
 vagrant:{name:'浪人',skills:{hide:1,jianghu:1,resource:1,will:1},talents:['破屋過夜','底層求生']},
 broker:{name:'掮客',skills:{speech:2,jianghu:1,appraise:1},talents:['傳話撮合','人情債目']},
 house_scion:{name:'門閥子弟',skills:{court:1,wealth:1,elegance:1,speech:1},talents:['門第薄面','舊交遞話']},
 merchant:{name:'行商',skills:{wealth:2,resource:1,appraise:1},talents:['貨路信用','契約欠條']},
 medic:{name:'坊郭醫',skills:{medicine:2,pharma:1,nature:1},talents:['病傷辨識','藥材禁忌']},
 artist:{name:'伎伶俳優',skills:{art:2,elegance:1,empathy:1},talents:['席間引話','演出換情']},
 disciple:{name:'門派弟子',skills:{inner:1,light:1,pierce:1,jianghu:1},talents:['江湖禮數','師門名號']},
 shopkeeper:{name:'店家',skills:{wealth:1,resource:1,appraise:1,speech:1},talents:['市井經營','識貨議價']},
 innkeeper:{name:'客棧掌櫃',skills:{listen:1,speech:1,resource:1,jianghu:1},talents:['客棧消息','迎送識人']},
 retainer:{name:'家臣',skills:{court:1,office:1,will:1,speech:1},talents:['侍從禮法','主家門路']},
 scholar:{name:'學士',skills:{study:2,language:1,history:1},talents:['學問根柢','書卷推理']},
 aesthete:{name:'雅士',skills:{elegance:2,art:1,speech:1},talents:['風雅品鑑','席間周旋']},
 nvhuan:{name:'女鬟',skills:{listen:1,empathy:1,hide:1,speech:1},talents:['內宅耳目','細務周全']},
 military_commander:{name:'將帥',skills:{office:1,outer:1,history:1,speech:1},talents:['行伍號令','臨陣調度']},
 official:{name:'官員',skills:{court:2,office:1,speech:1},talents:['官場規矩','公門門路']},
 doctor:{name:'醫者',skills:{medicine:2,pharma:1,nature:1},talents:['望聞問切','佐藥']},
 farmer:{name:'農人',skills:{nature:2,outer:1,resource:1},talents:['耕作時令','耐勞']},
 guard:{name:'護院',skills:{outer:1,strike:1,observe:1,threat:1},talents:['守門護衛','近身格擋']},
 artisan:{name:'匠人',skills:{craft:2,appraise:1,resource:1},talents:['器物修補','材料辨識']},
 performer:{name:'藝人',skills:{art:2,elegance:1,empathy:1},talents:['演藝入席','察言觀色']},
 fortuneteller:{name:'卜者',skills:{religion:1,empathy:1,speech:1,observe:1},talents:['占問話術','人心揣摩']},
 ranger:{name:'遊俠',skills:{light:1,slash:1,jianghu:1,observe:1},talents:['江湖行路','拔刀相助']},
 yishi:{name:'藝師',skills:{art:2,elegance:1,study:1},talents:['藝業師承','審美定評']},
 iron_guest:{name:'鐵客',skills:{outer:1,strike:1,will:1,jianghu:1},talents:['硬門路','鐵器眼光']}
};
const ORIGIN_EFFECTS={
 changshan:{name:'常山縣本地人',skills:{geo:1,nature:1,jianghu:1},talents:['常山地熟']},
 tianjin:{name:'天津郡郡城',skills:{court:1,speech:1,resource:1},talents:['郡城門路']},
 hengshui:{name:'衡水縣',skills:{geo:1,nature:1,resource:1},talents:['衡水田路']},
 hengwan:{name:'珩灣縣',skills:{swim:1,resource:1,listen:1},talents:['灣岸水路']},
 cangbei:{name:'滄北邑',skills:{jianghu:1,will:1,history:1},talents:['滄北舊聞']},
 nanjing:{name:'南京',skills:{court:1,study:1,elegance:1},talents:['京華見聞']},
 donglai:{name:'東萊郡',skills:{geo:1,resource:1,listen:1},talents:['東萊行旅']},
 nanhai:{name:'南陽郡',skills:{geo:1,resource:1,speech:1},talents:['南陽行路']},
 yinchuan:{name:'銀川郡',skills:{geo:1,will:1,resource:1},talents:['銀川邊聞']},
 jianzhou:{name:'劍南郡',skills:{geo:1,jianghu:1,nature:1},talents:['劍南山路']},
 hengshui_county:{name:'衡水縣',skills:{geo:1,nature:1,resource:1},talents:['衡水田路']}
};
const TRAIT_EFFECTS={calm:{name:'冷靜',skills:{will:1,observe:1},talents:['臨事不亂']},streetwise:{name:'熟路',skills:{jianghu:1,listen:1},talents:['熟路避險']},silver_tongue:{name:'善談',skills:{speech:2},talents:['話鋒轉圜']},sturdy:{name:'耐勞',skills:{outer:1,will:1},talents:['苦役耐性']},upright:{name:'雅正',skills:{elegance:1,empathy:1},talents:['端方儀態']},reckless:{name:'急烈',skills:{slash:1,threat:1},talents:['先聲奪人']}};
const PLAN_EFFECTS={balanced:{name:'均衡',skills:{outer:1,observe:1,study:1},talents:['三才均衡']},body:{name:'體魄',skills:{outer:1,inner:1,strike:1},talents:['體魄用力']},tech:{name:'技巧',skills:{sleight:1,observe:1,craft:1},talents:['技術熟手']},mind:{name:'智識',skills:{study:1,history:1,language:1},talents:['智識推演']},social:{name:'交際',skills:{speech:1,empathy:1,elegance:1},talents:['交際周旋']},travel:{name:'行路',skills:{light:1,geo:1,nature:1},talents:['行路辨向']}};
const SPECIAL_EFFECTS={none:{name:'無',skills:{},talents:[]},taihu_wei:{name:'太湖魏家旁支',skills:{wealth:1,court:1,history:1},talents:['太湖舊名']},jinling_yang:{name:'金陵陽家旁支',skills:{study:1,speech:1,elegance:1},talents:['金陵家學']},cangbei_bei:{name:'滄北北家舊識',skills:{jianghu:1,history:1,will:1},talents:['北家舊識']},qishan_ye:{name:'岐山葉氏',skills:{slash:2,outer:1},talents:['葉氏劍訣']},kunlun_chu:{name:'蓬萊崑崙外系',skills:{pierce:1,light:1,elegance:1},talents:['崑崙步劍']},wanminhui:{name:'萬民會暗語',skills:{jianghu:1,listen:1,hide:1},talents:['萬民暗語']}};
const CODE_ZH={...Object.fromEntries(Object.entries(ROLE_EFFECTS).map(([k,v])=>[k,v.name])),...Object.fromEntries(Object.entries(ORIGIN_EFFECTS).map(([k,v])=>[k,v.name])),...Object.fromEntries(Object.entries(TRAIT_EFFECTS).map(([k,v])=>[k,v.name])),...Object.fromEntries(Object.entries(PLAN_EFFECTS).map(([k,v])=>[k,v.name])),...Object.fromEntries(Object.entries(SPECIAL_EFFECTS).map(([k,v])=>[k,v.name]))};

function label(k){return window.DaGoRules?.skillName?.(k)||SKILL_LABEL[k]||CODE_ZH[k]||k}
function codeName(k){return CODE_ZH[k]||(/[A-Za-z_]/.test(String(k))?'未定身分':k)}
function addSkill(map,k,v=1){map[k]=Math.min(5,(Number(map[k])||0)+Number(v||0))}
function mergeSkills(target,source){for(const [k,v] of Object.entries(source||{}))addSkill(target,k,v)}
function selectedRoles(form){return [...form.querySelectorAll('[name="roles"]')].map(x=>x.value).filter(Boolean)}
function radioValue(form,name){return form.querySelector(`[name="${name}"]:checked`)?.value||''}
function fallbackRole(code){return {name:codeName(code),skills:{observe:1,speech:1},talents:['未定經歷']}}
function gather(form){const skills={observe:1,speech:1,study:1},talents=[],blocks=[];function use(kind,code,row){if(!row&&kind==='身分'&&code&&/[A-Za-z_]/.test(code))row=fallbackRole(code);if(!row)return;mergeSkills(skills,row.skills);for(const t of row.talents||[])if(!talents.includes(t))talents.push(t);blocks.push({kind,code,name:row.name||codeName(code),skills:row.skills||{},talents:row.talents||[]})}selectedRoles(form).forEach(code=>use('身分',code,ROLE_EFFECTS[code]));use('出身',radioValue(form,'origin'),ORIGIN_EFFECTS[radioValue(form,'origin')]);use('性格',radioValue(form,'trait'),TRAIT_EFFECTS[radioValue(form,'trait')]);use('屬性配置',radioValue(form,'attributePlan'),PLAN_EFFECTS[radioValue(form,'attributePlan')]);use('特殊身世',radioValue(form,'specialOrigin'),SPECIAL_EFFECTS[radioValue(form,'specialOrigin')]);return {skills,talents,blocks}}
function skillText(skills){return Object.entries(skills).sort((a,b)=>String(label(a[0])).localeCompare(String(label(b[0])))).map(([k,v])=>`${label(k)} ${v}`).join('、')||'無'}
function blockText(blocks){return blocks.map(b=>`${b.kind}「${b.name}」：${skillText(b.skills)}；特技：${(b.talents||[]).join('、')||'無'}`).join('<br>')}
function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function replaceCodes(text){let out=String(text??'');for(const [code,name] of Object.entries(CODE_ZH))out=out.replace(new RegExp(`(^|[^A-Za-z_])${escRe(code)}(?=戊|丁|丙|乙|甲|\\s|、|，|/|$|[^A-Za-z_])`,'g'),`$1${name}`);return out.replace(/(^|[^A-Za-z_])[A-Za-z][A-Za-z0-9_]{2,}(?=戊|丁|丙|乙|甲|\s|、|，|\/|$|[^A-Za-z_])/g,'$1未定身分')}
function walkText(node,box){if(!node||box.count>1400)return;if(node.nodeType===3){const next=replaceCodes(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;box.count++;return}if(node.nodeType!==1||['SCRIPT','STYLE','TEXTAREA','INPUT','SELECT','OPTION'].includes(node.tagName))return;for(const child of Array.from(node.childNodes))walkText(child,box)}
function patchPreviewCodes(){const box=document.getElementById('buildPreview');if(box)walkText(box,{count:0})}
function patchRolePhraseTable(){window.DaGoRoleRankPhraseTable=window.DaGoRoleRankPhraseTable||{};for(const [code,row] of Object.entries(ROLE_EFFECTS)){if(!window.DaGoRoleRankPhraseTable[code])window.DaGoRoleRankPhraseTable[code]={group:'身分',name:row.name,戊:`${row.name}初入其門。`,丁:`${row.name}已有經驗。`,丙:`${row.name}門路漸熟。`,乙:`${row.name}頗有名聲。`,甲:`${row.name}已成老手。`}}}
function preview(){const form=document.getElementById('startForm'), box=document.getElementById('buildPreview');if(!form||!box)return;patchRolePhraseTable();const data=gather(form);box.querySelector('.character-build-zh-block')?.remove();box.insertAdjacentHTML('beforeend',`<section class="character-build-zh-block preview-detail-block"><h4>身分與背景加成</h4><p>${blockText(data.blocks)}</p><h4>技能值</h4><p>${skillText(data.skills)}</p><h4>特殊特技</h4><p>${data.talents.join('、')||'無'}</p></section>`);patchPreviewCodes()}
function enhanceState(st){const form=document.getElementById('startForm');if(!st||!form)return st;const data=gather(form);st.skills=st.skills||{};for(const [k,v] of Object.entries(data.skills))st.skills[k]=Math.max(Number(st.skills[k])||0,Number(v)||0);st.player=st.player||{};st.player.roleNames=(st.player.roles||[]).map(codeName);st.player.originName=codeName(st.player.origin);st.player.traitName=codeName(st.player.trait);st.player.specialOriginName=codeName(st.player.specialOrigin);st.player.specialTalents=Array.from(new Set([...(st.player.specialTalents||[]),...data.talents]));st.player.characterBuildBlocks=data.blocks;st.characterBuildVersion=VERSION;window.DaGoRules?.recalcAttrs?.(st);return st}
const nativeSetItem=localStorage.setItem.bind(localStorage);if(!localStorage.__daGoCharacterBuildZhV1146){Object.defineProperty(localStorage,'__daGoCharacterBuildZhV1146',{value:1});localStorage.setItem=function(k,v){if(k===STORE7||k===STORE6){try{v=JSON.stringify(enhanceState(JSON.parse(v)))}catch{}}return nativeSetItem(k,v)}}
function boot(){patchRolePhraseTable();const form=document.getElementById('startForm');if(form&&!form.dataset.characterBuildZhV1146){form.dataset.characterBuildZhV1146=VERSION;form.addEventListener('change',()=>setTimeout(preview,0),true);form.addEventListener('input',()=>setTimeout(preview,0),true);form.addEventListener('submit',()=>setTimeout(()=>{try{const k=localStorage.getItem(STORE7)?STORE7:STORE6;const raw=localStorage.getItem(k);if(raw)localStorage.setItem(k,raw)}catch{}},0),true)}preview();setTimeout(preview,80);setTimeout(preview,260);setTimeout(preview,520)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoCharacterBuildZh=Object.freeze({version:VERSION,ROLE_EFFECTS,ORIGIN_EFFECTS,TRAIT_EFFECTS,PLAN_EFFECTS,SPECIAL_EFFECTS,CODE_ZH,gather,preview,enhanceState,replaceCodes,codeName});
})();
