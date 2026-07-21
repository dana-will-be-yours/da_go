# P02 Boot Lifecycle Architecture

版本：0.2.0  
分支：`feature/dol-worldops`  
狀態：`implementation-complete-local-contract-passed-ci-pending`

## 1. 目的

P02 將 DoL 的啟動與 passage lifecycle 工程模式轉譯為多人 TRPG WorldOps 的 clean-room 啟動程序。

```text
DoL 參考：StoryInit → Start → PassageHeader → Passage → PassageFooter
WorldOps：preflight → handshake → snapshot → permission → modules → ready → suspend/resume → snapshot request → stop
```

本階段只建立 client/runtime contract。正式 SQL Server command、event、snapshot 與 reconnect protocol 由 P03 建立。

## 2. 完整階段

### B01 Config

- 合併 defaults、source 與 overrides。
- 拒絕 `__proto__`、`prototype`、`constructor`。
- 拒絕 password、token、secret、private key、connection string 等欄位。
- 強制：

```text
formalRuntimeAllowed = false
clientCacheAuthoritative = false
canonAutoWrite = false
```

### B02 Capability resolution

- 角色能力在 client registry 中宣告。
- Registry 啟動前 seal。
- 阻擋 client 自行取得：

```text
canon.write
formal.collection.enable
database.destructive
```

### B03 Session handshake

Client 送出：

```text
client_id
room_id
runtime_version
schema_version
device_mode
credential
last_cursor
```

Server 回傳：

```text
accepted
session_id
room_id
room_version
schema_version
snapshot_cursor
server_time
capabilities
```

Credential 僅傳送至 transport，receipt 只保存 hash，request hash 使用 `[REDACTED]`。

### B04 Capability intersection

有效能力取 client role capabilities 與 server capabilities 的交集。Client 無法單方面擴張 server 授權。

### B05 Permission gate

- Resource/action policy。
- Explicit deny 優先。
- 無符合 allow policy 時預設拒絕。
- Canon route 具有高優先 deny policy。

### B06 Snapshot hydration

- Snapshot 必須由 server adapter 回傳。
- Snapshot 必須包含 room、version、schema、state 與 `authoritative = true`。
- Room／schema／version 錯配立即拒絕。
- Client 可保存 snapshot 的非權威副本。
- Client 只能送出 snapshot request，不能宣稱已寫入正式 snapshot。

### B07 Module boot

```text
resolve dependency graph
→ preflight
→ start
→ ready
```

- 依賴先啟動。
- Hook 具有 timeout。
- 啟動失敗時，已啟動模組依反向順序 rollback。

### B08 Ready and autosnapshot

- Boot Coordinator 保存當前 config、session、snapshot、capabilities 與 device mode。
- Autosnapshot 只向 server 提出 request。
- Interval callback 失敗時保存 error receipt，不宣稱 snapshot 成功。

### B09 Suspend

```text
snapshot request
→ dependents-first module suspend
→ stop autosnapshot timer
```

### B10 Resume

```text
dependencies-first module resume
→ restart autosnapshot timer
```

若 resume 中途失敗，已恢復的模組依反向順序重新 suspend。

### B11 Stop

```text
snapshot request
→ widget reverse cleanup
→ module reverse stop
→ handshake close
→ receipt flush
```

各步驟即使發生錯誤，仍繼續執行剩餘清理，最後以 aggregate error 回報。

## 3. 主要 Runtime 元件

| 元件 | 職責 |
|---|---|
| `WorldOpsConfigLoader` | 設定合併、安全檢查、hash 與保護旗標 |
| `WorldOpsCapabilityRegistry` | 角色能力、reserved capability 與 seal |
| `WorldOpsPermissionGate` | default-deny authorization |
| `WorldOpsSessionHandshake` | room/schema/session negotiation |
| `WorldOpsSnapshotManager` | server snapshot hydration、client request 與 local cache |
| `WorldOpsModuleLoader` | deterministic lifecycle、timeout、rollback、suspend/resume |
| `WorldOpsRuntimeBridge` | Event、Macro、Widget、Cache、Module 統一 Runtime |
| `WorldOpsBootCoordinator` | P02 完整程序與 failure recovery |

## 4. 權威資料界線

| 資料 | 權威性 |
|---|---|
| Server／SQL Server room state | authoritative |
| Server snapshot | authoritative |
| Browser cache | non-authoritative |
| Client pending operation | candidate／pending |
| Macro output | non-authoritative |
| Widget state | presentation only |
| AI output | candidate only |
| Boot receipt | development evidence；不是正式研究資料 |

## 5. 跨裝置契約

P02 不區分桌面版與手機版功能。Boot request 保存 `device_mode`，Widget manifest 可宣告 desktop、tablet、mobile；能力、權限、snapshot 與 lifecycle 在所有裝置中相同。

## 6. Contract tests

已建立：

- 10 項 P01 Runtime contract。
- 9 項 P02 Boot lifecycle contract。
- Static contract。
- 15 個 JavaScript syntax checks 的 CI 設定。

本次提交前在隔離的本機重建目錄執行：

```text
P01 Runtime contract = 10/10
P02 Boot lifecycle = 9/9
Static contract = passed
```

GitHub Actions workflow run 尚待 GitHub 執行並回傳。

## 7. 尚未宣稱完成

- 正式 SQL Server runtime。
- Server-side access-code validation。
- WebSocket reconnect。
- Optimistic concurrency。
- Idempotency。
- Server receipt persistence。
- 正式五人房間。
- 正式研究收案。
- 正式 canon 寫入。
- 實體手機與電腦瀏覽器矩陣。

## 8. 下一批次

```text
P03-AUTHORITATIVE-STATE-COMMAND-CONTRACT
```

P03 必須新增：

```text
wop.Room
wop.Room_Command
wop.Room_Event
wop.Room_Snapshot
wop.Client_Session
wop.Sync_Cursor
wop.Operation_Receipt
```

並完成 optimistic concurrency、idempotency、command validation、event append、snapshot rebuild、WebSocket cursor 及 reconnect contract。
