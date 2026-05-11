# da_go 1.14.3-character-build-select-combat 本機對 GitHub 更新包

## 嚴格修正項目

1. 檢查並修正角色創建中身分、背景、技能值仍出現英文鍵名。
2. 補齊身分、出身、性格、屬性配置、特殊身世的技能值與特殊特技。
3. 將公開頁版本推進到 `1.14.3-character-build-select-combat`，避免讀到舊檔。
4. 參考 DoL 式戰鬥操作結構，改為下拉式行動選擇；關閉卡牌戰鬥顯示。

## 覆蓋檔案

```text
package.json
README.md
assets/game-runtime.js
assets/game-skill-label-zh.js
assets/game-dol-select-combat.js
tools/apply-static-runtime.js
tools/validate-public-page.js
tools/validate-playable-architecture.js
tools/patch-game-html-runtime-url.js
```

## 新增檔案

```text
assets/game-character-build-zh.js
```

## 不要刪除

```text
assets/game-modular.js
assets/game-bundle-loader.js
assets/data/dago-changshan-v1-bundle.json
assets/data/dago-changshan-v1-extension.json
```

## 本機對 GitHub 指令

把本包內容解壓到：

```text
C:\Users\sun\Desktop\da_go
```

然後執行：

```powershell
cd "$env:USERPROFILE\Desktop\da_go"
git status
git add package.json README.md assets/game-runtime.js assets/game-character-build-zh.js assets/game-skill-label-zh.js assets/game-dol-select-combat.js tools/apply-static-runtime.js tools/validate-public-page.js tools/validate-playable-architecture.js tools/patch-game-html-runtime-url.js README_DA_GO_1.14.3_UPDATE.md
git commit -m "Fix character creation bonuses and dropdown conflict actions"
git push origin main
```

如果本機已安裝 Node.js，再執行：

```powershell
node tools/patch-game-html-runtime-url.js
npm test
git add game.html
git commit -m "Update public page runtime to 1.14.3-character-build-select-combat"
git push origin main
```

如果本機沒有 Node.js，第二段跳過。GitHub Pages workflow 會執行 `tools/apply-static-runtime.js`，公開頁 artifact 會被修補到 `1.14.3-character-build-select-combat`。

## 公開頁

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.14.3-character-build-select-combat
```
