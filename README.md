# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲原型。現行主線為「南京篇」，玩家活動範圍限定於南京；南陽、崑崙、銀川、江夏、五毒等遠方地點以信件、帳目、傳聞、人物口述與旗標線索進入劇情。

目前遊戲目標是把 `da_go` 發展成接近 Degrees of Lewdity 的可玩文字沙盒架構，同時保留 `trpg-corpus-sqlserver` 所需的研究紀錄輸出能力。

## 公開頁

GitHub Pages：

```text
https://dana-will-be-yours.github.io/da_go/game.html
```

目前建議驗證網址：

```text
https://dana-will-be-yours.github.io/da_go/game.html?v=1.10.11-role-rank-table
```

若要避開瀏覽器快取，可在網址後加上版本參數：

```text
https://dana-will-be-yours.github.io/da_go/game.html?v=<version-or-commit>
```

## 目前版本

```text
Runtime: 1.10.11-role-rank-table
入口：assets/game-runtime.js
相容快取讀取頁：assets/game-preload-cache.js
角色建立補丁：assets/game-v6-hotfix.js
身分品級表與角色補值：assets/game-character-balance-fix.js
主遊戲引擎：assets/game-playable-v6.js
資料包：assets/data/dago-nanjing-v5-bundle.json
```

`game.html` 會載入 `assets/game-runtime.js`，公開頁直接進入劇本與角色建立流程。`assets/game-preload-cache.js` 保留給舊連結與快取測試，不再是公開頁必要步驟。

## 相容快取畫面

`assets/game-preload-cache.js` 可建立全螢幕快取讀取介面。它會檢查並嘗試快取下列資源：

```text
assets/game-screen.css
assets/game-v4.css
assets/game-v6-hotfix.js
assets/game-playable-v6.js
assets/data/dago-nanjing-v5-bundle.json
```

必要資源可讀取即可進入遊戲。Cache API 寫入失敗時，頁面會顯示「可讀取，快取略過」，不會阻止進入遊戲。南京資料包目前設為可選資源，讀取失敗不會導致整頁卡死。

快取頁背景已加入垂直捲動文字欄：

```text
冷色、半透明黑底、細線外框
文字由上往下等速移動
速度為 72s linear infinite
pointer-events: none，不干擾按鈕操作
進入遊戲時與 preload overlay 一起移除
```

## 本機開啟

```text
C:\Users\sun\Documents\New project\da_go\game.html
```

建議使用本機伺服器：

```powershell
cd "C:\Users\sun\Documents\New project\da_go"
python -m http.server 8080
```

```text
http://localhost:8080/game.html?v=1.10.11-role-rank-table
```

## 遊戲內容

目前公開版以南京篇為中心：

```text
外郭：南京外城、城門茶棚
外城：驛舍、秦淮河埠、北街、後巷、街市、借住小院
內城：南市帳房、南京西街書肆
皇城外署：南京官署
```

已具備：

```text
DOL 式左欄、passage 文字與藍色文字選項
南京限定地圖
角色建立
五組身分選擇
重複身分換算分項品級
36 個身分 × 5 個品級短句完整表
正 / 邪 / 奇名聲
4D3 技能檢定
失敗回饋
狀態壓力
技能修習
日誌
研究者 JSON 匯出
```

## 角色建立規則

角色建立欄位包含：

```text
身體：性別、高矮、胖瘦體型、身體線條、膚色、初始衣物
樣貌：面容儀態、瞳色、髮色、頭髮長度
身分：五組身分選擇，可重複
背景：出身地、性格、屬性點配置、特殊身世
名聲：正 / 邪 / 奇，初始經驗 1–5
遊戲設置：起始時節、遊戲模式、難度、檢定成功率顯示
文字外觀：標準、書卷、夜讀、大字
```

五組身分允許重複。重複次數會分別換算該身分的品級：

```text
1 次：戊
2 次：丁
3 次：丙
4 次：乙
5 次：甲
```

範例：

```text
遊手、遊手、遊手、兵戶、兵戶
→ 遊手(丙)、兵戶(丁)
```

每個身分提供固定技能組。重複選擇同一身分時，該身分技能組會逐次累加。

`assets/game-character-balance-fix.js` 內含 `DaGoRoleRankPhraseTable`，目前寫入 36 個身分與戊、丁、丙、乙、甲五級短句。角色建立預覽與屬性面板會讀取同一份表，避免角色建立、存檔與面板各自維護不同文字。

## 身分分類

現行身分選項包含：

```text
官員：京官、地方官、技官
兵吏衙差：書吏、差役、捕役、兵戶
坊郭戶：坊郭戶、作坊戶、茶棚幫閒、市牙人
鄉村戶：農戶、獵戶、漁戶、里正家人
文人：士子、抄書人、塾師、詩客
壯士：壯士、鏢客、埠頭力夫、團練
遊手：遊手、賭徒、浪人、掮客
其他：門閥子弟、行商、坊郭醫、伎伶俳優、門派弟子
```

江湖門派類特殊身世需要至少一個身分為「門派弟子」。未滿足條件時，前端會停用相關選項；若舊存檔或外部資料帶入不合條件的江湖背景，runtime 會自動不啟用。

## 技能與檢定

技能共 39 項，分為體魄、技巧、智識三類。

```text
體魄：內功、外功、輕功、水性、攀行、刺擊、斬擊、打擊、感知
技巧：巧手、工藝、辨別、醫術、調藥、騎術、躲藏、觀察、聆聽、品嗅、政務、馴養、威嚇、表達、雅藝
智識：相貌、資源、財富、官場、江湖、地理、自然、歷史、宗教、學藝、意志、語言、交際、共情、口才
```

體魄、技巧、智識為屬性調整值，由所屬技能值加總換算：

```text
技能值 -3 ~ 0：調整值 -2
技能值 1：調整值 -1
技能值 2 ~ 3：調整值 0
技能值 4 ~ 5：調整值 1
技能值 6 ~ 8：調整值 2
技能值 9 ~ 11：調整值 3
技能值 12 ~ 15：調整值 4
技能值 16 ~ 19：調整值 5
技能值 20 ~ 26：調整值 6
```

檢定公式：

```text
4D3 + 屬性調整值 + 技能值 >= DC
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

一般行動檢定不增加技能。只有讀書、請教、演練與專門修習會增加修習進度。

## 介面面板

左側欄目前包含：

```text
屬性：外觀、背景、身分、名聲
社交：目前可追蹤 NPC
特質：外觀與背景摘要
日誌：玩家行動與事件紀錄
統計：全部技能、所屬類別、屬性調整值與修習進度
地圖：南京區域分類節點
選項：檢定顯示切換
存檔：保存、讀取、重開
研究者：匯出 playlog JSON
```

持有物欄只顯示實體物品。背景、門閥、身世、名聲等抽象資訊會留在特質或角色資料，不列入持有物。

## 程式入口

```text
game.html                              公開頁與本機入口
assets/game-runtime.js                 統一載入入口
assets/game-preload-cache.js           快取讀取頁、垂直捲動文字背景
assets/game-v6-hotfix.js               角色建立補丁與門派背景限制
assets/game-character-balance-fix.js   身分品級完整短句表、角色補值與屬性重算
assets/game-playable-v6.js             主要遊戲引擎
assets/game-screen.css                 DOL 式文字頁與左欄樣式
assets/game-v4.css                     卡片、地圖與面板樣式
assets/data/dago-nanjing-v5-bundle.json 南京資料包
```

舊入口檔案仍保留供相容或參考，但公開頁目前以 `game-runtime.js` 為唯一入口。

## TRPG Corpus 對接

`da_go` 會輸出 `da_go_playlog_json_v2`，供 `trpg-corpus-sqlserver` 匯入與分析。研究者面板會輸出：

```text
stg_Utterance_Import
raw_decision_log
raw_retrieval_log
raw_game_events
game_state
```

研究資料目標資料庫：

```text
TRPG_Corpus_DB
```

主要匯入方向：

```text
stg.DaGo_PlayLog_Import -> stg.Utterance_Import -> dbo.Utterance
```

研究者劇情編寫頁：

```text
https://dana-will-be-yours.github.io/trpg-corpus-sqlserver/web/dago-authoring.html
```

## 相關 repository

```text
https://github.com/dana-will-be-yours/da_go
https://github.com/dana-will-be-yours/trpg-corpus-sqlserver
```

## 目前待辦

```text
把 game-playable-v6.js 進一步資料驅動化
讓 v6 完全吃 SQL 匯出的南京 bundle JSON
在遊戲內補完整 NPC 關係、任務、商店與事件池 UI
把 web/dago-authoring.html 擴充為完整 authoring workflow
持續細化 DOL 風格的特徵、核心屬性、技能卡片與地圖區域
```
