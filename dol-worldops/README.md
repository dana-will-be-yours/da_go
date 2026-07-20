# DaGo × DoL WorldOps

目標分支：`feature/dol-worldops`  
目前版本：`0.1.0-runtime-foundation`  
狀態：`experimental-isolated`

此目錄承接 DoL 架構分析與 TRPG WorldOps 的 clean-room 實作。第一個提交建立跨裝置 Runtime 基礎，不改寫現有 DaGo 遊戲入口。

## 執行測試

```bash
cd dol-worldops
npm test
```

## 開啟 Demo

必須透過 HTTP 提供 ES modules，例如：

```bash
python -m http.server 8080
```

再開啟：

```text
http://127.0.0.1:8080/dol-worldops/demo/
```

## 強制原則

- 所有開發只提交至 `feature/dol-worldops`。
- `main` 不直接修改。
- SQL Server 是正式資料權威層。
- Client cache 永遠標示 `authoritative = false`。
- 外部 DoL 原作內容不進入 DaGo canon、公開素材或模型訓練資料。
- 手機版與電腦版使用同一功能契約，只改變響應式排列。
