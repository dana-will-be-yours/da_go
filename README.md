# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲前端。現行公開版本為 `1.12.10-card-ui`，目標是以 `trpg-corpus-sqlserver` 的語料與劇情資料輸出 runtime bundle，再由 `da_go` 讀取並轉成可遊玩的單人文字遊戲。

公開頁：

```text
[https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.12.10-card-ui](https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.12.11-bg-cards)
```

## 目前版本

```text
Runtime: 1.12.10-card-ui
入口頁：game.html
發布流程：.github/workflows/pages.yml
部署前修補：tools/apply-static-runtime.js
公開頁驗證：tools/validate-public-page.js
資料包載入：assets/game-bundle-loader.js
狀態核心：assets/engine/state.js
規則核心：assets/engine/rules.js
檢定核心：assets/engine/checks.js
效果核心：assets/engine/effects.js
場景核心：assets/engine/passage.js
存檔核心：assets/engine/save.js
語料輸出：assets/engine/export-playlog.js
角色建立修正：assets/game-v6-hotfix.js
角色建立預覽：assets/character-create-ui.js + assets/game-rules-ui-fix.js
完整左欄狀態：assets/game-rules-ui-fix.js
主遊戲與戰鬥：assets/game-modular.js
預設資料包：assets/data/dago-changshan-v1-bundle.json
劇本摘要：assets/data/scenarios/xiaocheng-jiushi.json
```

## 1.12.10-card-ui 修正重點

此版本針對公開頁與 UI 做兩項硬性修正：

```text
1. 角色預覽必須顯示調整值與技能值。
2. 進入遊戲後左側狀態欄禁止使用簡化欄，必須顯示完整狀態。
```

`assets/game-rules-ui-fix.js` 現在會補上：

```text
角色預覽：body / tech / mind 技能總和與調整值
角色預覽：技能值列表
左側欄：角色名、日期、turn
左側欄：精神、鎮定、疑心、疲勞、飢餓、錢、氣血
左側欄：body / tech / mind 調整值
左側欄：技能值
左側欄：戰鬥狀態與行動數
左側欄：人物關係
```

`tools/validate-public-page.js` 會檢查 `game-rules-ui-fix.js` 中存在下列必要項：

```text
preview-detail-block
full-status-sidebar
renderFullSidebar
addPreviewDetail
```

## Runtime 載入順序

公開頁仍以完整 dynamic runtime 載入，不使用簡易頁，不使用極小 CSP boot 頁：

```text
assets/scenario-select.js
assets/game-bundle-loader.js
assets/engine/state.js
assets/engine/rules.js
assets/engine/checks.js
assets/engine/effects.js
assets/engine/passage.js
assets/engine/save.js
assets/engine/export-playlog.js
assets/game-v6-hotfix.js
assets/character-create-ui.js
assets/game-rules-ui-fix.js
assets/game-character-balance-fix.js
assets/game-modular.js
```

## 劇本設定

```text
時間：大興十年
地點：天津郡 常山縣
玩家可見內容：縣城生活、短工、問訊、休息、修習、人物往來、地方事件
研究者隱藏目標：在此地找到工作生活一年
研究者隱藏分支：一年內遇到多名 NPC，依玩家行動發展關係與事件
```

玩家端不顯示研究目標與研究指標。研究者劇情編寫、資料匯出與資料庫匯入集中在 `trpg-corpus-sqlserver`。

## 角色建立

角色建立欄位包含：

```text
身體：性別、高矮、胖瘦體型、身體線條、膚色、初始衣物
樣貌：面容儀態、瞳色、髮色、頭髮長度
身分：五組身分選擇，可重複
背景：出身地、性格、屬性點配置、特殊身世
遊戲設置：起始時節、遊戲模式、難度、技能檢定成功率顯示
文字外觀：標準、書卷、夜讀、大字
```

`assets/game-v6-hotfix.js` 會把身分選項擴充為 8 類、32 個身分，並處理門派特殊身世限制。岐山葉氏與其他江湖門派外緣需至少一個身分為「門派弟子」才可選取。

## 檢定規則

行動檢定固定為：

```text
4D3 + 屬性調整值 + 技能值 + 狀態修正
```

此數值與行動難度 `DC` 比較：

```text
檢定值 >= DC：成功
檢定值 < DC：失敗
```

常用 DC：

```text
8  簡單
10 基礎挑戰
12 標準挑戰
14 困難
16 很困難
18 極難
20 傳奇級
22+ 非常規
```

狀態會影響檢定：精神過低、鎮定過低、疑心過高、疲勞過高、飢餓過高都會造成減值。

## 戰鬥系統

`assets/game-modular.js` 已把教學衝突改為手札式文字卡牌。角色建立後會進入夢中衝突，流程為起式、用行令出式牌、收合、敵方合：

```text
state.combat.active
state.combat.encounter_code
state.combat.returnPassage
state.combat.win_passage
state.combat.escape_passage
state.combat.loss_passage
state.combat.combat_tags
state.combat.round
state.combat.phase
state.combat.energy / energyMax
state.combat.enemies
state.combat.playerGuard
state.combat.playerTags
state.combat.drawPile
state.combat.hand
state.combat.discardPile
state.combat.exhaustPile
state.combat.log
```

敵手狀態包含：

```text
hp / hpMax
trust
anger
damage
intent
tags
```

玩家行動以式牌呈現：

```text
式囊
手札
棄式
絕式
行令
守勢
敵勢
收合
目標達成 / 脫出 / 敗退
```

每張式牌沿用 `window.DaGoChecks.test({ skill, dc }, state)`。結果會寫入 `state.history`、`state.events`、`state.notes`、`state.journal`、`state.actionCounts`。

## Runtime bundle

前端預設讀取：

```text
assets/data/dago-changshan-v1-bundle.json
```

載入順序由 `assets/game-bundle-loader.js` 處理：

```text
1. URL 指定 bundle
2. localStorage 匯入 bundle
3. assets/data/dago-changshan-v1-bundle.json
4. fallback bundle
```

可用 URL 指定 bundle：

```text
game.html?bundle=assets/data/dago-changshan-v1-bundle.json&reset=1
```

## TRPG Corpus 整合

資料庫端由 `trpg-corpus-sqlserver` 提供 runtime bundle 匯出程序：

```sql
EXEC dbo.usp_Export_DaGo_Runtime_Bundle
    @project_code = N'DAGO',
    @team_code = N'DAGO-T01',
    @session_code = N'DC10-XIAOCHENG-001';
```

`da_go` 提供同步工具：

```powershell
.\tools\sync-trpg-runtime-bundle.ps1 -Server ".\SQLEXPRESS" -Database "TRPG_Corpus_DB"
```

輸出位置：

```text
assets/data/dago-changshan-v1-bundle.json
```

`da_go` 遊玩紀錄可輸出 `da_go_playlog_json_v2`，對應匯入方向：

```text
stg.DaGo_PlayLog_Import -> stg.Utterance_Import -> dbo.Utterance
```

## 本機驗證

安裝不需要額外套件，使用 Node.js 直接跑：

```powershell
npm test
```

此命令會執行：

```text
node tools/validate-runtime.js
node tools/apply-static-runtime.js
node tools/validate-public-page.js
```

本機啟動：

```powershell
python -m http.server 8080
```

測試網址：

```text
http://localhost:8080/game.html?reset=1&v=1.12.10-card-ui
```

## GitHub Pages 部署

GitHub Pages workflow：

```text
.github/workflows/pages.yml
```

部署前會將 `game.html` 的 runtime 版本字串修補為 `1.12.10-card-ui`，並執行公開頁驗證。

## 相關 repository

```text
https://github.com/dana-will-be-yours/da_go
https://github.com/dana-will-be-yours/trpg-corpus-sqlserver
```
