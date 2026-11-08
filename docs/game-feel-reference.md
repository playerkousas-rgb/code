# 遊戲模式參考資料檢視：`playerkousas-rgb/readme`

> 檢視日期：2026-11-08 · 來源 repo：`https://github.com/playerkousas-rgb/readme.git`（clone 到本機唯讀檢視）
> 目的：搵「令密碼防衛戰更迫真好玩、更方便手機玩、更像一個遊戲、更有動感」嘅可用參考。
> 本檔只記錄**讀到嘅嘢**同**點用**；冇複製上游內容，冇安裝任何工具。

---

## 0. 一句結論（要先講清楚）

**呢個 repo 唔係遊戲設計庫。** 佢係一套 SCOUT SYSTEM 嘅交付規則／起手包／工具核實紀錄（S 瘦身、F 防呆、A 安全、W 版權、V 版號、G 圖標、L 雙語、P 分類、C Canvas）。入面**冇**遊戲手感（game feel / juice）、粒子系統、hit-stop、haptic、觸控人體工學、手機遊戲 UX 嘅參考資料。

佢對呢次問題嘅價值係：**「可以點加動感而唔違規」嘅施工紅線 + 幾條可以借玩法方向嘅相近產品**，而唔係「教你點設計一個好玩嘅遊戲」。要補遊戲手感，要另外揀遊戲設計來源（見 §5）。

---

## 1. 直接可用嘅參考（附檔名＋規則 ID）

| 來源檔 | 入面講乜 | 對我哋遊戲嘅用法 |
|---|---|---|
| `templates/repo-starter/skills/promoted/web-motion/SKILL.md` | **靜態 HTML／Canvas 線**用 GSAP／CSS（GSAP 經 CDN 引入係容許嘅）；需求要用編號／術語而唔係「有質感啲」；只郁 `transform`／`opacity`；**60fps**、**390/768/1440**、**`prefers-reduced-motion` 要有 static fallback**；單一 HTML 守 ≤5MB、上游來源寫入 `CREDITS.md` | 加動感時嘅驗收合約。我哋個遊戲係 Canvas 單頁，屬呢條線；但**冇必要為幾個粒子加 CDN 依賴**，用自家 `requestAnimationFrame` 就夠，效果亦全部只郁 transform／opacity／Canvas 繪圖 |
| `templates/repo-starter/skills/external/motion-prompt/SKILL.md` | Motion Prompt 192 個編號（MIT），「畀用戶睇 gallery 揀」優先；**唔准自己作編號** | 只適用於「要揀一段入場／過場動畫」。我哋未開過 CLI／gallery（出站限制），所以**本輪冇用任何編號**，唔好扮用咗 |
| `templates/repo-starter/skills/promoted/design-review/SKILL.md` + `templates/repo-starter/docs/design-review.md` | 三寬度望圖 390／768／1440、`ROUND n` 紀錄、**冇 browser screenshot 就要老實講做唔到**、改次序 idea→hierarchy→…→motion | 手機驗收清單；亦係「唔好自稱測過 60fps／手感」嘅依據 |
| `docs/23-design-resources.md` | Design Token（單一真理）、WebAIM 對比 ≥4.5:1、Lucide／Iconify inline SVG、3dicons.co CC0 裝飾、8 個 UI 畫廊、W8 要標來源 | 若之後要幫遊戲加圖標／3D 裝飾／配色，先寫 `DESIGN.md` token；**3dicons 唔准做 favicon**（G11） |
| `docs/24-similar-products.md` | 相近產品：**Kahoot!**（多人問答）、**skribbl.io**（猜畫）、**Animated Knots**（逐步繩結動畫）、**dCode**（密碼編解碼） | 唯一一處有「遊戲／學習玩法」方向：可以借 **Kahoot 嘅即時回饋／連勝節奏**、**Animated Knots 嘅逐步拆解動畫**去講我哋嘅答錯解說 |
| `docs/33-icon-standard.md`（G11） | 9 個站台圖標檔（PNG／ICO、maskable 66%、≤260KB）、favicon／manifest 掛法 | 「更像一個遊戲」嘅捷徑：可安裝 PWA、加到主畫面、全螢幕啟動。**我哋而家只有 `public/favicon.svg`，未合 G11** |
| `docs/12-copyright-scout-system.md`（W1／W8） | 交付檔要有 `<meta name="copyright" content="© SCOUT SYSTEM">`＋可見頁尾＋README；第三方素材寫 `CREDITS.md` | 本輪已補 `meta` 同 `CREDITS.md`（見下） |
| `docs/44-bilingual-ui.md`（L1–L6） | 右上角一鍵切換、顯示目標語言、`data-lang`＋`lang`＋`localStorage` try/catch、預設中文、**螢幕單一語言乾淨分離**、範本 `templates/i18n/lang_toggle_v1.0.js` | 對應上一輪做嘅雙語：我哋嘅實作符合 L2／L3／L5；L4 例外係版權列中英對照（紙本／品牌字串，可保留） |
| `docs/01-slim.md`（S1 `api/` 零 runtime 依賴／S7）、`docs/09-gemini-canvas.md`（C13-g）、`docs/02-foolproof.md`（F） | 唔好用唔到嘅 dependency；單一 HTML ≤5MB；`localStorage` 要 try/catch；狀態要可恢復 | 所有新效果都保持**零新增依賴、純 Canvas／CSS／Web Audio**；設定讀寫補咗 try/catch |

> 上游自己嘅限制要照抄落我哋判斷：`docs/35`／`38`／`39` 講明「大部分工具**未實跑、未開站核實**」，Remotion 有授權陷阱、Scrolltide 其實收費、MiroFish 模擬唔係用戶證據。**所以唔好因為佢提過就當可以用。**

---

## 2. 我哋個遊戲而家已有乜（先盤點，唔好重做）

`training/index.html` 已經有，唔係由零開始：

- Canvas 引擎：Matrix code rain、透視格線／防火牆、5 款敵人（skull／virus／bug／invader／lightning）、旋轉／wobble／呼吸脈動
- Juice：粒子＋拖尾、combo 浮字、螢幕震動 `shakeAmount`、全屏 flash、受傷紅色 vignette
- 音效：Web Audio 合成（neutralize／damage／wrong／combo／stage clear／win／game over）
- 手機：A–Z 畫面鍵盤、鎖原生鍵盤、`touch-action: manipulation`、safe-area、`pointer: coarse` 排版、`navigator.vibrate`
- 遊戲化：3 條路線、連擊倍率、弱項字母加權、里程碑、成就、週月排行、歷史折線

**即係「有動感」嘅底已存在**，欠嘅係清晰度、手機公平性、節奏停頓同沉浸感，唔係再加一堆發光。

---

## 3. 對照後嘅缺口（本輪揀咗邊啲做）

| 缺口 | 影響 | 本輪 |
|---|---|---|
| Canvas 用 `innerWidth/Height` 做像素，**冇 devicePixelRatio** | Retina 手機上摩斯點劃／豬高符號矇，直接害辨讀 | ✅ DPR 縮放（上限 2×，控制效能） |
| 轉 App／熄屏返嚟，game loop 繼續行 → 無故扣血 | 手機最常見嘅「唔公平」 | ✅ `visibilitychange` 自動暫停＋繼續掣 |
| `prefers-reduced-motion` 只關 CSS，Canvas 照郁 | 撞 `web-motion` 紅線 | ✅ 新增「動感效果」設定，預設跟系統；關掉粒子／震動／閃光／code rain 更新 |
| 答中之後冇「停頓」，連擊冇累進感 | 唔夠「game feel」 | ✅ hit-stop 70ms、分數 count-up、combo 能量條、敵人逼近防火牆嘅危險脈動 |
| 始終係「一個網頁」，唔似一隻 game | 沉浸感 | ✅ 全螢幕＋螢幕常亮（Wake Lock）掣、橫向提示、touch 延遲／誤觸整理 |
| 缺 W1 版權 meta、缺來源紀錄 | 交付規則 | ✅ 三頁補 `<meta name="copyright">`、新增 `CREDITS.md` |

### 冇做（刻意，講明原因）

- **唔引入 GSAP／Three.js／framer-motion**：`web-motion` 容許 Canvas 線用 GSAP CDN，但只係俾「要揀現成動畫」時用，唔係硬性要裝；我哋要嘅效果（停頓、粒子、能量條）用現有 `requestAnimationFrame` 就寫到，唔值得加一個 CDN 依賴同額外體積。
- **唔用 Motion Prompt 編號**：CLI／gallery 未實跑，上游規則講明唔准作編號；本輪全部效果係自家 Canvas 時間軸，唔冒認。
- **唔做 3D／MP4／logo intro**：`docs/35` 嗰條線係「出片」，同即時遊戲無關；Remotion 授權未核實。
- **未做 G11 九個 PNG 圖標／完整 PWA manifest**：要出圖＋逐平台真機驗收，屬下一輪；現階段只做全螢幕，唔假的「已安裝到主畫面」。
- **未做 390／768／1440 實圖望圖、未量 60fps**：呢個環境冇瀏覽器截圖，`design-review` 要求老實註明 N/A，唔自稱驗收咗。

---

## 4. 下一輪可以揀（要你揀方向，我唔自己加）

> 後記：用戶之後提供咗第二個參考 `https://app.astra-ai.co/lab`（好多有趣小遊戲）。佢補到呢個 repo 欠嘅「遊戲化結構」，當中**每日任務／Stars／3 步教法／答中解碼揭示**已喺下一輪落實，詳見 [`docs/astra-lab-reference.md`](astra-lab-reference.md)。以下 1–5 項仍未做。

1. **玩法更像遊戲**：Boss wave（每 15 題一隻要拆解 3 個符號嘅大敵）、道具（凍結／双倍分／補盾）、限時連擊挑戰、每日任務。
2. **Kahoot 式節奏**：答中即時排名條、連勝 fanfare、3–2–1 開局倒數；參考 `docs/24` 嘅 Kahoot 方向。
3. **Animated Knots 式拆解**：答錯時逐筆畫出摩斯／旗號／豬高符號嘅動畫，而唔係一次過顯示答案。
4. **完整 PWA**：照 `docs/33` 出齊 9 個 PNG／ICO＋manifest，加到主畫面後全螢幕啟動、離線可玩（service worker 而家只覆蓋 `/papers/`）。
5. **設計語言**：照 `docs/23` 寫一份 `DESIGN.md`＋`tokens.css`，統一霓虹色／字階／對比，順便用 WebAIM 驗 AA。

---

## 5. 老實聲明

- 只讀咗 `readme` repo 嘅 Markdown／SKILL／範本檔，**冇 clone 佢提到嘅其他 89 個 repo、冇開過任何外部站、冇安裝任何工具**。
- 上面「可用／唔可用」係按佢自己寫嘅規則同「未核實」標註去判，唔係實測結果。
- 遊戲手感（juice／hit-stop／haptic）**唔係嚟自呢個 repo**；係一般遊戲設計做法，本檔只係記錄「加咗之後點樣唔撞佢嘅紅線」。
