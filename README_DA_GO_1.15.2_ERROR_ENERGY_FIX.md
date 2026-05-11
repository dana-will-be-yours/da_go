# da_go 1.15.2 error energy fix

修正項目：

1. 修正 `Cannot add property liuwaiguan, object is not extensible`。
2. 在 `game-character-build-zh.js` 與 `game-no-code-finalizer.js` 之前載入 `role-table-extensible-fix.js`，將被 freeze 的 `DaGoRoleRankPhraseTable` 轉成可擴充副本。
3. 重寫 `character-balanced-effects.js`，移除會反覆監看並重繪 `buildPreview` 的 `MutationObserver`，降低持續耗能與反覆重繪。
4. 保留 `character-canonical-balance-fix.js` 作為最後的技能平衡正規化層。

本修正不會修改 SQL、資料庫或存檔結構。
