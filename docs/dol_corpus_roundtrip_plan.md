# da_go corpus roundtrip plan

## 自我檢查

- 已檢查 `Degrees of Lewdity 0.5.9.8 text only.html`，本機解析到 15,169 個 `<tw-passagedata>`。
- 已檢查 `degrees-of-lewdity-master`，本機解析到 601 個 `.twee` 檔與 15,171 個 passage 宣告。
- 已核對 DoL 官方 GitGud 專案頁、SugarCube 官方文件、Tweego 官方文件。
- 已比對 `trpg-corpus-sqlserver/database/12_Utterance.sql` 與 `23_stg_Utterance_Import.sql`，確認 `SYSTEM` 不在合法 `speaker_type` 清單內。
- 資料不足，需要新資料提供：大國年代記角色別名、PL/PC/GM 對應、團錄授權、匿名化規則、Decision_Log 與 Plot_Event 的正式回寫欄位。

## DoL 架構取用範圍

DoL text-only 版用於觀察已編譯的互動文字流程：passage graph、側欄、狀態顯示、選項、存檔、匯出。master source 用於確認 source 分層：`StoryInit`、`PassageHeader`、`PassageFooter`、`StoryCaption`、JS helper、event pool 與 save 模組。

da_go 不取用 DoL 成人內容，也不依賴 Twine runtime。da_go 保留純 HTML/JS 前端，但吸收以下做法：

- passage graph：場景與選項以資料驅動。
- state object：玩家狀態、物品、旗標、發言、事件集中保存。
- event pool：隨機事件用 seed 與權重延伸。
- sidebar：即時顯示角色、地點、狀態、物品與札記。
- export split：玩家存檔與研究匯出分離。
- versioned export：JSON 帶 `export_format` 與 `engine_version`。

## 已修改內容

- `game.html` 改載入 `assets/game-corpus.js`。
- `assets/game-corpus.js` 升到 `0.9.0-corpus-roundtrip`。
- 支援匯入 `da_go_world_manifest_v1` JSON。
- 支援從 `http://localhost:8787/api/world-manifest` 讀取 manifest。
- `speaker_type` 只輸出 `GM`、`PC`、`Researcher` 等 SQL 允許值。
- `turn_no_text` 由 `nextTurnNo()` 生成，避免重複。
- `utterance_function` 會正規化到 SQL enum。
- 開發者面板可下載 JSON 與 `stg.Utterance_Import` CSV。
- playlog JSON 包含 `stg_Import_Batch`、`dbo_Scene`、`stg_Utterance_Import`、`dbo_Decision_Log_preview`、`raw_game_events`。

## 對接格式

da_go 讀取 manifest：

```json
{
  "manifest_format": "da_go_world_manifest_v1",
  "metadata": {
    "source": "trpg-corpus-sqlserver",
    "project_code": "DAGUO",
    "team_code": "DAGUO-T01",
    "session_code": "DA20-CORPUS-RPG-001"
  },
  "config": {
    "database_name": "TRPG_Corpus_DB",
    "project_code": "DAGUO",
    "team_code": "DAGUO-T01",
    "session_code": "DA20-CORPUS-RPG-001",
    "import_batch_code": "DAGO_DAGUO-T01_DA20-CORPUS-RPG-001",
    "gm_code": "TM-GM",
    "researcher_code": "TM-RESEARCHER"
  },
  "scenes": []
}
```

da_go 輸出 playlog：

```json
{
  "metadata": {
    "export_format": "da_go_playlog_json_v2",
    "engine_version": "0.9.0-corpus-roundtrip"
  },
  "stg_Import_Batch": {},
  "stg_Utterance_Import": []
}
```

## 後續修改順序

1. 以 trpg-corpus 匯出的 manifest 取代本機 fallback passages。
2. 把大國年代記 HTML 經人工審核後匯入 `stg.Utterance_Import`。
3. 由 SQL 匯出含 scene、world setting、item、rule、plot event 的 manifest。
4. da_go 遊玩後輸出 playlog JSON。
5. trpg-corpus 透過 `stg.usp_Load_DaGo_PlayLog_To_Utterance_Import` 轉回 staging。
6. 再執行既有 `stg.usp_Validate_Utterance_Import` 與 `stg.usp_Load_Utterance_Import_To_Dbo`。

## 參考文獻

Microsoft. (n.d.). *Work with JSON data in SQL Server*. Microsoft Learn. Retrieved May 8, 2026, from https://learn.microsoft.com/en-us/sql/relational-databases/json/json-data-sql-server

Motoslave.net. (2020). *Tweego documentation* (Version 2.1.1). https://www.motoslave.net/tweego/docs/

Motoslave.net. (2024). *SugarCube v2 documentation* (Version 2.37.3). https://www.motoslave.net/sugarcube/2/docs/

Rameshkumar, R., & Bailey, P. (2020). Storytelling with dialogue: A Critical Role Dungeons and Dragons dataset. In *Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics* (pp. 5121-5134). Association for Computational Linguistics. https://doi.org/10.18653/v1/2020.acl-main.459

Vrelnir. (n.d.). *Degrees of Lewdity* [Computer software]. GitGud. Retrieved May 8, 2026, from https://gitgud.io/Vrelnir/degrees-of-lewdity

Zhu, A., Aggarwal, K., Feng, A., Martin, L. J., & Callison-Burch, C. (2023). FIREBALL: A dataset of Dungeons and Dragons actual-play with structured game state information. In *Proceedings of the 61st Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers)* (pp. 4171-4193). Association for Computational Linguistics. https://doi.org/10.18653/v1/2023.acl-long.229
