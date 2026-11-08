# CREDITS / 素材與參考來源

本專案所有遊戲畫面、Canvas 繪圖、Web Audio 音效、粒子／震動／連擊效果，以及版面樣式，皆為本專案自行撰寫，**沒有複製第三方圖片、字型、音效或程式碼**。

## 參考資料（只用規則，不含素材）

- `playerkousas-rgb/readme`（SCOUT SYSTEM 規則／起手包知識庫）：<https://github.com/playerkousas-rgb/readme>
  - `templates/repo-starter/skills/promoted/web-motion/SKILL.md`：動畫施工紅線（`transform`／`opacity`、`prefers-reduced-motion`、60fps、390/768/1440）
  - `templates/repo-starter/skills/promoted/design-review/SKILL.md`、`templates/repo-starter/docs/design-review.md`：三寬度視覺驗收與「未做就要註明」
  - `docs/23-design-resources.md`、`docs/24-similar-products.md`、`docs/33-icon-standard.md`：設計資源、相近產品、圖標標準（G11）
  - `docs/12-copyright-scout-system.md`（W1／W8）、`docs/44-bilingual-ui.md`（L1–L6）、`docs/01-slim.md`、`docs/02-foolproof.md`：交付與雙語規則
  - 檢視紀錄與取捨見 [`docs/game-feel-reference.md`](docs/game-feel-reference.md)

- `Astra AI Lab`（<https://app.astra-ai.co/lab>）及其遊戲詳情頁：只參考**遊戲化結構**（每日固定題、星數／連續日、三步教法、答中解碼揭示）。檢視紀錄與取捨見 [`docs/astra-lab-reference.md`](docs/astra-lab-reference.md)。**沒有**複製其封面圖、3D 素材、版面或程式碼；沒有使用其商標作本站品牌。

## 現有第三方套件

- 頁面用到的 `qrcode.min.js`、`jsQR.js`、`peerjs.min.js` 等靜態檔沿用專案原有版本，未因本次遊戲改善新增任何依賴。
- `jsdom`、`vite`、`wrangler` 為開發／測試用 devDependencies。

## 尚待處理

- G11 的 9 個站台圖標（PNG／ICO、maskable 66%、≤260KB）**尚未製作**；目前只有 `public/favicon.svg`。若之後要做完整 PWA，需補齊並在此列出圖標來源與授權。
