# P04 Test Report

日期：2026-07-21  
目標分支：`feature/dol-worldops`  
版本：0.4.0  
本機環境：Linux、Python 3.13.5、Node.js 22.16.0

## 實際執行結果

| 測試層 | 結果 |
|---|---:|
| Python full regression | 38／38 通過 |
| P04 Python subset | 23／23 通過 |
| P01 Runtime JS | 10／10 通過 |
| P02 Boot Lifecycle JS | 8／8 通過 |
| P04 Offline Queue／Handoff JS | 7／7 通過 |
| Static contract | 通過 |
| Python compileall | 通過 |
| P04 JavaScript syntax | 通過 |
| SQL additive/static contract | 4／4 通過 |
| 外部 DoL narrative/media | 0 |
| Plaintext handoff token SQL column | 0 |
| Client authoritative snapshot write | 0 |
| Canon auto-write | 0 |
| Formal runtime | false |

## P04 Python 測試範圍

- Schema migration path、seal、duplicate、no-path、source immutability。
- Snapshot state hash、event payload hash、event gap、duplicate event、room mismatch。
- Handoff single-use、expiry、binding、revoke。
- Reconnect bounded window、snapshot fallback、old snapshot rejection、event-ahead、ack monotonicity。
- FastAPI header parsing、active session、cursor-ahead、handoff consume、reconnect plan／ack。
- P04 runtime installer 與 app wrapper。
- SQL object、safety constraints、validation 與 synthetic rollback contract。

## P04 JavaScript 測試範圍

- Offline queue persistence。
- command ID／idempotency key uniqueness。
- accepted／duplicate／rejected／conflict 狀態。
- conflict gate 與 explicit rebase。
- interrupted sending recovery。
- cached command hash tamper detection。
- failed rebase atomicity。
- Handoff single export、device class binding、client authority false。

## 修正後回歸

第一輪測試發現 FastAPI session header 被解析成 query parameter。修正為 module-level header alias 後，P04 Router tests 3／3 通過。

完整回歸測試第一輪又發現 static scanner 會讀取 Python SQL test 中的禁止字串並形成 false positive。測試改採字串片段組合，保留實際 SQL 掃描效果，Static contract 隨後通過。

## 未完成驗證

- GitHub Actions branch workflow。
- 使用者 SQL Server migration／constraint trust／procedure runtime。
- 真實跨裝置 browser handoff。
- WebSocket 實際 reconnect 與 backpressure。
- 長時間網路中斷及多 worker concurrency。
