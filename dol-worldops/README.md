# DaGo × DoL WorldOps

目標分支：`feature/dol-worldops`  
目前版本：`0.1.1-runtime-foundation`  
狀態：`experimental-isolated`

此目錄承接 DoL 架構分析與 TRPG WorldOps 的 clean-room 實作。P01 已建立 Event Bus、Macro／Widget Registry、非權威快取、Receipt Store、Error Boundary、Module Loader、Runtime Bridge、測試與跨裝置 Demo，不改寫現有 DaGo 遊戲入口。

## 執行測試

```bash
cd dol-worldops
npm test
```

測試只使用 Node.js 內建模組，P01 不需安裝第三方套件。

## 開啟 Demo

必須透過 HTTP 提供 ES modules，例如：

```bash
python -m http.server 8080
```

再開啟：

```text
http://127.0.0.1:8080/dol-worldops/demo/
```

## Runtime lifecycle

```text
register modules
→ validate manifests
→ resolve dependencies
→ preflight
→ start
→ ready
→ process events/macros/widgets
→ reverse stop
```

若模組啟動失敗：

```text
stop new work
→ rollback previously started modules in reverse order
→ store failure receipt
→ surface RuntimeContractError
```

## 強制原則

- 所有開發只提交至 `feature/dol-worldops`。
- `main` 不直接修改。
- SQL Server 是正式資料權威層。
- Client cache 永遠標示 `authoritative = false`。
- AI、Macro、Widget 與 Runtime 均無權直接寫入正式 canon。
- 外部 DoL 原作內容不進入 DaGo canon、公開素材或模型訓練資料。
- 手機版與電腦版使用同一功能契約，只改變響應式排列。
- Runtime 啟動錯誤必須回復已啟動模組並產生 receipt。
- P01 的 `formal_runtime_allowed` 固定為 `false`。
