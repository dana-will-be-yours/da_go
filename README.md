# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲前端。現行版本為 `1.14.2-dol-select-combat`，以 `trpg-corpus-sqlserver` 的 runtime bundle 作為劇本資料來源。

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.14.2-dol-select-combat
```

## 1.14.2 修正重點

本版關閉卡牌戰鬥介面，改為下拉式衝突行動。玩家在衝突中以選單選擇「攻擊、自衛、說服、觀察環境、利用環境、使用物品、退避、觀望」。

本版修正技能值顯示仍出現英文鍵名的問題。`assets/game-skill-label-zh.js` 會在角色預覽、左側狀態欄、場景文字與覆蓋面板中將技能鍵名轉為繁體中文。

本版保留完整 `assets/game-modular.js` 作為遊戲本體。禁止用精簡頁或薄殼覆蓋主遊戲。

## 目前架構

```text
入口頁：game.html
Runtime：assets/game-runtime.js
完整遊戲本體：assets/game-modular.js
資料包載入：assets/game-bundle-loader.js
中文技能標籤：assets/game-skill-label-zh.js
下拉式衝突：assets/game-dol-select-combat.js
事件核心：assets/engine/events.js
場景核心：assets/engine/passage.js
存檔核心：assets/engine/save.js
語料輸出：assets/engine/export-playlog.js
劇本資料：assets/data/dago-changshan-v1-bundle.json
劇本擴充：assets/data/dago-changshan-v1-extension.json
```

## TRPG Corpus 整合

```sql
EXEC dbo.usp_Export_DaGo_Runtime_Bundle
    @project_code = N'DAGO',
    @team_code = N'DAGO-T01',
    @session_code = N'DC10-XIAOCHENG-001';
```

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
http://localhost:8080/game.html?reset=1&v=1.14.2-dol-select-combat
```
