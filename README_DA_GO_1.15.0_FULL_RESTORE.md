# da_go 1.15.0 full restore all settings

此修正包用途：回到 `1.15.0-balanced-character-preview`，保留 1.15.0 前的所有角色建立與遊戲設定，不採用 1.16.x 的 DoL-like 簡化頁。

保留設定：

- 身體：性別、身高、體型、身體線條、膚色、衣著。
- 頭部：面容儀態、瞳色、髮色、頭髮長度。
- 性格與身分：五項身分。
- 背景：出身地、性格、屬性點配置、特殊身世。
- 遊戲設置：起始時節、遊戲模式、難度、檢定顯示。
- 文字顯示：標準、卷宗、夜讀、大字。
- 側欄：屬性、社交、特質、日誌、統計、地圖、選項、存檔。

新增 / 保留 1.15.0 角色預覽修正：

- `assets/character-preview-role-zh-only.js`：身分預覽使用中文名稱。
- `assets/character-balanced-effects.js`：每一項身分、出身地、性格、屬性點配置、特殊身世都提供 4 點技能值。

此包會移除 1.16.x DoL-like runtime 檔案的引用，公開頁回到 1.15.0 modular runtime。
