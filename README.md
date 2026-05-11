# da_go

`da_go` 是《大國年代記》的單人網頁文字遊戲前端。現行版本為 `1.14.5-full-no-code-character-fix`。

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.14.5-full-no-code-character-fix
```

## 1.14.5 修正重點

本版新增 `assets/game-no-code-finalizer.js`，專門清除角色預覽與遊戲介面中的英文原始代碼。`retainer`、`innkeeper`、`scholar`、`nvhuan` 會顯示為「家臣、客棧掌櫃、學士、女鬟」。未知英文代碼會顯示為「未定項目」，避免玩家畫面再出現英文鍵值。

本版補上舊版與外部身分代碼的技能值與特殊特技，保留下拉式衝突行動。

## 驗證

```powershell
npm.cmd test
```
