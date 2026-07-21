# Session Handoff

目前批次：`P02-BOOT-LIFECYCLE`  
實作結果：完成  
本機 Contract 驗證：通過  
GitHub Actions：待獨立回傳  
下一批次：`P03-AUTHORITATIVE-STATE-COMMAND-CONTRACT`

## 已完成

- Event Bus、Macro Registry、Widget Registry。
- 非權威 Client Cache。
- Receipt Store 與 Error Boundary。
- Deterministic Module Loader。
- Startup failure reverse rollback。
- Module hook timeout。
- Dependents-first suspend／stop。
- Dependencies-first start／resume。
- Resume failure recovery。
- Runtime Bridge。
- Guarded Config Loader。
- Sealed Capability Registry。
- Default-deny Permission Gate。
- Session Handshake 與 credential receipt redaction。
- Authoritative server Snapshot hydration。
- Client snapshot request-only contract。
- Boot Coordinator。
- Autosnapshot request scheduler。
- Receipt flush。
- P02 Demo、JSON Schema、測試與 workflow。

## P03 目標

1. 建立 `wop` schema 的新增式 SQL migration。
2. 建立 `wop.Room`、`Room_Command`、`Room_Event`、`Room_Snapshot`。
3. 建立 `Client_Session`、`Sync_Cursor` 與 `Operation_Receipt`。
4. 定義 command envelope 與 command type registry。
5. 實作 expected-version optimistic concurrency。
6. 實作 idempotency key 與 duplicate command receipt。
7. 實作 append-only room event。
8. 實作 snapshot rebuild 及 schema migration entry。
9. 實作 WebSocket cursor、missing-event replay 與 reconnect contract。
10. 建立 synthetic SQL dry run 與 rollback test。
11. 建立 Python FastAPI server contract，不啟用正式收案。
12. 建立 client command queue 與 conflict handling，不使用 last-write-wins。

## P03 不得破壞的界線

```text
main direct write = false
formal collection = false
canon auto write = false
client cache authority = false
external DoL narrative/media import = false
destructive SQL = false
```

## 驗證基線

```text
P01 Runtime contract = 10/10
P02 Boot lifecycle = 9/9
Static contract = passed
GitHub Actions = pending independent run
```
