const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');const version='1.16.1-preserve-settings-dol-grammar';
const html=fs.readFileSync(path.join(root,'game.html'),'utf8');
const runtime=fs.readFileSync(path.join(root,'assets/dago-dol-like-runtime.js'),'utf8');
function must(t,k,l){if(!t.includes(k))throw new Error(l+': missing '+k)}
for(const token of ['身體','頭部','性格與身分','背景','遊戲設置','文字顯示'])must(html,token,'settings');
for(const token of ['gender','height','build','bodyLine','skinTone','clothes','face','eyeColor','hairColor','hairLength','roles','origin','trait','attributePlan','specialOrigin','startSeason','gameMode','difficulty','textStyle'])must(html,token,'form settings');
for(const token of ['ROLE_GROUPS','ROLE_SKILLS','BG_SKILLS','renderPreview','buildCharacter','STORY=String.raw',':: Start','<<link','<<check','<<goto','[['])must(runtime,token,'playable runtime');
for(const token of ['每一項身分、出身地、性格、屬性點配置、特殊身世皆提供 4 點技能值','allRowsHaveFourSkillPoints'])must(runtime,token,'balanced build');
console.log('Playable architecture validation passed for '+version);
