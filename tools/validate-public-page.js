const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const expectedVersion = '1.12.13-deckbuilder';
const html = fs.readFileSync(path.join(root, 'game.html'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'assets/game-runtime.js'), 'utf8');
const modular = fs.readFileSync(path.join(root, 'assets/game-modular.js'), 'utf8');
const hotfix = fs.readFileSync(path.join(root, 'assets/game-v6-hotfix.js'), 'utf8');
const rules = fs.readFileSync(path.join(root, 'assets/game-rules-ui-fix.js'), 'utf8');
for (const id of ['startForm','playPanel','choiceList','buildPreview','randomizeCharacter','overviewBox']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`missing #${id}`);
}
if (!html.includes(`assets/game-runtime.js?v=${expectedVersion}`)) throw new Error('wrong public runtime version');
if (!runtime.includes(`const VERSION='${expectedVersion}';`)) throw new Error('wrong runtime manifest version');
for (const s of ['scenario-select.js','game-bundle-loader.js','engine/state.js','engine/rules.js','engine/checks.js','engine/effects.js','engine/passage.js','engine/save.js','engine/export-playlog.js','game-v6-hotfix.js','character-create-ui.js','game-rules-ui-fix.js','game-character-balance-fix.js','game-modular.js']) {
  if (!runtime.includes(s)) throw new Error(`runtime missing ${s}`);
}
if (runtime.includes('panel-enhance-v127.js')) throw new Error('external panel enhancer must not be loaded');
for (const f of ['assets/scenario-select.js','assets/game-bundle-loader.js','assets/engine/state.js','assets/engine/rules.js','assets/engine/checks.js','assets/engine/effects.js','assets/engine/passage.js','assets/engine/save.js','assets/engine/export-playlog.js','assets/game-v6-hotfix.js','assets/character-create-ui.js','assets/game-rules-ui-fix.js','assets/game-character-balance-fix.js','assets/game-modular.js']) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) throw new Error(`missing ${f}`);
  new Function(fs.readFileSync(p, 'utf8'));
}
for (const token of ['formatStoryTime','monthName','xunName','大興十年','settleAfterDream','nextPurpose']) {
  if (!modular.includes(token)) throw new Error(`time runtime missing ${token}`);
}
for (const token of ['poolEventsFor','relationshipChoices','eventChoices','applyDailyEvent','event_hook']) {
  if (!modular.includes(token)) throw new Error(`event runtime missing ${token}`);
}
for (const token of ['deckBuilderHtml','ensureDeckBuild','buildOwnedCards','deckCodesForCombat','ownedCards','deckCodes','data-deck-add','data-deck-remove','式囊編排','佐藥','噬魂曲','吹角連營','借財通路']) {
  if (!modular.includes(token)) throw new Error(`deck runtime missing ${token}`);
}
for (const token of ['DaGoOriginSpecialV113','依五項身分開放大國世家','將門之子','大興崔氏旁支','蓬萊崑崙外系','洞庭五毒外緣','華陰九曲外門','崑崙外州','邊防關部伍','文選']) {
  if (!hotfix.includes(token)) throw new Error(`hotfix missing ${token}`);
}
for (const token of ['preview-detail-block','full-status-sidebar','renderFullSidebar','addPreviewDetail']) {
  if (!rules.includes(token)) throw new Error(`rules ui missing ${token}`);
}
console.log('Deckbuilder runtime validation passed.');
