# da_go

現行版本：`1.14.6-full-code-cleanup`

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.14.6-full-code-cleanup
```

## 1.14.6 修正重點

本版直接覆寫 `assets/character-create-ui.js`。先前該檔仍是 `1.12.10-card-ui`，`roleText()` 找不到身分名稱時會回傳英文原代碼，造成角色預覽顯示 `liuwaiguan`、`staff_officer`、`coroner`、`nvhuan`、`wenxuan` 等代碼。

本版補齊以下身分代碼的中文名稱、技能值與特殊特技：流外官、幕佐、仵作、文選吏、家臣、客棧掌櫃、學士、女鬟、邊軍、家官、卜者、遊俠、店家、將帥、雅士、藝師。

未知英文代碼會顯示為「未定身分」或「未定項目」，不再原樣出現在玩家畫面。

## 驗證

```powershell
npm.cmd test
```

本機測試：

```powershell
python -m http.server 8080
```

```text
http://localhost:8080/game.html?reset=1&v=1.14.6-full-code-cleanup
```
