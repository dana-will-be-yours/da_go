# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲前端。現行公開版本為 `1.12.13-deckbuilder`，以 `trpg-corpus-sqlserver` 的 runtime bundle 作為劇本資料來源，前端負責角色建立、場景互動、事件池、關係、戰鬥手札、存檔與 playlog 匯出。

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.12.13-deckbuilder
```

## 目前版本

```text
Runtime: 1.12.13-deckbuilder
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
主遊戲與戰鬥：assets/game-modular.js
預設資料包：assets/data/dago-changshan-v1-bundle.json
```

## 本版修正重點

`1.12.13-deckbuilder` 針對角色建立與戰鬥式牌系統補強：

```text
1. 出身地擴充為常山縣、天津郡、衡水縣、珩灣縣、滄北邑、南京、江郡、南陽郡、銀川郡、崑崙外州、洞庭五毒境、華陰山麓、東萊郡、劍南郡、南疆邊郡、太湖郡、商丘郡。
2. 特殊身世會依五項身分動態開放大國世家、將門與門派舊緣。
3. 戰鬥式牌依技能值、出身、性格、特殊身世與身分增加可用牌。
4. 屬性欄加入式囊編排，玩家可自行調整戰鬥攜帶牌。
5. event_pools 與 relationships 已接入每日行動與地點事件。
6. 劇情時間格式統一為大興十年X月X日 上/中/下旬 X時。
```

## Runtime 載入順序

公開頁使用完整 dynamic runtime，不使用簡易頁：

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

## TRPG Corpus 整合

資料庫端由 `trpg-corpus-sqlserver` 提供 runtime bundle 匯出程序：

```sql
EXEC dbo.usp_Export_DaGo_Runtime_Bundle
    @project_code = N'DAGO',
    @team_code = N'DAGO-T01',
    @session_code = N'DC10-XIAOCHENG-001';
```

`da_go` 預設讀取：

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
```

本機啟動：

```powershell
python -m http.server 8080
```

測試網址：

```text
http://localhost:8080/game.html?reset=1&v=1.12.13-deckbuilder
```

## 相關 repository

```text
https://github.com/dana-will-be-yours/da_go
https://github.com/dana-will-be-yours/trpg-corpus-sqlserver
```
