# Changelog

## 0.4.0 - 2026-07-21

- 新增 deterministic Schema Migration Registry。
- 新增 authoritative Snapshot + contiguous Event Replay 及 hash 驗證。
- 新增 bounded Reconnect Plan、Snapshot fallback、backpressure 與 monotonic acknowledgement。
- 新增 single-use、short-lived desktop／tablet／mobile Handoff；SQL 僅保存 token hash。
- 新增非權威 Offline Operation Queue、interrupted-send recovery、cache tamper detection 及 explicit conflict rebase。
- 新增 P04 FastAPI routes、P03 app extension factory 及開發入口整合。
- 新增 P04 SQL migration、validation 與 transaction rollback synthetic dry run。
- 新增 23 項 P04 Python tests、7 項 P04 JavaScript tests 及 4 項 SQL static tests。
- 修正 FastAPI session header 被解析成 query parameter。
- 修正舊 Snapshot fallback、event-ahead、failed rebase atomicity、expired handoff transaction 及 pending token overwrite。
- 維持 `formal_runtime_allowed = false`、browser authority disabled 及 canon auto-write disabled。

## 0.3.0 - 2026-07-21

- 新增 P03 server-authoritative Room、Command、Event、Snapshot、Client Session 與 Sync Cursor 契約。
- 新增 optimistic concurrency、idempotency、deterministic reducers、REST／WebSocket sync 及 SQL Server `wop` schema。
- 加入 Python API／command／SQL tests；正式 SQL Server runtime 仍需外部環境驗證。

## 0.2.0 - 2026-07-21

- 完成 P02 Boot Lifecycle 實作。
- 新增安全設定載入器，阻擋 client config 中的 secret-like 欄位及 prototype pollution key。
- 新增 sealed capability registry，阻擋 `canon.write`、`formal.collection.enable` 與破壞性資料庫能力。
- 新增 default-deny permission gate。
- 新增 session handshake，核對 room、schema、版本與 server capabilities，receipt 不保存明文 credential。
- 新增 authoritative server snapshot hydration；瀏覽器只保存非權威快取並只能提出 snapshot request。
- 新增 Boot Coordinator 與 `suspend`／`resume`／rollback。

## 0.1.1 - 2026-07-21

- 完成 P01 Runtime Foundation。
- 新增非權威 client cache、receipt store、error boundary、module loader 與 runtime bridge。
- 新增 module dependency sort、missing dependency、cycle detection、start rollback 與 reverse stop。
- 新增 desktop／tablet／mobile widget contract。

## 0.1.0 - 2026-07-21

- 建立 Event Bus、Macro Registry 與 Widget Registry 初始版本。
