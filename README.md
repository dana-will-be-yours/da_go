# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲前端。現行版本為 `1.13.2-direct-split`，以 `trpg-corpus-sqlserver` 的 runtime bundle 作為劇本資料來源。

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.13.2-direct-split
```

## 目前架構

```text
入口頁：game.html
Runtime：assets/game-runtime.js
完整遊戲本體：assets/game-modular.js
資料包載入：assets/game-bundle-loader.js
牌組核心：assets/engine/deck.js
戰鬥核心：assets/engine/combat.js
側欄核心：assets/engine/sidebar.js
拆分載入器：assets/engine-split-loader.js
事件核心：assets/engine/events.js
場景核心：assets/engine/passage.js
存檔核心：assets/engine/save.js
語料輸出：assets/engine/export-playlog.js
劇本資料：assets/data/dago-changshan-v1-bundle.json
劇本擴充：assets/data/dago-changshan-v1-extension.json
```

## 1.13.2-direct-split 原則

保留完整 `assets/game-modular.js` 作為遊戲本體。禁止在 Pages artifact 中以精簡版、極小版或薄殼 orchestrator 覆蓋 `game-modular.js`。

`game-runtime.js` 原始碼已直接載入 `assets/engine-split-loader.js`。`engine-split-loader.js` 會載入 `assets/engine/deck.js`、`assets/engine/combat.js`、`assets/engine/sidebar.js`。這三個 engine 是正式拆分模組，後續應逐段把 `game-modular.js` 內部重複邏輯改成呼叫 `DaGoDeck`、`DaGoCombat`、`DaGoSidebar`，不得用刪減遊戲本體的方式取代。

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

CI 工作流程：

```text
.github/workflows/trpg-runtime-bundle.yml
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
http://localhost:8080/game.html?reset=1&v=1.13.2-direct-split
```
