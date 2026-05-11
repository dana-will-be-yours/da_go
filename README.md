# da_go

現行修正版本：`1.14.9-preview-roles-chinese-only`

公開頁測試：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.14.9-preview-roles-chinese-only
```

## 1.14.9 修正範圍

本版只處理一個需求：角色創建預覽中「身分」列顯示的所有身分必須是中文。

修正方式為新增 `assets/character-preview-role-zh-only.js`。此檔只修改 `#buildPreview` 內的文字節點，不覆寫整個角色預覽，不刪除「調整值」、「技能值」、「身分與背景加成」、「特殊特技」等既有段落。

它會優先讀取目前 `select[name="roles"] option` 的中文顯示文字，所以若角色選項由其他模組動態插入，也會使用該選項原本的中文名稱。沒有對應到的舊代碼才會用內建表補齊。舊的「未定身分／未定項目」會轉為「地方人士」，不再出現在預覽畫面。
