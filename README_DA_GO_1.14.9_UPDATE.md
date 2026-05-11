# da_go 1.14.9-preview-roles-chinese-only 本機修正包

## 只修正這一項

角色創建預覽時顯現的所有身分皆為中文。

## 不做的事

不覆寫 `assets/character-create-ui.js`。
不重寫 `#buildPreview`。
不刪除角色預覽中的其他段落。
不修改「調整值」、「技能值」、「身分與背景加成」、「特殊特技」等區塊結構。

## 新增檔案

```text
assets/character-preview-role-zh-only.js
```

## 覆蓋檔案

```text
package.json
README.md
assets/game-runtime.js
tools/apply-static-runtime.js
tools/patch-game-html-runtime-url.js
tools/validate-public-page.js
tools/validate-playable-architecture.js
```

## 本機操作

解壓到：

```text
C:\Users\sun\Desktop\da_go
```

執行：

```powershell
cd "$env:USERPROFILE\Desktop\da_go"
node tools/patch-game-html-runtime-url.js
npm.cmd test
python -m http.server 8080
```

本機測試：

```text
http://localhost:8080/game.html?reset=1&v=1.14.9-preview-roles-chinese-only
```

連續按角色隨機化，檢查 `角色預覽` 的「身分：」列不得出現英文代碼，也不得出現「未定身分」。

## 推送 GitHub

```powershell
git status
git add package.json README.md game.html assets/game-runtime.js assets/character-preview-role-zh-only.js tools/apply-static-runtime.js tools/patch-game-html-runtime-url.js tools/validate-public-page.js tools/validate-playable-architecture.js README_DA_GO_1.14.9_UPDATE.md
git commit -m "Show all preview identities in Chinese"
git push origin main
```
