# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲前端。現行版本為 `1.14.1-start-hotfix`，以 `trpg-corpus-sqlserver` 的 runtime bundle 作為劇本資料來源。

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.14.1-start-hotfix
```

## 目前架構

```text
入口頁：game.html
Runtime：assets/game-runtime.js
完整遊戲本體：assets/game-modular.js
資料包載入：assets/game-bundle-loader.js
中文顯示守門：assets/game-zh-tw-guard.js
簡易衝突模式：assets/game-simple-conflict-mode.js
事件核心：assets/engine/events.js
場景核心：assets/engine/passage.js
存檔核心：assets/engine/save.js
語料輸出：assets/engine/export-playlog.js
劇本資料：assets/data/dago-changshan-v1-bundle.json
劇本擴充：assets/data/dago-changshan-v1-extension.json
```

## 1.14.1 修正重點

開始遊戲後卡頓的主因是 `assets/game-zh-tw-guard.js` 與 `assets/game-simple-conflict-mode.js` 監看整個 `body`，在遊戲渲染時反覆掃描與改寫 DOM。`1.14.1-start-hotfix` 已移除這兩個全頁監看流程。

遊戲內顯示文字必須使用繁體中文。`assets/game-zh-tw-guard.js` 目前只做啟動時有限量替換，不再持續重掃整頁。

保留完整 `assets/game-modular.js` 作為遊戲本體。禁止在 Pages artifact 中以精簡版、極小版或薄殼 orchestrator 覆蓋 `game-modular.js`。

目前戰鬥介面維持簡易衝突模式。`assets/game-simple-conflict-mode.js` 隱藏手札、式牌與牌組編排顯示，只保留「進擊、防守、交涉、觀望」四種簡易操作，並改為低頻更新，避免阻塞開始遊戲流程。

## TRPG Corpus 整合

資料庫端 runtime bundle 匯出：

```sql
EXEC dbo.usp_Export_DaGo_Runtime_Bundle
    @project_code = N'DAGO',
    @team_code = N'DAGO-T01',
    @session_code = N'DC10-XIAOCHENG-001';
```

同步工具：

```powershell
.\tools\sync-trpg-runtime-bundle.ps1 -Server ".\SQLEXPRESS" -Database "TRPG_Corpus_DB"
```

遊玩紀錄匯出方向：

```text
stg.DaGo_PlayLog_Import -> stg.Utterance_Import -> dbo.Utterance
```

## 驗證

```powershell
npm test
```

本機測試：

```powershell
python -m http.server 8080
```

```text
http://localhost:8080/game.html?reset=1&v=1.14.1-start-hotfix
```
