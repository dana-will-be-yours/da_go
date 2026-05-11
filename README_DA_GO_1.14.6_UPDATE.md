# da_go 1.14.6-full-code-cleanup 本機對 GitHub 更新包

## 必須覆蓋的檔案

```text
package.json
README.md
assets/game-runtime.js
assets/character-create-ui.js
assets/game-character-build-zh.js
assets/game-skill-label-zh.js
assets/game-dol-select-combat.js
assets/game-no-code-finalizer.js
tools/apply-static-runtime.js
tools/validate-public-page.js
tools/validate-playable-architecture.js
tools/patch-game-html-runtime-url.js
```

## 本機對 GitHub 指令

解壓到：

```text
C:\Users\sun\Desktop\da_go
```

執行：

```powershell
cd "$env:USERPROFILE\Desktop\da_go"
git status
git add package.json README.md assets/game-runtime.js assets/character-create-ui.js assets/game-character-build-zh.js assets/game-skill-label-zh.js assets/game-dol-select-combat.js assets/game-no-code-finalizer.js tools/apply-static-runtime.js tools/validate-public-page.js tools/validate-playable-architecture.js tools/patch-game-html-runtime-url.js README_DA_GO_1.14.6_UPDATE.md
git commit -m "Fix all visible character code leaks"
git push origin main
```

更新 `game.html` runtime URL：

```powershell
node tools/patch-game-html-runtime-url.js
git add game.html
git commit -m "Update public page runtime to 1.14.6"
git push origin main
```

若 PowerShell 擋下 npm：

```powershell
npm.cmd test
```

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.14.6-full-code-cleanup
```
