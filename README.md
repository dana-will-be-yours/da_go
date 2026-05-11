# da_go

現行版本：`1.15.0-balanced-character-preview`

公開頁：

```text
https://dana-will-be-yours.github.io/da_go/game.html?reset=1&v=1.15.0-balanced-character-preview
```

## 1.15.0 修正重點

本版只針對角色創建預覽與角色創建加成修正：

1. 角色預覽中所有已選身分名稱，均以角色下拉選單或身分對照表的中文名稱顯示。
2. 不再把已選身分顯示為「地方人士」、「未定身分」或其他不一致名稱。
3. 每一項身分、出身地、性格、屬性點配置、特殊身世都提供 4 點技能值。
4. 加成預覽列出每一個已選項目的技能值與特技，避免有的選項多、有的選項少。

新增檔案：

```text
assets/character-balanced-effects.js
```

## 驗證

```powershell
npm.cmd test
```
