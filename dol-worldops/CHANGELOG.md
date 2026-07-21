# Changelog

## 0.2.0 - 2026-07-21

- 完成 P02 Boot Lifecycle 實作。
- 新增安全設定載入器，阻擋 client config 中的 secret-like 欄位及 prototype pollution key。
- 新增 sealed capability registry，阻擋 `canon.write`、`formal.collection.enable` 與破壞性資料庫能力。
- 新增 default-deny permission gate。
- 新增 session handshake，核對 room、schema、版本與 server capabilities，receipt 不保存明文 credential。
- 新增 authoritative server snapshot hydration；瀏覽器只保存非權威快取並只能提出 snapshot request。
- 新增 Boot Coordinator，完整執行 config、capability、handshake、permission、snapshot、runtime、autosnapshot、suspend、resume、stop 及 receipt flush。
- Module Loader 新增 `suspend`、`resume`、resume failure recovery 與 hook timeout。
- Runtime Bridge 新增暫停、恢復及 resilient stop。
- Demo 改為 P02 完整啟動流程。
- 新增 9 項 P02 contract tests、兩份 JSON Schema 與 CI syntax checks。
- 維持 `formalRuntimeAllowed = false`、`canonWriteAllowed = false` 與 `authoritative = false`。

## 0.1.1 - 2026-07-21

- 完成 P01 Runtime Foundation。
- 新增非權威 client cache、receipt store、error boundary、module loader 與 runtime bridge。
- 新增 module dependency sort、missing dependency、cycle detection、start rollback 與 reverse stop。
- 新增 desktop／tablet／mobile widget contract。
- 新增 Runtime 與 static contract tests。
- 新增不依賴外部套件的 ES module Demo。
- 維持 `canonWriteAllowed = false`、`authoritative = false` 與 formal runtime disabled。

## 0.1.0 - 2026-07-21

- 建立 Event Bus、Macro Registry 與 Widget Registry 初始版本。
