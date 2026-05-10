# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲。現行劇本為「小城舊事」，時間是大興十年，地點是天津郡常山縣。玩家是常山縣本地人，從東門、客棧、市集、縣衙、河埠、工坊、田里與橋北租屋展開長期生活型文字遊戲。

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?v=1.11.1-xiaocheng-local
```

## 目前版本

```text
Runtime: 1.11.1-xiaocheng-local
入口：assets/game-runtime.js
主遊戲：assets/game-playable-v6.js
角色建立：assets/game-v6-hotfix.js
身分品級表：assets/game-character-balance-fix.js
面板補強：assets/game-rules-ui-fix.js
劇本選擇：assets/scenario-select.js
備用資料包：assets/data/dago-changshan-v1-bundle.json
劇本摘要：assets/data/scenarios/xiaocheng-jiushi.json
```

`game.html` 直接載入 `assets/game-runtime.js`。舊入口檔保留相容用途，會轉載同一份 runtime。

## 劇本設定

```text
時間：大興十年
地點：天津郡 常山縣
玩家可見內容：縣城生活、短工、問訊、休息、修習、人物往來、地方事件
研究者隱藏目標：在此地找到工作生活一年
研究者隱藏分支：一年內遇到多名 NPC，依玩家行動發展關係與事件
```

玩家端不顯示研究目標與研究指標。劇情編寫、資料匯出與資料庫匯入集中在 `trpg-corpus-sqlserver` 研究者頁。

## 角色建立

角色建立欄位包含：

```text
身體：性別、高矮、胖瘦體型、身體線條、膚色、初始衣物
樣貌：面容儀態、瞳色、髮色、頭髮長度
身分：五組身分選擇，可重複
背景：出身地、性格、屬性點配置、特殊身世
名聲：正 / 邪 / 奇；經驗欄取消，固定為 1
遊戲設置：起始時節、遊戲模式、難度、技能檢定成功率顯示
文字外觀：標準、書卷、夜讀、大字
```

岐山葉氏與其他江湖門派外緣都需至少一個身分為「門派弟子」才可選取。

## 身分與品級

五組身分允許重複。重複次數換算品級：

```text
1 次：戊
2 次：丁
3 次：丙
4 次：乙
5 次：甲
```

`assets/game-character-balance-fix.js` 寫入 32 個身分 × 5 個品級短句完整表。角色建立預覽與屬性面板會顯示：

```text
身分品級與短句
外觀文字描述
體魄、技巧、智識調整值
技能值
持有物
```

角色建立技能值已降量：每個身分只給一項起始技能，屬性點配置、出身地、性格與特殊身世各自提供少量技能或狀態變化，技能上限為 5。技能值高於 5 時顯示：

```text
此項已達最大值，鑽研再深入亦無用
```

## 檢定規則

行動檢定固定為：

```text
4D3+調整值+技能值
```

此數值與行動難度 `DC` 比較：

```text
檢定值 >= DC：成功
檢定值 < DC：失敗
```

DC 表：

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

狀態會影響檢定：

```text
精神過低：減值
鎮定過低：減值
疑心過高：減值
疲勞過高：減值
飢餓過高：減值
```

減值發生時，玩家會在行動結果看到「狀態減值」訊息。

## 暈厥與武器

疲勞、飢餓值過高時，每次行動後會檢查暈厥機率。觸發後：

```text
直接回到存檔點
顯示「你已暈厥」
扣除氣血
降低部分疲勞與飢餓
寫入事件紀錄
```

背景若帶有武器技能值，會依最高武器技能給予武器：

```text
斬擊：短刀
刺擊：短矛
打擊：木棍
```

傷害在 `1D6`、`1D8`、`1D10` 之間依技能高低與隨機結果給予。

## 介面

左側狀態欄只顯示簡表：

```text
姓名、身分、名聲、外觀摘要、調整值、精神、鎮定、疑心、疲勞、飢餓、錢、氣血
```

持有物只在「屬性」面板顯示。

面板內容：

```text
屬性：身分品級、短句、外觀、狀態、調整值、技能值、持有物
社交：已遇 NPC 與最近接觸地點
特質：同屬性面板的角色參照
日誌：玩家行動與事件紀錄
統計：行動次數、劇情耗時、經過回合、現實時間耗時
地圖：常山縣可到達節點
選項：檢定顯示切換與公式說明
存檔：保存、讀取、重開
```

## TRPG Corpus

研究者劇情編輯頁：

```text
https://dana-will-be-yours.github.io/trpg-corpus-sqlserver/web/dago-authoring.html
```

`da_go` 遊玩紀錄可輸出 `da_go_playlog_json_v2`，對應匯入方向：

```text
stg.DaGo_PlayLog_Import -> stg.Utterance_Import -> dbo.Utterance
```

研究者編寫劇情對應：

```text
stg.DaGo_Researcher_Story_Import
dbo.DaGo_Authoring_Scenario_*
```

## 本機驗證

```powershell
cd "C:\Users\sun\Documents\New project\da_go"
python -m http.server 8080
```

```text
http://localhost:8080/game.html?v=1.11.1-xiaocheng-local&reset=1
```

## 相關 repository

```text
https://github.com/dana-will-be-yours/da_go
https://github.com/dana-will-be-yours/trpg-corpus-sqlserver
```
