# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲。開局時間為大興二十年八月，地點為南京。玩家輸入角色名字、選擇文字外觀後即可開始。

## 開啟

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

GitHub Pages 入口會轉到 `game.html`。

## 遊戲內容

- 開場：大興二十年八月，南京。
- 形式：DOL 式左欄、passage 文字、藍色文字選項。
- Runtime：可讀取 `da_go_runtime_bundle_v1`，內容含 passage、choice、state、NPC 關係與 event pool。
- 選項：支援條件檢查與效果套用，例如金錢、疲勞、旗標、物品、技能與 NPC 關係。
- 事件：選項後可依 event pool 觸發額外事件，並保存冷卻、每日次數與 playlog。
- 沙盒：預設內容含南京行動地圖、結案條件、醫館、短工、南市、官署、北路、夜宿與結案札記。
- 壓力：飢餓、疲勞、疑心與注目會影響檢定，失控時會把玩家迫回客舍休整。
- 一般遊玩畫面只顯示角色、狀態、物品、紀錄與劇情文字。
- 夜宿札記可自動輪迴延伸 100 次，生成事件與 utterance。
- SMM、TMS、追溯、Team/PC 對照、JSON 匯出放在「開發者」面板。

## TRPG Corpus 對接

開發者面板可匯入兩種 JSON：

- `da_go_runtime_bundle_v1`：由 `trpg-corpus-sqlserver` 的 `dbo.usp_Export_DaGo_Runtime_Bundle` 或 `/api/runtime-bundle` 產生，前端優先使用。
- `da_go_world_manifest_v1`：舊資料格式，前端仍會轉成可遊玩的 passage。

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

`【大國年代記】正史足跡` 視為同一個 Team 的 TRPG 產出。da_go 遊玩過程會累積 utterance，並可透過「開發者」面板匯出 JSON，供 `trpg-corpus-sqlserver` 匯入。
