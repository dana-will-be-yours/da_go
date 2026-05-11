# da_go 1.14.5-full-no-code-character-fix 本機對 GitHub 更新包

## 覆蓋檔案

```text
package.json
README.md
assets/game-runtime.js
assets/game-no-code-finalizer.js
tools/apply-static-runtime.js
tools/validate-public-page.js
tools/validate-playable-architecture.js
tools/patch-game-html-runtime-url.js
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
git add package.json README.md assets/game-runtime.js assets/game-no-code-finalizer.js tools/apply-static-runtime.js tools/validate-public-page.js tools/validate-playable-architecture.js tools/patch-game-html-runtime-url.js README_DA_GO_1.14.5_UPDATE.md
git commit -m "Remove remaining visible English character codes"
git push origin main
```

更新 `game.html` runtime URL：

```powershell
node tools/patch-game-html-runtime-url.js
git add game.html
git commit -m "Update public page runtime to 1.14.5"
git push origin main
```

若 PowerShell 擋下 npm，請用：

```powershell
npm.cmd test
```

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.14.5-full-no-code-character-fix
```
