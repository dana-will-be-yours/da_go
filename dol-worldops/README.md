# DaGo × DoL WorldOps

目標分支：`feature/dol-worldops`  
目前版本：`0.4.0-snapshot-reconnect-handoff`  
狀態：`experimental-isolated`

本目錄以 DoL 的啟動、狀態、passage、存檔、版本遷移及跨裝置模式作為架構參考，採 clean-room 方式建立多人 TRPG WorldOps。外部 DoL 故事、角色、成人內容、圖片、音訊與翻譯正文不進入 DaGo。

## 目前批次

| 批次 | 完成內容 |
|---|---|
| P01 | Event Bus、Macro／Widget Registry、非權威 Cache、Receipt、Error Boundary、Module Loader、Runtime Bridge |
| P02 | Config、Capability、Permission、Session Handshake、Server Snapshot、Suspend／Resume、Boot Coordinator |
| P03 | Server-authoritative Command／Event／Snapshot、optimistic concurrency、idempotency、REST／WebSocket contract、SQL `wop` schema |
| P04 | Schema Migration、Event Replay、Reconnect、Offline Queue、跨裝置 Handoff、P04 API 及 SQL receipts |

## 執行測試

```bash
cd dol-worldops
npm ci --ignore-scripts
python -m pip install -e ".[test]"
npm test
python -m pytest
python -m compileall -q server
```

本機 P04 建置驗證：

```text
Python full regression = 38/38
P01 Runtime JS = 10/10
P02 Boot JS = 8/8
P04 Offline/Handoff JS = 7/7
Static contract = passed
```

GitHub Actions 與使用者 SQL Server runtime 仍需各自驗證。

## 啟動 FastAPI 開發入口

```bash
uvicorn app:app --app-dir server --host 127.0.0.1 --port 8788
```

預設合成身分：

```text
room_id = DEMO-ROOM
session_id = DEMO-SESSION
```

## P04 API

```text
POST /api/worldops/rooms/{room_id}/handoffs
POST /api/worldops/handoffs/consume
POST /api/worldops/rooms/{room_id}/reconnect-plans
POST /api/worldops/rooms/{room_id}/reconnect-acks
```

Room-scoped API 使用：

```text
X-WorldOps-Session: <session_id>
```

## P04 Recovery Flow

```text
權威 Snapshot
→ Schema Migration Path
→ Event hash／版本／room 核對
→ 連續 Event Replay
→ Result State Hash
→ Rebuild Receipt
```

```text
Client cursor
→ Current room version
→ Bounded event window
→ 必要時採用較新的 authoritative Snapshot
→ Missing-event replay
→ Monotonic acknowledgement
```

```text
Source device
→ Issue short-lived handoff token
→ 僅保存 token hash
→ Export plaintext once
→ Target device consumes once
→ Reconnect from bound cursor
```

## Offline Operation Queue

```text
queued → sending → acked
                 → rejected
                 → conflict → superseded → replacement queued
```

Offline queue 永遠為 `authoritative = false`。Conflict 發生後，後續 send 停止；rebase 必須建立新 command ID 與 idempotency key，不採 last-write-wins。

## SQL Server

執行順序：

```text
database/migrations/001_wop_authoritative_runtime.sql
database/validation/001_wop_authoritative_runtime_validation.sql
database/synthetic/001_wop_authoritative_runtime_dry_run.sql
database/migrations/002_wop_snapshot_migration_handoff.sql
database/validation/002_wop_snapshot_migration_handoff_validation.sql
database/synthetic/002_wop_snapshot_migration_handoff_dry_run.sql
```

P04 新增：

```text
wop.Schema_Migration
wop.Snapshot_Rebuild_Receipt
wop.Device_Handoff
wop.Reconnect_Receipt
wop.Offline_Operation_Receipt
```

Handoff 資料表只保存 `token_hash`；不保存明文 token。

## 權威性界線

```text
SQL Server／Application Server = authoritative
Server Snapshot = authoritative true
Browser cache = authoritative false
Offline queue = authoritative false
Handoff client = authoritative false
AI output = candidate only
formal runtime = false
canon auto-write = false
```

## 強制原則

- 所有開發只提交至 `feature/dol-worldops`。
- `main` 不直接修改。
- SQL Server 是正式資料權威層。
- 不使用破壞性 SQL migration。
- Client、AI、Macro、Widget、Handoff 與 Offline Queue 無權直接改寫 canon。
- 外部 DoL 內容不進入 DaGo canon、公開素材或模型訓練資料。
- 桌面、平板及手機使用相同功能契約。
- 正式研究收案維持關閉。

## 下一批次

`P05-NARRATIVE-NODE-SCENE-PASSAGE-GRAPH`

P05 將建立 Narrative Module、Node、Choice、Condition、Transition、State Mutation、Scene、Encounter 與 Open Plot Thread，並保留 GM／PL 自由輸入及人工裁定。
