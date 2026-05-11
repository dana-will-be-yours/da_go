# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲前端。現行開發版本為 `1.13.1-engine-split`，以 `trpg-corpus-sqlserver` 的 runtime bundle 作為劇本資料來源，前端負責角色建立、場景互動、事件池、關係、戰鬥手札、存檔與 playlog 匯出。

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.13.1-engine-split
```

## 目前版本

```text
Runtime: 1.13.1-engine-split
入口頁：game.html
發布流程：.github/workflows/pages.yml
資料閉環流程：.github/workflows/trpg-runtime-bundle.yml
部署前修補：tools/apply-static-runtime.js
公開頁驗證：tools/validate-public-page.js
可玩架構驗證：tools/validate-playable-architecture.js
runtime 驗證：tools/validate-runtime.js
資料包載入：assets/game-bundle-loader.js
正式 UI 核心：assets/ui-core.js
狀態核心：assets/engine/state.js
規則核心：assets/engine/rules.js
檢定核心：assets/engine/checks.js
效果核心：assets/engine/effects.js
場景核心：assets/engine/passage.js
事件核心：assets/engine/events.js
牌組核心：assets/engine/deck.js
戰鬥核心：assets/engine/combat.js
側欄核心：assets/engine/sidebar.js
拆分載入器：assets/engine-split-loader.js
存檔核心：assets/engine/save.js
語料輸出：assets/engine/export-playlog.js
角色建立修正：assets/game-v6-hotfix.js
主遊戲相容層：assets/game-modular.js
預設資料包：assets/data/dago-changshan-v1-bundle.json
常山劇本擴充：assets/data/dago-changshan-v1-extension.json
```

## 本版完成重點

`1.13.1-engine-split` 針對 `game-modular.js` 負責過重的問題進行第一階段拆分：

```text
1. 新增 assets/engine/deck.js，提供 DaGoDeck，處理 ownedCards、deckCodes、drawPile、hand、discard、抽牌、棄牌與式囊編排 HTML。
2. 新增 assets/engine/combat.js，提供 DaGoCombat，處理 combat.active、round、enemies、出牌、敵方回合、戰鬥結束與衝突 UI HTML。
3. 新增 assets/engine/sidebar.js，提供 DaGoSidebar，處理完整左側狀態欄與 panel HTML。
4. 新增 assets/engine-split-loader.js，在公開 artifact 中補載 deck/combat/sidebar 三個拆分模組。
5. 更新 tools/validate-runtime.js，驗證 DaGoDeck、DaGoCombat、DaGoSidebar 及 engine-split-loader 的載入關係。
```

## Runtime 載入順序

公開頁使用完整 dynamic runtime，不使用簡易頁。基礎 loader 會載入：

```text
assets/scenario-select.js
assets/game-bundle-loader.js
assets/engine/state.js
assets/engine/rules.js
assets/engine/checks.js
assets/engine/effects.js
assets/engine/passage.js
assets/engine/events.js
assets/engine/save.js
assets/engine/export-playlog.js
assets/ui-core.js
assets/game-v6-hotfix.js
assets/character-create-ui.js
assets/game-rules-ui-fix.js
assets/game-character-balance-fix.js
assets/game-modular.js
```

Pages artifact 會由 `tools/apply-static-runtime.js` 追加：

```text
assets/engine-split-loader.js
```

再由 `engine-split-loader.js` 載入：

```text
assets/engine/deck.js
assets/engine/combat.js
assets/engine/sidebar.js
```

## 劇本資料與事件池

基礎資料包：

```text
assets/data/dago-changshan-v1-bundle.json
```

擴充資料包：

```text
assets/data/dago-changshan-v1-extension.json
```

`assets/game-bundle-loader.js` 會在讀取基礎 bundle 後自動合併 extension。驗證門檻：

```text
passages >= 12
relationships >= 5
event_pools >= 4
```

## TRPG Corpus 整合

資料庫端由 `trpg-corpus-sqlserver` 提供 runtime bundle 匯出程序：

```sql
EXEC dbo.usp_Export_DaGo_Runtime_Bundle
    @project_code = N'DAGO',
    @team_code = N'DAGO-T01',
    @session_code = N'DC10-XIAOCHENG-001';
```

`da_go` 同步工具：

```powershell
.\tools\sync-trpg-runtime-bundle.ps1 -Server ".\SQLEXPRESS" -Database "TRPG_Corpus_DB"
```

CI 工作流程：

```text
.github/workflows/trpg-runtime-bundle.yml
```

此 workflow 在 PR 中會驗證目前 bundle；手動執行時若選擇 `run_sql_export=true`，會讀取 repository secrets：

```text
DAGO_SQL_SERVER
DAGO_SQL_DATABASE
```

並執行 `tools/sync-trpg-runtime-bundle.ps1`。

`da_go` 遊玩紀錄可輸出 `da_go_playlog_json_v2`，對應匯入方向：

```text
stg.DaGo_PlayLog_Import -> stg.Utterance_Import -> dbo.Utterance
```

## 本機驗證

```powershell
npm test
```

此命令會執行：

```text
node tools/validate-runtime.js
node tools/apply-static-runtime.js
node tools/validate-public-page.js
node tools/validate-playable-architecture.js
```

本機啟動：

```powershell
python -m http.server 8080
```

測試網址：

```text
http://localhost:8080/game.html?reset=1&v=1.13.1-engine-split
```

## 相關 repository

```text
https://github.com/dana-will-be-yours/da_go
https://github.com/dana-will-be-yours/trpg-corpus-sqlserver
```
