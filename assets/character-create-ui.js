(()=>{
'use strict';
const VERSION='1.15.0-randomize-rebind';
const names=['雲生','阿照','沈行','林澈','姚安','唐簡','陳四','北舟','花瓊','楚服','陽月','戎衣'];

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

const $=id=>document.getElementById(id);
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function escRe(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function replaceCodes(text){let out=String(text??'');for(const [code,name] of Object.entries(CODE_ZH))out=out.replace(new RegExp(`(^|[^A-Za-z_])${escRe(code)}(?=戊|丁|丙|乙|甲|\\s|:|：|、|，|/|$|[^A-Za-z_])`,'g'),`$1${name}`);return out.replace(/(^|[^A-Za-z_])[A-Za-z][A-Za-z0-9_]{2,}(?=戊|丁|丙|乙|甲|\s|:|：|、|，|\/|$|[^A-Za-z_])/g,'$1未定身分')}
function roleText(value){const s=String(value||'');if(CODE_ZH[s])return CODE_ZH[s];const row=window.DaGoRoleRankPhraseTable?.[s];if(row?.name&&!/[A-Za-z_]/.test(row.name))return row.name;const rows=Object.values(window.ROLE_GROUPS||{}).flat();const hit=rows.find(x=>x[0]===s);if(hit?.[1]&&!/[A-Za-z_]/.test(hit[1]))return hit[1];return /[A-Za-z_]/.test(s)?'未定身分':s}
function selectedRoles(form){return [...form.querySelectorAll('[name="roles"]')].map(x=>x.value).filter(Boolean)}
function selectedRadio(form,name){return form.querySelector(`[name="${name}"]:checked`)?.parentElement?.textContent.trim()||''}
function randomizeGroup(form,name){const rows=[...form.querySelectorAll(`[name="${name}"]`)].filter(x=>!x.disabled);if(rows.length)pick(rows).checked=true}
function randomizeSelect(sel){const opts=[...sel.options].filter(x=>!x.disabled);if(opts.length)sel.value=pick(opts).value}
function summarizeRoles(form){const counts={};selectedRoles(form).forEach(r=>counts[r]=(counts[r]||0)+1);return replaceCodes(Object.entries(counts).map(([r,n])=>`${roleText(r)}${'戊丁丙乙甲'[Math.max(0,Math.min(4,n-1))]}`).join('、')||'未選')}
function enforceSpecialOrigins(form){const roles=new Set(selectedRoles(form));form.querySelectorAll('[data-requires-role]').forEach(input=>{const ok=roles.has(input.dataset.requiresRole);input.disabled=!ok;input.closest('label')?.classList.toggle('choice-disabled',!ok);if(!ok&&input.checked){const none=form.querySelector('[name="specialOrigin"][value="none"]');if(none)none.checked=true}})}
function cleansePreview(){const box=$('buildPreview');if(!box)return;const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(n=>{const next=replaceCodes(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next})}
function preview(){const form=$('startForm'), box=$('buildPreview');if(!form||!box)return;enforceSpecialOrigins(form);const name=$('playerName')?.value||'旅人';const text=[`姓名：${name}`,`身分：${summarizeRoles(form)}`,`出身：${selectedRadio(form,'origin')}`,`性格：${selectedRadio(form,'trait')}`,`外觀：${selectedRadio(form,'height')}、${selectedRadio(form,'build')}、${selectedRadio(form,'bodyLine')}、${selectedRadio(form,'skinTone')}、${selectedRadio(form,'face')}、${selectedRadio(form,'hairColor')}、${selectedRadio(form,'hairLength')}`,`身世：${selectedRadio(form,'specialOrigin')}`,`模式：${selectedRadio(form,'gameMode')} / ${selectedRadio(form,'difficulty')}`].map(replaceCodes);box.innerHTML='<h3>角色預覽</h3>'+text.map(x=>`<p>${x}</p>`).join('');setTimeout(cleansePreview,0)}
function randomize(){const form=$('startForm');if(!form)return;if($('playerName'))$('playerName').value=pick(names);['gender','height','build','bodyLine','skinTone','clothes','face','eyeColor','hairColor','hairLength','origin','trait','attributePlan','startSeason','gameMode','difficulty','textStyle'].forEach(n=>randomizeGroup(form,n));form.querySelectorAll('[name="roles"]').forEach(randomizeSelect);enforceSpecialOrigins(form);const specials=[...form.querySelectorAll('[name="specialOrigin"]')].filter(x=>!x.disabled);if(specials.length){specials.forEach(x=>x.checked=false);pick(specials).checked=true;}form.dispatchEvent(new Event('input',{bubbles:true}));form.dispatchEvent(new Event('change',{bubbles:true}));preview()}
function boot(){const form=$('startForm');if(!form||form.dataset.characterUi===VERSION)return;form.dataset.characterUi=VERSION;$('randomizeCharacter')?.addEventListener('click',e=>{e.preventDefault();randomize()});form.addEventListener('change',preview,true);form.addEventListener('input',preview,true);preview();setTimeout(preview,80);setTimeout(preview,260)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DaGoCharacterCreateUi={version:VERSION,preview,randomize,replaceCodes,roleText,CODE_ZH};
})();
