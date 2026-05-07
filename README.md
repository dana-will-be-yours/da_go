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
- 一般遊玩畫面只顯示角色、狀態、物品、紀錄與劇情文字。
- 夜宿札記可自動輪迴延伸 100 次，生成事件與 utterance。
- SMM、TMS、追溯、Team/PC 對照、JSON 匯出放在「開發者」面板。

## 來源對照

- GM / Researcher：大拿
- PC 陽月：Player 莉絲
- PC 楚服 / 楚璃詩：Player 南瓜
- PC 花瓊瑤：Player 佐拉

`【大國年代記】正史足跡` 視為同一個 Team 的 TRPG 產出。da_go 遊玩過程會累積 utterance，並可透過「開發者」面板匯出 JSON，供 `trpg-corpus-sqlserver` 匯入。
