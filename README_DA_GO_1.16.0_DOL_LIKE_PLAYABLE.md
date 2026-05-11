# da_go 1.16.0-dol-like-playable

此修正包把公開頁改成可直接由 GitHub Pages 開啟的類 DoL 文法文字遊戲版本。

公開入口：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&cache=1.16.0-dol-like-playable
```

核心改動：

1. `game.html` 重新建立為乾淨 UTF-8，修復亂碼與壞掉的 HTML 標籤。
2. 公開頁改載入 `assets/dago-dol-like-runtime.js`，不再載入舊 preview watcher。
3. 遊戲內容採類 DoL / SugarCube 文法：`:: Passage`、`<<link>>`、`<<if>>`、`<<set>>`、`[[文字|Passage]]`。
4. 角色建立保留五項身分、出身地、性格、屬性點配置、特殊身世；每一項固定提供 4 點技能值。
5. GitHub Pages 的 `tools/apply-static-runtime.js` 不再把版本回滾到舊版。
6. 驗證腳本改檢查新 runtime、禁止亂碼、禁止舊 watcher、禁止 `MutationObserver`。
