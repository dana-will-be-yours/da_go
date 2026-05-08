# Degrees of Lewdity 架構分析與 da_go 修改規劃

## 自我檢查

- 本機 text-only 檔案：`Degrees of Lewdity text only/Degrees of Lewdity 0.5.9.8 text only.html`。
- 本機 master source：`degrees-of-lewdity-master`。
- text-only HTML 解析結果：15,169 個 `<tw-passagedata>`。
- master source 解析結果：601 個 `.twee` 檔，15,171 個 passage 宣告。
- 已核對 SugarCube 官方文件、Tweego 官方文件、DoL 官方 GitGud 專案頁。
- 資料不足，需要新資料提供：大國角色別名表、玩家與角色對應、團錄授權、匿名化規則、正式 SQL Server 連線設定。

## text-only 版判斷

text-only 版是已編譯的 Twine/SugarCube HTML。它適合觀察玩家端互動：

- `tw-storydata` 保存 passage 資料。
- `enableImages: false`，可作為純文字模式參考。
- `PassageHeader` 與 `PassageFooter` 讓每次通過 passage 時都能跑共同邏輯。
- sidebar 顯示玩家狀態、時間、位置、物品與模式。
- 存檔與匯出和遊戲狀態綁定。

text-only 版不適合作為維護來源；若要確認模組分層，必須回到 master source。

## master source 版判斷

master source 採 Tweego + SugarCube。主要目錄與 passage 分布如下：

| 目錄 | passage 數 |
| --- | ---: |
| `overworld-town` | 10,114 |
| `overworld-plains` | 2,066 |
| `overworld-forest` | 1,842 |
| `overworld-underground` | 406 |
| `base-system` | 234 |
| `base-combat` | 100 |

可供 da_go 取用的設計做法：

- passage graph：每個場景有文字、選項、條件與下一節點。
- state object：玩家狀態、時間、物品、旗標集中保存。
- event pool：隨機事件由權重與條件決定。
- header/footer lifecycle：進出場景時統一記錄、檢查與保存。
- sidebar：讓玩家看見當前狀態與可用資源。
- save/export 分離：玩家存檔與研究匯出要分開。

## da_go 目前修正方向

`da_go` 不移植 DoL 題材內容。已改成 `assets/game-corpus.js` 讀取 `da_go_world_manifest_v1`，由 trpg-corpus 輸出的資料形成單人遊戲世界。

已完成修正：

- `game.html` 載入 `assets/game-corpus.js`。
- engine 版本改為 `0.9.0-corpus-roundtrip`。
- 可從 JSON 檔或 `http://localhost:8787/api/world-manifest` 讀取世界資料。
- 玩家選項、GM 旁白、研究者紀錄都輸出合法 `speaker_type`。
- `turn_no` 由 `nextTurnNo()` 生成，避免重複。
- 研究匯出含 `stg_Import_Batch`、`stg_Utterance_Import`、`dbo_Scene`、`dbo_Decision_Log_preview`。

## 後續修改順序

1. 將 `trpg-corpus-sqlserver` 的 `dbo.usp_Export_DaGo_World_Manifest` 當主要資料來源。
2. 讓 manifest 補足 `choices`、`plot_events`、`world_settings`、`items`、`rules`。
3. da_go 的選項條件改由 manifest 中的 item、flag、world setting 與 rule 決定。
4. da_go 的隨機事件改由 `Plot_Event.event_importance` 與 scene 關聯形成權重。
5. da_go 遊玩後輸出 `da_go_playlog_json_v2`，再回到 `stg.DaGo_PlayLog_Import`。
6. playlog 經 SQL 程序轉成 `stg.Utterance_Import`，再進既有驗證與正式表。

## 參考文獻

Microsoft. (n.d.). *OPENJSON (Transact-SQL)*. Microsoft Learn. Retrieved May 8, 2026, from https://learn.microsoft.com/en-us/sql/t-sql/functions/openjson-transact-sql

Motoslave.net. (2020). *Tweego documentation* (Version 2.1.1). https://www.motoslave.net/tweego/docs/

Motoslave.net. (2024). *SugarCube v2 documentation* (Version 2.37.3). https://www.motoslave.net/sugarcube/2/docs/

Vrelnir. (n.d.). *Degrees of Lewdity* [Computer software]. GitGud. Retrieved May 8, 2026, from https://gitgud.io/Vrelnir/degrees-of-lewdity
