# da_go 1.16.1-preserve-settings-dol-grammar

本修正保留原本角色建立頁所有設定，不再使用 1.16.0 的簡化頁。

## 修正範圍

1. 以乾淨 UTF-8 版 `game.html` 覆寫亂碼頁。
2. 保留身體、頭部、五項身分、出身地、性格、屬性點配置、特殊身世、遊戲設置、文字顯示。
3. 新增 `assets/dago-dol-like-runtime.js`，使用類 DoL / SugarCube 的 passage grammar：`:: Passage`、`<<link>>`、`<<if>>`、`<<set>>`、`<<check>>`、`[[文字|Passage]]`。
4. 所有身分與背景列固定提供 4 點技能值。
5. GitHub Pages 可直接開啟 `game.html` 遊玩。

## 測試

```powershell
node tools/validate-runtime.js
node tools/apply-static-runtime.js
node tools/validate-public-page.js
node tools/validate-playable-architecture.js
npm.cmd test
```

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&cache=1.16.1-preserve-settings-dol-grammar
```
