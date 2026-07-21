# DaGo × DoL WorldOps

目標分支：`feature/dol-worldops`  
目前版本：`0.2.0-boot-lifecycle`  
狀態：`experimental-isolated`

此目錄承接 DoL 架構分析與 TRPG WorldOps 的 clean-room 實作，不改寫現有 DaGo 遊戲入口。P01 建立 Runtime 基礎；P02 建立設定載入、能力權限、session handshake、server snapshot、模組暫停與恢復、自動 snapshot 請求及 receipt flush。

## 執行測試

```bash
cd dol-worldops
npm ci
npm test
```

目前測試組成：

```text
10 項 P01 Runtime contract
9 項 P02 Boot lifecycle contract
1 組 Static contract
```

本次提交前已在隔離的本機重建目錄以 Node.js 執行上述測試，結果通過。GitHub Actions 的分支執行結果仍需由 workflow run 獨立確認。

## 開啟 Demo

必須透過 HTTP 提供 ES modules 與 JSON 設定檔：

```bash
python -m http.server 8080
```

再開啟：

```text
http://127.0.0.1:8080/dol-worldops/demo/
```

Demo 使用合成 handshake、合成 server snapshot 與非權威瀏覽器快取，支援啟動、暫停、恢復、事件處理及停止流程。

## P02 完整啟動流程

```text
config load
→ protected control enforcement
→ client role/capability resolution
→ server/session handshake
→ client/server capability intersection
→ default-deny route permission
→ authoritative server snapshot hydration
→ deterministic module boot
→ runtime ready
→ autosnapshot request schedule
→ suspend/resume
→ stop
→ handshake close
→ receipt flush
```

若啟動流程失敗：

```text
停止新工作
→ 清除 autosnapshot timer
→ 停止已啟動 Runtime
→ 關閉已開啟 session handshake
→ 保存 failure receipt
→ 回傳 RuntimeContractError
```

## 權威性界線

```text
SQL Server／伺服器 Snapshot = 正式權威資料
Browser cache = authoritative false
Client snapshot operation = request only
Macro／Widget／AI = candidate or UI operation only
formalRuntimeAllowed = false
canonWriteAllowed = false
```

## 主要檔案

```text
runtime/worldops_config_loader.js
runtime/worldops_capability_registry.js
runtime/worldops_permission_gate.js
runtime/worldops_session_handshake.js
runtime/worldops_snapshot_manager.js
runtime/worldops_boot_coordinator.js
config/worldops_module_manifest.schema.json
config/worldops_boot_receipt.schema.json
tests/p02-boot-lifecycle.mjs
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
- 正式研究收案及正式 Runtime 仍維持關閉。

## 下一批次

```text
P03-AUTHORITATIVE-STATE-COMMAND-CONTRACT
```

P03 將建立 SQL Server 權威 command／event／snapshot 契約、optimistic concurrency、idempotency、WebSocket cursor、reconnect 與 conflict receipt。
