# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲前端。現行公開版本為 `1.12.4-combat`，目標是以 `trpg-corpus-sqlserver` 的語料與劇情資料輸出 runtime bundle，再由 `da_go` 讀取並轉成可遊玩的單人文字遊戲。

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.12.4-combat
```

## 目前版本

```text
Runtime: 1.12.4-combat
入口頁：game.html
發布流程：.github/workflows/pages.yml
部署前修補：tools/apply-static-runtime.js
公開頁驗證：tools/validate-public-page.js
runtime manifest：assets/game-manifest.js
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
劇本摘要：assets/data/scenarios/xiaocheng-jiushi.json
```

`game.html` 保留完整角色建立頁。GitHub Pages 部署時會執行 `tools/apply-static-runtime.js`，將公開 artifact 改成靜態 `defer` script 順序載入，避免 runtime loader 重複載入 engine。

## 已修正的公開頁問題

目前主分支已處理下列硬錯：

```text
1. 舊公開頁仍吃 v=1.12.1-perf 快取。
2. Pages artifact 曾同時載入 game-runtime.js 與靜態 engine，導致重複初始化。
3. game-choice-delegation-fix.js 可能造成遞迴或雙重觸發，發布清單已不再載入該檔。
4. 公開頁部署前會跑 validate-public-page.js，檢查 startForm、playPanel、choiceList 與核心 runtime symbol。
```

目前仍需注意：瀏覽器 DevTools 顯示的 CSP `unsafe-eval` 警告若未指向 `assets/*.js`，通常不是 `da_go` 主程式直接觸發。主倉庫搜尋不應出現 `eval` 或 `new Function` 作為遊戲 runtime 的執行路徑。

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

## 1.12.4-combat 戰鬥系統

`assets/game-modular.js` 已加入教學戰鬥。角色建立後會進入夢中戰鬥，使用接近 DoL 的狀態驅動戰鬥結構：

```text
state.combat.active
state.combat.returnPassage
state.combat.round
state.combat.enemies
state.combat.playerGuard
state.combat.log
```

敵人狀態包含：

```text
hp / hpMax
trust
anger
damage
tags
```

玩家行動以按鈕卡形式呈現：

```text
斬擊
刺擊
鈍擊
防守
閃避
威嚇
求和
使用持有物
```

每個行動會進行 `4D3` 檢定，並把結果寫入 `state.history` 與 `state.events`。戰鬥結束後會回到 runtime bundle 指定場景，並寫入 journal 與 notes。

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
.	ools	sync-trpg-runtime-bundle.ps1
```

正確檔名為：

```powershell
.	ools\sync-trpg-runtime-bundle.ps1 -Server ".\SQLEXPRESS" -Database "TRPG_Corpus_DB"
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
http://localhost:8080/game.html?reset=1&v=1.12.4-combat
```

## GitHub Pages 部署

GitHub Pages workflow：

```text
.github/workflows/pages.yml
```

部署前會修補公開 artifact 的 `game.html`，使其載入靜態 engine 清單：

```text
assets/game-manifest.js
assets/game-bundle-loader.js
assets/engine/state.js
assets/engine/rules.js
assets/engine/checks.js
assets/engine/effects.js
assets/engine/passage.js
assets/engine/save.js
assets/engine/export-playlog.js
assets/game-v6-hotfix.js
assets/game-modular.js
```

## 相關 repository

```text
https://github.com/dana-will-be-yours/da_go
https://github.com/dana-will-be-yours/trpg-corpus-sqlserver
```
