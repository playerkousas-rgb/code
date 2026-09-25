# Scout System 密碼旗號學習平台 🧭

> 香港童軍總會 · 筲箕灣區小助手  
> 集密碼轉換、試卷、互動搶答與遊戲化訓練於一身

這個靜態 Web App 支援 13 種密碼／通訊方式，並內建 Canvas 遊戲化訓練引擎「**密碼防衛戰**」（繁體中文版）。

## 主要模式

### 1. 編碼工具

- 摩斯密碼、旗號、朱高密碼、點字、座標密碼及電話 T9
- 凱撒位移、反射、倒序及 NATO 音標
- 即時轉換、對照表高亮、結果複製、摩斯音訊
- 自動保留未完成訊息草稿

### 2. 試卷生成

- 將工具中的訊息加入題庫
- 每題可選密碼類型、整條／輪播／聲音模式
- **每題獨立設定**：旗號列印樣式（火柴人 / 貝登堡公仔）、輪播速度、方向（翻譯 / 倒轉）
- **倒轉模式**：顯示英文原字，要成員在試卷上自行寫出密碼符號
- 投影播放及 A4 列印；列印標題為「童軍密碼考核試卷」
- 題目保存在瀏覽器 `localStorage`

### 3. 互動搶答

- 領袖建立 PeerJS 搶答房間及 QR Code
- 成員以手機加入、按鍵或「搖一搖」搶答
- 顯示搶答次序及在線人數

> 搶答模式需要網絡，以載入 PeerJS、QR Code 及建立點對點連線。

### 4. 密碼防衛戰（新增）

前往 `/training/` 即可開始遊戲化訓練：

- 6 種訓練密碼：摩斯、朱高、點字、SCOUT 座標、電話 T9、旗號
- 三段學習路線：
  - **新手學習**：12 題、每次一個目標、四選一、提示及答錯解說
  - **守城任務**：20 題、完整 A–Z 鍵盤及有限血量
  - **無限挑戰**：敵人逐步加速，挑戰最高分
- 四選一干擾答案會優先選用外觀／編碼相近的字母，而非完全隨機
- 答錯後顯示正確答案及符號拆解，並要求再答對才進入下一題
- 自訂速度、血量及限時
- 錯誤字母會跨局增加再次出現的機會
- 每局顯示各密碼準確率、弱項字母及下一步訓練建議
- 保存最高分、上次準確率及完成局數
- 手機提供 A–Z 畫面鍵盤，不會被原生鍵盤遮住遊戲
- 支援觸控震動回饋、音效開關及鍵盤操作

訓練模式採用內建 Canvas 引擎；遊戲中的旗號以 Canvas 即時繪畫，毋須預載 26 張圖片，減少手機流量。

## ☁ 雲端題庫 + 排行榜（Supabase）

配合 [Supabase](https://supabase.com)（免費方案已足夠）即可把題庫與排行榜搬到雲端，
讓全區／全團的成員共用同一份題庫，並在「無限挑戰」上互相競爭排名。

### 有咗雲端會多咗啲乜

- **共用題庫**（`question_bank`）：領袖在 `training/bank.html` 新增、批次匯入題目
  （支援 `答案,提示` 或 `密碼,答案,提示`，亦可由一個詞語如 `SCOUT` 逐個字母開題），
  遊戲每次出題有 60% 機會由雲端題庫抽取，並照樣優先抽成員錯過的字母。
- **全球排行榜**（`runs`）：每局完結自動提交分數、準確率、破解數、最高連擊、密碼組合及用時，
  排行榜以「每位玩家最好一局」計算，可按今日／本週／本月／總榜、路線及密碼篩選。
- **遊戲內排行榜**：開始畫面即時顯示 Top 20；遊戲結束畫面會顯示
  「第 N 名 / 共 M 個紀錄 · 前 X%」及是否個人新紀錄。
- **防作弊**：成績只能經 `submit_run()` RPC 寫入，伺服器會檢查分數與破解數是否合理、
  每題最少 150ms、同一個 client 一分鐘最多 10 局、一小時最多 60 局。
- **離線都玩到**：題庫與排行榜均有 localStorage 快取；未能連線時自動退回隨機出題，
  個人紀錄（最高分、里程碑、徽章）本來就是本機計算，完全不受影響。

### 三步設定

1. 到 [supabase.com](https://supabase.com) 建立免費專案。
2. 左側 **SQL Editor** → 新增 query → 貼上 `supabase/schema.sql` 全部內容 → **Run**。
   （會建立 `question_bank`、`runs` 兩個資料表、RLS 政策與 4 個 RPC。）
3. 左側 **Project Settings → API** 複製 **Project URL** 與 **anon public** key：
   - 推薦：寫入 `js/cloud-config.js` 後部署，全站所有裝置共用；
   - 或者：在 `training/bank.html`／訓練開始畫面的「⚙ 雲端連線」貼上，只儲存在該裝置。

> 只可使用 **anon public key**，切勿把 `service_role` key 放到前端。

### 審核與信任模式

成員新增的題目預設為 `pending`（待審核），需在 Supabase Dashboard →
Table Editor → `question_bank` 把 `status` 改成 `approved` 才會在遊戲出現。
若只是領袖自己人使用，可執行 `supabase/schema.sql` 最底的「信任模式」SQL，讓題目直接上架。

### 未設定 Supabase 時

按下「本機模擬模式」即可用 localStorage 模擬整條流程（題庫、排行榜、篩選、示範成績），
方便先試玩或作離線示範；數據只存在該瀏覽器。

## 手機體驗改善

- 底部四模式導覽及安全區域（safe area）支援
- 手機側欄遮罩、Esc 關閉及正確焦點樣式
- 所有主要操作最少約 44px 觸控高度
- 編碼工具改為單欄卡片、可橫向瀏覽大型對照表
- 投影控制及搶答按鈕針對窄螢幕調整
- 支援 `prefers-reduced-motion`

## 本機開發

```bash
npm install
npm run dev
```

Vite 會預設開啟主 App；訓練模式位於：

```text
http://localhost:5173/training/
```

## 檢查及建置

```bash
npm run check   # HTML 必要元素、重複 ID、JavaScript 語法
npm run lint    # 執行靜態完整性檢查
npm run build   # 同時建置主 App 與 training 多頁入口
```

正式建置會把共用旗號圖片複製到 `dist/images/`，確保兩個入口均能正確載入。

## 專案結構

```text
├── index.html              # 主 App
├── css/style.css           # 主 App 及響應式樣式
├── js/app.js               # 編碼、試卷、投影、搶答邏輯
├── training/index.html     # 密碼防衛戰（Canvas 單頁遊戲）
├── training/bank.html      # 雲端題庫管理 + 排行榜（Supabase）
├── js/cloud.js             # 雲端層：題庫／排行榜／離線快取／本機模擬
├── js/cloud-config.js      # Supabase URL 與 anon key（部署前填寫）
├── js/supabase.min.js      # 內置 Supabase JS 客戶端（UMD）
├── supabase/schema.sql     # 資料表、RLS 政策、submit_run / get_leaderboard 等 RPC
├── images/                 # 旗號圖片 (a.png - z.png)
├── scripts/check-static.mjs
├── vite.config.ts          # 主頁 + training 多頁建置
└── vercel.json
```

## 部署

專案可直接作為靜態網站部署；目前 `vercel.json` 設為直接輸出專案根目錄。也可執行 `npm run build`，再部署 `dist/`。

## 瀏覽器資料

以下資料只會保存在成員自己的瀏覽器：

- `skw_message_draft`：編碼草稿
- `skw_test_questions`：試卷題目（含每題的密碼類型、方向、速度、旗號樣式等）
- `skw_cipher_training_settings`：遊戲設定
- `skw_cipher_training_progress`：訓練紀錄（最高分、里程碑、週月排行、歷史折線）
- `skw_cipher_training_achievements`：完美主義徽章（6 密碼 × 3 路徑）
- `skw_cipher_cloud_config`：雲端連線設定（只在使用「⚙ 雲端連線」時產生）
- `skw_cipher_cloud_player`：排行榜稱號與隨機 client id（用於限速及標示自己）
- `skw_cipher_cloud_questions` / `skw_cipher_cloud_board`：雲端題庫與排行榜快取

清除瀏覽器網站資料會一併移除以上紀錄。

## 授權

本專案沿用原專案的 MIT 授權聲明，可自由使用、修改及分發。
