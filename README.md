# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲。開局地點為南京。玩家輸入角色名字，設定身體、頭部、性格背景、起始時節、遊戲模式、難度與文字外觀後即可開始。

## 公開頁

GitHub Pages：

```text
https://dana-will-be-yours.github.io/da_go/game.html
```

目前公開驗證網址：

```text
https://dana-will-be-yours.github.io/da_go/game.html?v=1.9.2-fix2
```

本輪 main 版本參數：

```text
https://dana-will-be-yours.github.io/da_go/game.html?v=1.9.3-authoring-pages
```

若要避開瀏覽器快取，可在網址後加上版本參數：

```text
https://dana-will-be-yours.github.io/da_go/game.html?v=<commit-or-version>
```

目前頁面由 `game.html` 載入 `assets/game-runtime.js`，再載入 `assets/game-preload-cache.js`、`assets/game-v6-hotfix.js` 與主要遊戲檔 `assets/game-playable-v6.js`。

## 本機開啟

```text
C:\Users\sun\Documents\New project\da_go\game.html
```

或使用本機伺服器：

```powershell
cd "C:\Users\sun\Documents\New project\da_go"
python -m http.server 8080
```

```text
http://localhost:8080/game.html
```

## 遊戲內容

- 開場：南京，可由開局表單選擇春、夏、秋、冬。
- 形式：DOL 式左欄、passage 文字、藍色文字選項。
- Runtime：以 `assets/game-playable-v6.js` 為唯一遊戲主體，可讀取 `assets/data/dago-nanjing-v5-bundle.json` 與 `trpg-corpus-sqlserver` 匯出的 `da_go_runtime_bundle_v1`。
- 選項：支援條件檢查與效果套用，例如金錢、疲勞、旗標、物品、技能與 NPC 關係；條件不足會在玩家選擇後顯示原因。
- 事件：選項後可依 event pool 觸發額外事件，並保存冷卻、每日次數與 playlog。
- 沙盒：預設內容含南京行動地圖、結案條件、醫館、短工、南市、官署、北路、夜宿與結案札記。
- 壓力：飢餓、疲勞、疑心與注目會影響檢定，失控時會把玩家迫回客舍休整。
- 休息：夜宿時會打開休息至何時選單，可選小睡、清晨、正午、黃昏或入夜，時間與狀態會同步結算。
- 開局：身體、頭部、身分品級、配點、特殊身世、遊戲模式與技能檢定成功率顯示都可設定，並提供隨機化按鈕。
- 左欄：概覽下方常駐精神、鎮定、疲勞、飢餓、注目、疑心簡表；詳細屬性、社交、特質、日誌、統計、成就、選項、存檔與研究者面板採點選後開啟。
- 研究者：遊戲內可匯出 playlog；劇情編寫移至 `trpg-corpus-sqlserver` 的 GitHub Pages 編輯頁，產生 JSON 後送到 `/api/researcher-stories`。
- 夜宿札記可自動輪迴延伸 100 次，生成事件與 utterance。
- SMM、TMS、追溯、Team/PC 對照、JSON 匯出放在「研究者 > 研究資料輸出」。

## 程式入口

- `game.html`：公開頁與本機入口。
- `assets/game-runtime.js`：統一載入入口，保留版本、來源清單與研究者公開頁連結。
- `assets/game-preload-cache.js`：檢查樣式、熱修正、主遊戲檔與南京資料包。
- `assets/game-playable-v6.js`：目前唯一遊戲主體，含 passage、選項、狀態、休息、角色建立、面板與 JSON 匯出。
- `assets/game-v6-hotfix.js`：角色建立選項補丁。
- `assets/game-corpus.js`、`assets/game-direct.js`、`assets/game-dol.js`、`assets/game-playable-v2.js` 至 `assets/game-playable-v5-bundle-loader.js`：舊入口相容檔，會導向 `assets/game-runtime.js`。
- `assets/game-screen.css`：DOL 式文字頁與左欄樣式。
- `assets/game-v4.css`：卡片、地圖與部分面板樣式。
- `assets/data/dago-nanjing-v5-bundle.json`：南京篇資料包。
- `docs/sample-runtime-bundle.json`：本機測試資料。
- `da_goTRPG遊戲運作指南.docx`：目前 GitHub 主線保存的操作文件。
- `文本資料參考/`：大國年代記世界觀、TRPG 團錄與二創小說參考檔。

## TRPG Corpus 對接

研究者面板可匯入兩種 JSON：

- `da_go_runtime_bundle_v1`：由 `trpg-corpus-sqlserver` 的 `dbo.usp_Export_DaGo_Runtime_Bundle` 或 `/api/runtime-bundle` 產生，前端優先使用。
- `da_go_world_manifest_v1`：舊資料格式，前端仍會轉成可遊玩的 passage。

研究者資料送出端點：

```text
POST http://localhost:8787/api/researcher-stories
POST http://localhost:8787/api/dago-playlogs
POST http://localhost:8787/api/dago-game-runs
GET  http://localhost:8787/api/authoring-reference
```

本機 API 範例：

```text
http://localhost:8787/api/runtime-bundle?project_code=DAGUO&team_code=DAGUO-T01&session_code=DA20-CORPUS-RPG-001
```

本機靜態測試資料：

```text
http://localhost:8080/docs/sample-runtime-bundle.json
```

## 來源對照

- GM / Researcher：大拿
- PC 陽月：Player 莉絲
- PC 楚服 / 楚璃詩：Player 南瓜
- PC 花瓊瑤：Player 佐拉

`【大國年代記】正史足跡` 視為同一個 Team 的 TRPG 產出。da_go 遊玩過程會累積 utterance，並可透過「研究者 > 研究資料輸出」匯出 JSON，供 `trpg-corpus-sqlserver` 匯入。
