# SKWSCOUT 密碼旗號學習平台 🧭

> 香港童軍總會 · 筲箕灣區小助手  
> 集密碼轉換、試卷、互動搶答與遊戲化訓練於一身

這個靜態 Web App 支援 13 種密碼／通訊方式，並已整合 [`playerkousas-rgb/code_game`](https://github.com/playerkousas-rgb/code_game) 的 **CIPHER DEFENSE**，改造成繁體中文「密碼防衛戰」訓練模式。

## 主要模式

### 1. 編碼工具

- 摩斯密碼、旗號、朱高密碼、點字、座標密碼及電話 T9
- 凱撒位移、反射、倒序及 NATO 音標
- 倉頡、速成、普通話拼音及廣東話粵拼
- 即時轉換、對照表高亮、結果複製、摩斯音訊
- 自動保留未完成訊息草稿

### 2. 試卷生成

- 將工具中的訊息加入題庫
- 每題可選密碼類型及整條／輪播／聲音模式
- 投影播放及 A4 列印
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

訓練模式由 `code_game` 的 Canvas 遊戲整合及改造；遊戲中的旗號會用 Canvas 即時繪畫，毋須預載 26 張圖片，減少手機流量。

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
├── images/                 # 旗號及參考圖片
├── scripts/check-static.mjs
├── vite.config.ts          # 主頁 + training 多頁建置
└── vercel.json
```

## 部署

專案可直接作為靜態網站部署；目前 `vercel.json` 設為直接輸出專案根目錄。也可執行 `npm run build`，再部署 `dist/`。

## 瀏覽器資料

以下資料只會保存在成員自己的瀏覽器：

- `skw_message_draft`：編碼草稿
- `skw_test_questions`：試卷題目
- `skw_cipher_training_settings`：遊戲設定
- `skw_cipher_training_progress`：訓練紀錄

清除瀏覽器網站資料會一併移除以上紀錄。

## 授權

本專案沿用原專案的 MIT 授權聲明，可自由使用、修改及分發。
