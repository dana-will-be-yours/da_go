# P02 Boot Lifecycle Test Report

日期：2026-07-21  
分支：`feature/dol-worldops`  
版本：`0.2.0`

## 實作狀態

```text
P02 implementation = complete
formal_runtime_allowed = false
canon_write_allowed = false
client_cache_authoritative = false
```

## 本次執行的隔離本機驗證

本次在 `/mnt/data/worldops_p02_local` 重建分支 Runtime 與 P02 新增檔案，使用 Node.js 執行：

```bash
npm test
```

結果：

| 測試組 | 結果 |
|---|---:|
| P01 Runtime contract | 10／10 通過 |
| P02 Boot lifecycle contract | 9／9 通過 |
| Static contract | 通過 |
| 新增／修改 Runtime syntax check | 通過 |

P02 測試涵蓋：

1. 設定合併、安全旗標及 secret-like key 阻擋。
2. Sealed capability registry 與 reserved privilege 阻擋。
3. Default-deny permission gate。
4. Session room／schema 驗證及 credential receipt redaction。
5. Authoritative server snapshot hydration 與 client request-only contract。
6. Dependencies-first start、dependents-first suspend、dependencies-first resume、dependents-first stop。
7. 完整 config→capability→handshake→permission→snapshot→runtime 流程。
8. Autosnapshot request、suspend、resume、stop、handshake close 與 receipt flush。
9. Permission failure 後的 handshake close 與 Runtime 未啟動狀態。
10. Module hook timeout negative test。

## CI 狀態

GitHub Actions workflow 已更新為執行：

```text
npm ci --ignore-scripts
npm test
16 個 JavaScript syntax checks
```

本報告不將尚未回傳的 GitHub Actions workflow 標示為通過。CI 狀態需由 GitHub workflow run 獨立確認。

## Gate

```text
P02 implementation = complete
P02 local contract verification = passed
P02 GitHub Actions verification = pending
next batch = P03-AUTHORITATIVE-STATE-COMMAND-CONTRACT
```
