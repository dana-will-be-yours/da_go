# da_go 1.15.0 restore settings hotfix

此修正包回到 `1.15.0-balanced-character-preview`，保留全部舊角色建立設定與左側面板。

修正項目：

1. 將角色建立欄位標題 `性格與身分` 改為 `身分`。
2. 修復角色建立頁 `隨機化` 按鈕。
3. 修復左側 `特質` 面板，避免角色資料缺值時面板報錯。
4. 移除 1.16.x DoL-like runtime 入口，回到 1.15.0 modular runtime。

驗證：

```powershell
node tools/validate-runtime.js
node tools/apply-static-runtime.js
node tools/validate-public-page.js
node tools/validate-playable-architecture.js
npm.cmd test
```
