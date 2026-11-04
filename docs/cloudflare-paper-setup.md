# 電子試卷：本機部署 Cloudflare 指南

此功能採用與 HM20C 類似的 **Vercel 領袖驗證 + Cloudflare Worker + D1** 架構，但使用獨立 Worker 和 D1，不應指向或覆蓋 HM20C 的資源。以下步驟要由 Cloudflare／Vercel 專案管理員在自己的電腦操作。此程式的本機自動測試和 Worker dry-run 已通過，**真正的 Cloudflare 帳戶、Vercel 環境、手機掃碼及離線重開仍需按本指南實測**。

## 先了解

- 有網絡登入領袖模式後可建立本機題組；憑證只在目前分頁記憶體，最多 24 小時。重新整理或關閉須重新登入。需要活動服務時，只有領袖手動建立／同步／公布／延長／查詢版本／結束才寫入或驗證。
- 成員掃活動 QR 只會填入活動 ID；必須按「更新題目及答案」才向 Worker 讀取。沒有輪詢、定時更新或自動重連。頁面資源及設定讀取、QR 掃描、CORS 預檢和背景到期清理仍會產生各自的資源用量。
- 固定題目和答案可下載 JSON，較短資料亦可產生 QR。題目 QR 只包含題目欄位；答案 QR 要先有相同版本的題目。太長時需用 JSON，QR 也要實際測試可掃讀。兩者不需 D1，但網頁及領袖登入仍需先準備好。
- 連網請求上限為 32 KB；題目很多或很長時需縮短或拆成多套。
- D1 保存未公布答案，資料庫管理員可讀到；持有活動連結的人可讀取題目及已公布答案。密碼題可以自行解碼、符號資料也可逆向辨認，登入只限制管理操作，**不是防作弊或保密系統**。切勿存放敏感個人資料。
- 領袖登入的嘗試次數限制只在個別 Vercel 函數實例盡力生效，並非跨實例的完整防暴力破解；請用長而獨特的密碼，並按需要配置服務商防護。
- Workers Free、D1 和 Vercel 都有額度及各自服務條款；超額、停機或網絡故障時可能無法使用。請在各家後台確認現行額度、付費設定及其他 App 共用的用量；不保證永久免費。

## 本機指令版速覽

可以像 HM20C 一樣在自己的電腦用指令完成；以下以全新、獨立的 Worker／D1 為例，請先看下方詳細步驟。**本次修改若尚未推送，原有本機 clone 不會自動包含它**；先確保你的本機資料夾包含這次程式碼。不要在 HM20C 的資料夾或設定檔執行。

```sh
# 在本專案資料夾，Node.js 22
npm ci
npm test
npx wrangler login
npx wrangler whoami
npx wrangler d1 list
```

核對帳戶、D1 清單，以及 Cloudflare 上沒有同名 Worker 後，建立新的資料庫：

```sh
npx wrangler d1 create scout-cipher-practices
```

複製 `wrangler.toml.example` 成 `wrangler.toml`（macOS/Linux 用 `cp wrangler.toml.example wrangler.toml`；Windows PowerShell 用 `Copy-Item wrangler.toml.example wrangler.toml`），再以文字編輯器填入新資料庫 ID、未使用的 Worker 名稱、正式網站 `ALLOWED_ORIGINS` 和 `LEADER_VERIFY_URL`。然後：

```sh
# 資料庫名稱若改過，請同步修改此命令
npx wrangler d1 execute scout-cipher-practices --remote --file=cloudflare/schema.sql
npx wrangler deploy --dry-run
# 確認帳戶、Worker 名稱及 D1 正確才執行以下兩行
npx wrangler deploy
npx wrangler secret put LEADER_SESSION_SECRET
```

最後一行會互動要求輸入獨立隨機秘密；請自行保管，不要打在指令參數或聊天中。部署輸出的 Worker 網址加上 `/api/activity`，就是稍後設定的公開 `ACTIVITY_API_URL`。

Vercel 亦可用 CLI，不必一定使用網頁。以下命令會互動登入、選擇既有專案並輸入值，**不需在指令列寫入秘密**：

```sh
npx vercel login
npx vercel link
# 請先確認已連結本專案的正確 Vercel 專案及帳戶
npx vercel env add LEADER_PASSWORD --environment production --sensitive
npx vercel env add LEADER_SESSION_SECRET --environment production --sensitive
npx vercel env add ACTIVITY_API_URL --environment production --no-sensitive
npx vercel deploy --prod
```

第二個秘密需與剛才 `wrangler secret put` 的值**完全相同**；`ACTIVITY_API_URL` 則是 Worker 公開網址。上述 `env add` 是首次新增；若變數已存在，不要盲目重複建立，先核對專案與 Production 環境。換密碼時可在確認目標專案後使用 `npx vercel env add LEADER_PASSWORD --environment production --sensitive --force`，按提示輸入新值，然後 `npx vercel deploy --prod`。`--force` 會覆蓋該環境的既有值。請勿使用 `--value`、貼入 shell 指令或把秘密發到聊天。

`vercel deploy --prod` 會將**目前這個資料夾的程式碼**部署到所連結專案的 Production；執行前務必核對專案和內容。舊 deployment 網址及已下載資料不會因此自動消失。完成後仍要按下方清單用兩部手機測試；不要把未驗收的活動直接用於正式考核。

## 1. 準備你的電腦

1. 安裝 **Node.js 22**（測試使用 Node 22 的 `node:sqlite`），用終端機進入此專案的資料夾。須包含 `cloudflare/worker.js`、`cloudflare/schema.sql` 和 `wrangler.toml.example`。
2. 安裝專案工具並執行檢查：

   ```sh
   npm ci
   npm test
   npm run check
   npm run build
   ```

   測試的 SQLite 實驗性提示不是實際雲端驗證。編譯提示外部／非 module 腳本無法 bundle 屬現有引用方式；應確認建置結果及部署後實際載入。
3. 確保**包含這次程式碼**的網站已部署到你自己的 Vercel Production 專案，取得固定的正式 HTTPS 網址（例如 `https://your-site.example`；以下例子均須改成自己的網址）。不要用 localhost、預覽或某一次部署的獨立網址。本站維持專案根目錄輸出；Vercel 必須同時部署 `api/leader.js`、`api/leader-verify.js` 和 `api/config.js`，不能只上傳 `dist/`。
4. 登入自己的 Cloudflare 帳戶，確認使用 Workers Free 並核對是否啟用付費服務。終端執行：

   ```sh
   npx wrangler login
   npx wrangler whoami
   ```

   按瀏覽器提示登入及授權，核對所顯示帳戶；不需要把密碼、token 或授權資訊發到聊天。

## 2. 建立獨立 D1 與 Worker

1. 在 Cloudflare Workers & Pages 檢查現有 Worker 名稱，選一個**未被使用**的名稱。`wrangler deploy` 會更新同名 Worker，不要覆蓋 HM20C 或其他 App。
2. 建立一個新 D1（名稱可自行更改，以下名稱是假設的例子）：

   ```sh
   npx wrangler d1 create scout-cipher-practices
   ```

   記下命令顯示的 `database_id`。建立前先確認帳戶和名稱；不要重建現有資料庫。
3. 複製設定範本：

   ```sh
   cp wrangler.toml.example wrangler.toml
   ```

   Windows PowerShell 可用 `Copy-Item wrangler.toml.example wrangler.toml`。以文字編輯器修改 `wrangler.toml`：
   - `name`：你剛核對過的**未使用 Worker 名稱**。
   - `database_name`：剛建立的 D1 名稱；`database_id`：剛記下的 ID。
   - `ALLOWED_ORIGINS`：固定的正式網站 HTTPS origin，例如 `https://your-site.example`，不要路徑或尾隨 `/`。多個受信任網站可用逗號分隔；本機開發如有需要，可明確加上 `http://localhost:5173`。CORS 不是存取控制。
   - `LEADER_VERIFY_URL`：同一固定正式網站加 `/api/leader-verify`，例如 `https://your-site.example/api/leader-verify`。Worker 每次領袖操作都會向此**固定 Production** 驗證；不要填舊部署網址或不受控制的網址。
   - `[triggers]` 每小時盡力清理過期活動；到期讀寫會即時拒絕，但超額或故障可延遲實際清理。`wrangler.toml` 已加入 `.gitignore`，不要把秘密放入此檔。
4. 只針對**剛建立的空白 D1** 初始化表格；若資料庫名稱不同，請相應修改命令：

   ```sh
   npx wrangler d1 execute scout-cipher-practices --remote --file=cloudflare/schema.sql
   npx wrangler deploy --dry-run
   ```

   檢查 dry-run 的 Worker 名稱、帳戶、D1 binding 及 ID，確定沒有指向 HM20C。不要在尚未核對時執行部署。
5. 確認後部署並設定秘密：

   ```sh
   npx wrangler deploy
   npx wrangler secret put LEADER_SESSION_SECRET
   ```

   `deploy` 會顯示 Worker 的 `https://...workers.dev` 網址。秘密值要使用**獨立、高隨機性**的值，可在自己的電腦執行以下指令產生，安全保存，並在 Wrangler 提示時輸入；不要貼到聊天或 Git。此秘密不是領袖密碼，不應發給領袖或成員。

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

   先部署未設定秘密的 Worker 會拒絕領袖寫入。`secret put` 更新的是目前設定檔指定的 Worker；按提示輸入，不要把秘密寫進命令參數或設定檔。記下 Worker 網址，下一步要加上 `/api/activity`。

## 3. 在 Vercel 設定領袖驗證

在 Vercel 專案 **Settings → Environment Variables**，為 **Production** 設定：

| 名稱 | 值 |
| --- | --- |
| `LEADER_PASSWORD` | 你自行選擇的長、獨特的領袖密碼，沒有預設值。 |
| `LEADER_SESSION_SECRET` | 第 2 節設定在此 Worker 的**相同**隨機秘密；不得與領袖密碼相同。 |
| `ACTIVITY_API_URL` | Worker HTTPS 網址加 `/api/activity`，例如 `https://your-worker.your-subdomain.workers.dev/api/activity`。這是公開網址，**不是秘密**。 |

儲存後**重新部署 Production**，因為修改環境變數不會更新既有部署。不要把任何秘密放在 `VITE_` 變數或前端檔案。網站 `/api/config` 僅回傳公開的活動網址；若未設定或網址不是 HTTPS `/api/activity`，連網功能會提示未設定。

**日後換領袖密碼**：只需在 Vercel Production 更改 `LEADER_PASSWORD` 並重新部署；Worker 的固定驗證網址會使用新部署，舊憑證不能繼續寫入活動。`LEADER_SESSION_SECRET`、D1、Worker 和活動 QR 不需因一般換密碼而改動。已開啟頁面可能仍顯示本機資料至 24 小時或重新載入；舊 Vercel 部署網址亦可能仍使用舊密碼。可在 Vercel 檢查舊／預覽部署保護設定，並在無痕模式確認正式網址仍供成員使用。

如服務秘密洩漏或需要輪換，須同時在 Vercel 和此 Worker 更新 `LEADER_SESSION_SECRET`，重新部署並通知領袖重新登入；不要只更改其中一邊。

## 4. 兩部裝置實測

1. 正式網站選「電子試卷 → 領袖工作區」，用新密碼登入，新增題組並儲存。可由現有試卷匯入，但電子試卷固定用 SCOUT 座標及凱撒位移 3，投影速度、聲音與輪播不會匯入。
2. 用「題目 QR／檔案」分享固定試卷；另一部手機掃 QR 或選 JSON，輸入答案，下載作答檔傳回領袖，領袖選「查看成員作答檔」人工批閱。另分享同版本答案並核對。符號題以文字或描述作答，目前沒有手繪／圖片交卷或自動評分。
3. 領袖建立有效期內的連網活動，立即下載**私人備份**保存活動管理鑰匙。分享活動 QR；成員掃碼後按「更新題目及答案」。從另一題組建立第二個活動，確認兩個活動互不影響。
4. 領袖編輯題組後按「同步題目」（同步後清除已公布答案），成員不按更新時應仍看到舊版；按更新後取得新版本，改版時會提示先下載舊作答。再公布答案，成員按更新才看到。成員端不應出現定時連網更新。
5. 測試更換密碼及重新部署後，舊登入無法修改活動；另測結束／到期、錯誤管理鑰匙、版本衝突、無網絡及 CORS 不匹配。若另一裝置只修改了公布狀態，可按「重新取得活動版本」；若題組內容不同則不會自動覆蓋，應使用最後同步的領袖裝置及備份處理。過期活動可先備份並按「解除本機活動連結」，再建立新活動；解除不會結束尚未到期的雲端活動。
6. 需離線使用固定試卷時，先用**同一部手機及同一瀏覽器**以 HTTPS 開啟正式 `/papers/`，待程式快取，再開飛航模式重新開啟並實際匯入檔案／作答。瀏覽器可能清除快取或儲存，不能保證離線永久可用。首次領袖登入、連網活動更新仍需網絡。

## 資料及故障注意

- 題組、活動管理鑰匙、成員作答存在各自瀏覽器，換裝置、清除資料、私人模式或儲存空間不足均可能遺失。每套題組須自行下載私人備份；備份含明文答案與管理鑰匙，只可由領袖保存。還原同 ID 題組會提示確認，請先備份現有版本。
- 同一題組在另一個分頁更改時，本機保存會拒絕覆蓋；雲端也以版本和私有題組指紋防止靜默覆蓋。若雲端操作已成功而本機保存失敗，程式會嘗試下載私人恢復檔，請立即保存並核對；若網絡中斷發生於建立活動回應之前，活動可能已建立但管理鑰匙未能送達，該活動將在到期後清理。
- 成員只保存一套試卷。讀取另一套或新版本前會提醒先匯出作答；作答檔只由成員自行傳送，不會上傳 Cloudflare。固定答案包和本機題庫無法因換密碼被收回。
- 如看到「連網活動未設定」，先檢查 Vercel `ACTIVITY_API_URL` 及重新部署；403 請核對 `ALLOWED_ORIGINS`；寫入失敗請核對固定 `LEADER_VERIFY_URL` 和兩端相同的服務秘密。配額、網絡、Vercel 或 Cloudflare 故障亦可導致失敗。勿把秘密或個人資料貼到聊天室。
