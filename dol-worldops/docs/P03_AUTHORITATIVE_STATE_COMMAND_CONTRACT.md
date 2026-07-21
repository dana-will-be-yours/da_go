# P03 Authoritative State and Command Contract

版本：0.3.0  
分支：`feature/dol-worldops`  
狀態：`implementation-complete-local-contract-passed-sql-runtime-pending`

## 1. 目的

P03 建立多人 TRPG 房間的權威狀態變更契約。Client 不直接修改正式房間狀態，每一項操作都先形成 command，經 server 驗證 session、actor、capability、idempotency 與 expected version 後，才產生單一 append-only event 及下一個 room version。

```text
Client intent
→ CommandEnvelope
→ session/actor/capability validation
→ idempotency check
→ expected_version check
→ command-specific validation
→ append one Room_Event
→ update Room.current_version and state
→ Operation_Receipt
→ WebSocket/event-sync publication
```

## 2. DoL 架構轉譯

DoL 以 SugarCube state history、save、autosave、version update 及 passage lifecycle 維持單機狀態。WorldOps 將這些模式轉譯為多人伺服器架構：

| DoL 工程模式 | WorldOps P03 契約 |
|---|---|
| State variables | Server-authoritative room aggregate |
| Passage mutation | Validated command and event |
| Save history | Append-only room event stream |
| Autosave | Server snapshot request and authoritative snapshot |
| Save version | `room_version` and `schema_version` |
| Back compatibility | Explicit migration registry，於後續批次建立 |
| Local save | Disposable client cache，`authoritative = false` |

DoL 的角色、故事、成人內容、圖片及音訊沒有進入本分支。

## 3. Command Envelope

```text
command_id
idempotency_key
room_id
session_id
actor_member_id
command_type
expected_version
payload
client_time
```

`command_id` 識別一次具體 command，相同 ID 只能對應相同 fingerprint。`idempotency_key` 識別一次使用者意圖；相同 key 與相同 fingerprint 可安全重送，內容不同時回傳 `IDEMPOTENCY_KEY_REUSED`。

Client 必須提供 `expected_version`。若與 server 當前版本不同，回傳 `VERSION_CONFLICT` 且不產生 event。取得最新狀態後的新意圖需使用新的 idempotency key。

## 4. Command 結果

| 狀態 | 意義 | Event 數量 | Room version |
|---|---|---:|---:|
| `accepted` | 首次驗證通過 | 1 | +1 |
| `duplicate` | 已接受 command 的相同重送 | 0 | 不變 |
| `conflict` | `expected_version` 不符 | 0 | 不變 |
| `rejected` | 權限、型別、payload 或識別碼違規 | 0 | 不變 |

先前的 conflict 或 rejected request 以相同 idempotency key 重送時，回傳原狀態與新的 replay receipt，以保留 HTTP 語意及重試判斷。

## 5. Append-only Event Stream

每一個 accepted command 產生一筆 `Room_Event`：

```text
event_id
room_id
room_version
command_id
event_type
payload
payload_hash
occurred_at
```

約束：

- `(room_id, room_version)` 唯一。
- `(room_id, command_id)` 唯一。
- 不更新或刪除已存在 event。
- `Room.current_version` 必須等於該房間 event stream 的最大版本。

初始 command registry：

```text
room.message.append → room.message.appended
room.token.move → room.token.moved
room.scene.activate → room.scene.activated
```

## 6. Session 與 Capability

`Client_Session` 綁定 session、room、actor、capabilities、status 與 expires_at。Command 同時核對 session 狀態、期限、room、actor、command registry 與 capability。API 另要求 `X-WorldOps-Session` header 與 command body 的 `session_id` 相同。

## 7. Snapshot

Server snapshot 包含 snapshot、room、room version、schema、state、state hash 及 `authoritative = true`。Client 可讀取 server snapshot、保存非權威快取及提出 snapshot request。Client 無權宣稱已寫入正式 snapshot。Snapshot 建立需具備 `snapshot.request` capability 並通過 exact-version 檢查。

## 8. Sync 與 Reconnect

HTTP：

```text
GET /api/worldops/rooms/{room_id}/events?after_version=N
```

WebSocket：

```text
/ws/worldops/rooms/{room_id}?session_id=...&after_version=N
```

Reconnect 流程：

```text
Client last cursor
→ subscribe broker
→ read authoritative backlog after cursor
→ send sync frame
→ stream later events
→ ignore event version <= last sent
→ update monotonic Sync_Cursor
```

Process-local broker 只供 reference runtime 與測試。正式多程序部署需改接可持久化 pub/sub，SQL Server event stream 仍為權威來源。

## 9. FastAPI Endpoint

```text
GET  /api/worldops/health
POST /api/worldops/rooms/{room_id}/commands
GET  /api/worldops/rooms/{room_id}/events
GET  /api/worldops/rooms/{room_id}/snapshot
POST /api/worldops/rooms/{room_id}/snapshot-requests
WS   /ws/worldops/rooms/{room_id}
```

HTTP mapping：accepted／duplicate 200、snapshot created 201、version conflict 409、session／capability denial 403、room missing 404、command validation 422。

## 10. SQL Server Objects

新增 `wop` schema：

```text
wop.Room
wop.Command_Type
wop.Client_Session
wop.Room_Command
wop.Room_Event
wop.Room_Snapshot
wop.Sync_Cursor
wop.Operation_Receipt
```

Stored procedures：

```text
wop.usp_Append_Room_Command_Event
wop.usp_Create_Room_Snapshot
wop.usp_Read_Room_Events
```

`usp_Append_Room_Command_Event` 使用 transaction、`UPDLOCK` 與 `HOLDLOCK`，在同一交易中執行 idempotency、版本檢查、command 保存、event append、room version 更新及 receipt 建立。

## 11. 權威性與研究界線

```text
SQL Server room/event/snapshot = authoritative
In-memory store = reference test double
Browser cache = non-authoritative
Process-local broker = non-authoritative transport
AI output = candidate only
formal runtime = disabled
formal collection = disabled
canon auto-write = disabled
```

## 12. 測試

本次隔離環境已執行：

```text
Python/Pytest contract tests = 18/18 passed
Python compileall = passed
FastAPI/Uvicorn health smoke = HTTP 200
SQL static contract = 3/3 included in the 18 tests
```

SQL Server migration、stored procedures、constraint trust 及 synthetic dry run尚未在使用者 SQL Server 執行。

## 13. 下一批次

```text
P04-SNAPSHOT-MIGRATION-RECONNECT-HANDOFF
```

範圍：SQL Server repository adapter、event replay reducer、snapshot rebuild、schema migration registry、offline operation queue、WebSocket reconnect and backpressure、desktop↔mobile handoff、conflict-resolution UI contract 及 multi-client race tests。
