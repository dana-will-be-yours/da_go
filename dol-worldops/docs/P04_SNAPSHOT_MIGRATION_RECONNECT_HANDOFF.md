# P04 Snapshot、Schema Migration、Reconnect 與跨裝置 Handoff 契約

版本：0.4.0  
日期：2026-07-21  
目標分支：`feature/dol-worldops`  
前置批次：P03 Authoritative State and Command Contract  
下一批次：P05 Narrative Node、Scene 與 Passage Graph

## 1. 目的

P04 延伸 P03 的伺服器權威 command/event/snapshot 契約，處理長期遊戲場次的四項必要能力：

1. 由權威 Snapshot 加上連續 Event Stream 確定性重建房間狀態。
2. 以明確 Schema Migration Graph 升級舊存檔，不把路由改寫、資料遷移及權限判斷集中於同一函式。
3. 支援網路中斷後的有界事件重播、Snapshot fallback、單調 cursor 與 backpressure。
4. 支援桌面、平板及手機之間的短效、單次使用 Handoff，不在資料庫或瀏覽器快取保存明文憑證。

P04 也加入瀏覽器離線 command queue。該 queue 只保存未提交操作，固定為 `authoritative = false`，遇到版本衝突即阻擋後續送出，要求使用新 command ID 與 idempotency key 顯式 rebase。

## 2. DoL 架構模式的 clean-room 轉譯

| DoL 架構問題 | WorldOps P04 對應 |
|---|---|
| 長期 Save 與版本升級 | `SchemaMigrationRegistry`、Migration Receipt、SQL metadata |
| Passage／State history | Snapshot + contiguous Event Replay |
| 舊版路由與相容處理 | 明確 migration graph；不把 route rewrite 當資料遷移 |
| 瀏覽器 local save | 非權威離線操作 queue；正式資料仍由 SQL Server 保存 |
| 手機與桌面切換 | 短效 single-use Handoff Ticket |
| 中斷後繼續遊戲 | Reconnect Plan、delivery window、ack cursor、snapshot fallback |

外部 DoL 故事正文、角色、成人內容、圖片、音訊與翻譯資料未進入本批次。

## 3. Python Runtime

### 3.1 `schema_migration.py`

- 顯式註冊 `from_version → to_version`。
- 阻擋 self-loop、重複 edge、重複 migration ID。
- sealed registry 後禁止動態變更。
- 以 deterministic BFS 尋找最短可用 migration path。
- migration function 接收 deep copy；來源狀態不被修改。
- 保存 source/target hash、path 與 migration IDs。

### 3.2 `event_replay.py`

- Snapshot 必須 `authoritative = true`。
- 核對 Snapshot state hash。
- 事件必須與 room 相同。
- 事件版本必須連續，禁止 gap、duplicate、regression。
- 核對 event payload hash。
- 以 event type 對應明確 reducer。
- 必要時先進行 schema migration，再進行 event replay。
- 產生結果 state hash 與 replay receipt。

### 3.3 `handoff.py`

- 使用加密安全 token factory。
- 記憶體及 SQL 僅保存 SHA-256 token hash。
- 明文 token 只在 issue response 中出現一次。
- 綁定 room、session、actor、target device class 與 cursor。
- 設定 10–600 秒 TTL。
- consume 後禁止再次使用。
- 支援 revoke 與 expiry。

### 3.4 `reconnect.py`

- cursor 不得高於權威 room version。
- 事件重播採可設定的 bounded delivery window。
- backlog 超過 threshold 時，只有比 client cursor 新的 Snapshot 才能作 fallback。
- Snapshot 後事件仍需連續。
- 阻擋 event version 超過目前權威版本。
- acknowledgement 只能在已送達範圍內單調前進。
- 保存 in-flight versions，不使用 last-write-wins。

### 3.5 `p04_router.py`

新增 API：

```text
POST /api/worldops/rooms/{room_id}/handoffs
POST /api/worldops/handoffs/consume
POST /api/worldops/rooms/{room_id}/reconnect-plans
POST /api/worldops/rooms/{room_id}/reconnect-acks
```

所有 room-scoped API 核對 `X-WorldOps-Session`、session active status 及 room binding。Handoff cursor 高於權威 room version 時回傳衝突。

### 3.6 `p04_runtime.py` 與 `p04_app_factory.py`

- 將 P04 Router 附加至既有 P03 FastAPI app。
- P03 command service 仍是權威狀態服務。
- P04 只負責 recovery transport、handoff 及 reconnect receipts。
- `formal_runtime_allowed` 持續為 false。

## 4. Browser Runtime

### 4.1 `worldops_offline_queue.js`

操作狀態：

```text
queued → sending → acked
                 → rejected
                 → conflict → superseded → replacement queued
```

控制條件：

- command ID 與 idempotency key 均不可重複。
- expected version 必須為非負整數。
- payload 必須為 plain object。
- queue cache envelope 必須明確標示 `authoritative = false`。
- restore 時重新計算 command hash，阻擋被修改的 cache。
- crash 後的 `sending` 操作恢復為 `queued`，留下 `interrupted_at`。
- active conflict 阻擋後續傳送。
- rebase 先驗證 replacement；驗證失敗時原 conflict 狀態不變。
- 不自動修改後續操作的 expected version。

### 4.2 `worldops_device_handoff.js`

- 同一時間只允許一張尚未匯出的 handoff。
- 明文 token 只能匯出一次。
- target device class 必須相符。
- client 不將 handoff token 寫入 cache。
- client authority 固定為 false。

## 5. SQL Server 增量資料設計

新增資料表：

```text
wop.Schema_Migration
wop.Snapshot_Rebuild_Receipt
wop.Device_Handoff
wop.Reconnect_Receipt
wop.Offline_Operation_Receipt
```

新增 Stored Procedures：

```text
wop.usp_Issue_Device_Handoff
wop.usp_Consume_Device_Handoff
wop.usp_Record_Snapshot_Rebuild
wop.usp_Record_Reconnect_Plan
wop.usp_Acknowledge_Reconnect
wop.usp_Record_Offline_Operation_Receipt
```

SQL 控制條件：

- migration 為新增式，不使用 `DROP TABLE` 或 `TRUNCATE TABLE`。
- Handoff 只保存 `token_hash CHAR(64)`。
- Issue／consume 使用 transaction 與 `UPDLOCK, HOLDLOCK`。
- Handoff cursor 不得超過 `wop.Room.current_version`。
- Reconnect acknowledgement 不得退回或超過 delivered range。
- 所有 P04 tables 固定 `formal_runtime_allowed = 0`。
- Synthetic dry run 全部位於 transaction，最後 rollback。

## 6. 錯誤修正紀錄

本批次開發中發現並修正：

1. FastAPI 在 nested route function 與 postponed annotations 下，把動態 `Annotated[..., Header(alias=...)]` 誤判為 query parameter。已改成 module-level fixed header alias 與 `Header(default=None, alias=...)`。
2. Reconnect snapshot fallback 原先可能採用低於 client cursor 的舊 Snapshot，導致重播已套用事件。現在只有 snapshot version 高於 client cursor 才使用 fallback。
3. Reconnect 原先未阻擋 repository 回傳高於權威 room version 的事件。已加入 `RECONNECT_EVENT_AHEAD`。
4. Offline queue restore 原先未核對 command hash，也未把 crash 前 `sending` 操作恢復為可重試狀態。已加入 hash 驗證及 interrupted recovery。
5. Offline rebase 原先先改寫原 conflict，再驗證 replacement；replacement 失敗時可能失去 conflict gate。現在先完成 replacement 驗證，再原子更新 queue。
6. SQL expired handoff 原先在未 commit 的 transaction 中更新後直接 THROW，更新可能被 rollback。現在先 commit `expired` 狀態，再回傳錯誤。
7. Device handoff client 原先可在上一張 token 尚未匯出時覆寫 pending handoff。現在回傳 `HANDOFF_EXPORT_REQUIRED`。

## 7. 測試

本機實際執行：

```text
Python full regression: 38 tests passed
P04 Python subset: 23 tests passed
P01 Runtime JS: 10/10 passed
P02 Boot JS: 8/8 passed
P04 Offline/Handoff JS: 7/7 passed
Static contract: passed
Python compileall: passed
JavaScript syntax: passed
```

此結果來自隔離本機重建目錄。GitHub Actions 與使用者 SQL Server runtime 需在分支提交後另行驗證。

## 8. Gate

```text
P04 implementation_status = complete
P04 local_verification_status = passed
GitHub Actions = pending after commit
SQL Server runtime = pending
formal_runtime_allowed = false
canon_auto_write = false
client_cache_authoritative = false
next_batch = P05-NARRATIVE-NODE-SCENE-PASSAGE-GRAPH
```
