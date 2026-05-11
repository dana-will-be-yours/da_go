# da_go 1.15.0-balanced-character-preview 本機修正包

## 修正目標

1. 所有身分、背景（出身地、性格、屬性點配置、特殊身世）都提供技能值，且每項固定 4 點。
2. 所有選擇的身分名稱在角色預覽中正確顯示該身分名稱，不得顯示為「地方人士」、「未定身分」或不一致名稱。

## 解壓覆蓋位置

```text
C:\Users\sun\Desktop\da_go
```

## 本機執行

```powershell
cd "$env:USERPROFILE\Desktop\da_go"
node tools/patch-game-html-runtime-url.js
npm.cmd test
python -m http.server 8080
```

測試：

```text
http://localhost:8080/game.html?reset=1&v=1.15.0-balanced-character-preview
```

## 推送

```powershell
git status
git add package.json README.md game.html assets/game-runtime.js assets/character-balanced-effects.js tools/apply-static-runtime.js tools/patch-game-html-runtime-url.js tools/validate-public-page.js tools/validate-playable-architecture.js README_DA_GO_1.15.0_UPDATE.md
git commit -m "Balance character creation effects and preview names"
git push origin main
```
