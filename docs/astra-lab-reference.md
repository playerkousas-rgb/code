# 參考：Astra AI Lab 嘅「有趣」係結構，唔係 3D

> 檢視日期：2026-11-08 · 來源：<https://app.astra-ai.co/lab>
> 目的：為「密碼防衛戰」搵可借用嘅遊戲化／手機化做法。
> 本檔記錄**實際讀到嘅頁面內容**同**我哋嘅取捨**；冇複製任何圖片、程式碼或版面。

---

## 0. 一句結論

Astra Lab 係一個「學習用小 app」目錄：頁面上寫 **Mini games 30 / Simulations 40 / Tools 8**（共 78 個 app），有 Featured、Today's puzzles、Top picks（Most popular / Top rated）、New apps、Browse by subject。

佢啲遊戲好玩嘅原因**唔係畫面靚**，而係一套重複出現嘅結構：

> **固定每日一題 → 清楚進度／時間 → 短步驟教法 → 玩家先「預測」再「看結果」→ 星數／連續日／章節解鎖**

呢啲全部可以喺我哋現有嘅單一 HTML + Canvas 入面做到，唔使加 dependency、唔使 3D、唔使伺服器。

---

## 1. 實際讀到嘅頁面同玩法

| 頁面 | 頁面上的字句／資料 | 可借嘅結構 |
|---|---|---|
| `/lab` | "Today's puzzles **+20 Stars each**"；"**220 Stars waiting**"；"Sign up free to keep every Star you earn and put your times on the **leaderboards**"；Score board 列出 YURY 844、Yu 977、Xeroa 809 | 每日固定題目、星數貨幣、成績榜、每日返嚟嘅理由 |
| `/en-US/lab/library?kinds=game` | 30 個 mini games。例：**Mental Math**「Times tables practice that **remembers what you know**」、**Irregular Verbs**「Type the forms, **race the clock**, learn the patterns」、**Circuit Builder**「**Brighter, same, dimmer or off? Call it before the current flows**」、**Logic Gates**「as few moves as you can」、**Marbleslides**「Type an equation, hit launch, **watch the marbles slide into the stars**」 | 一個核心機制＋幾種模式、自適應弱項、**先預測後揭示**、限時、最少步數 |
| `/lab/numble` | "Solve the **daily equation in six guesses**"；"Daily puzzle **Nov 8** · **1/6** · **Time: 0.0s**"；"How it works" 3 步、"Ask the tutor"、"Rate"、"Leaderboard" | 固定次數、進度 `1/6`、計時、短教法 |
| `/lab/circuit-logic` | "**Daily / Levels / Sandbox**"；"**Moves 0 · Minimum 3**"；"Daily puzzle Nov 8 · 2/4 · Time: 0.0s"；"How it works · 1 / 3 · Next" | 三種模式、目標步數（par）、逐步 onboarding |
| `/lab/irregular-verbs` | "**Daily 10 / Sprint / Practice / Patterns**"；"Ten verbs, **three tries each**. **Everyone gets the same ten today**"；"Level A1"；"Verb 1 of 10" | 同一日人人同一組題、分級、多次嘗試、模式切換 |
| `/lab/mental-math` | "First, let's see what you already know — **about two minutes, with no clock**. It finds the facts you already know so practice starts in the right place." | 無壓力嘅前置評量、自適應起點 |
| `/lab/coord-defense` | "**Chapter 1 · 0/15 · First quadrant**"；"Daily / Defense"；"Build at (−3, 4), read the camps, **hold the keep**" | 章節地圖、解鎖進度、故事包裝（最接近我哋嘅塔防） |
| `/lab/escape-room` | "**Chapter 1 Home 0/9**"；Room 1 "Aunt May's Kitchen" · "**About 10 min · Puzzles: 5**"；後面房間寫 "Escape … first"；"Tap anything that glints to look closer" | 關卡命名＋預計時間＋鎖關、觸控「點嚟睇清楚」 |
| `/lab/word-of-the-day` | "**One** English word a day" → "**Three quick questions**" → "Lock it in" | 極小份量、即刻鞏固 |
| `/lab/virtual-lab` | "Tap an element to drop it… **Reactions only start once the metal touches water**"；Help 內逐點解釋 | 因果即時可見、內嵌說明 |

### 歸納出 8 個可轉移嘅模式

1. **Daily fixed seed**：同一日一組固定題，人人（本機）一樣 → 有得比較、有得返嚟。
2. **Stars / streak**：完成 +20 ★、連續日數 → 長期動機。
3. **Progress + timer 常駐**：`1/6`、`0/15`、`Time: 0.0s`、`Verb 1 of 10` → 永遠知自己喺邊。
4. **多模式**：Daily / Levels / Sandbox、Daily 10 / Sprint / Practice / Patterns → 同一機制唔悶。
5. **先預測、後揭示**："Call it before the current flows"、Marbleslides 按發射先睇結果 → 答完先播因果動畫，動感有「意義」而唔係裝飾。
6. **3 步 "How it works"**：每個 app 都有一個極短、可略過、有 Next 嘅教法層。
7. **章節／解鎖 + 預計時間**：Chapter、0/9、"About 10 min · Puzzles: 5"、逐關解鎖。
8. **自適應弱項**：Mental Math「記得你識乜」；我哋已有 `weak` 字母加權，係同一思路。

---

## 2. 對照我哋個遊戲（改之前）

我哋已有：連擊倍率、弱項字母加權、里程碑／成就／週月排行、3 條路線、粒子／震動／音效、A–Z 手機鍵盤、**上一輪**加咗 Retina 清晰度、自動暫停、hit-stop、combo 能量條、危險警告、全螢幕。

**欠嘅就係上面 1–6**：冇每日固定題、冇星／連續日、冇三步教法、答中冇「解碼揭示」、進度只有分數而冇「第幾題／用咗幾耐」。

---

## 3. 本輪落實（Astra 模式 1、3、5、6）

| Astra 模式 | 我哋嘅實作 |
|---|---|
| Daily fixed seed + Stars | 新增 **今日任務**：`skw-cipher-daily-v2:<YYYY-MM-DD>` 做 seed（FNV-1a + mulberry32），**3 關 × 每關 1 種密碼 × 3 題**；完成 +20 ★、連續日數、最佳時間，全部存 `localStorage`（try/catch） |
| Progress + timer | `#daily-hud` 顯示 `📅 LV1/3 · 2/9 · ⏱ 0:42`；HUD 顯示 `DAILY · LV1/3 · 2/9` |
| 一定要完成得 | 每日屬**練習**唔係挑戰：唔扣血、唔限時、一次只出一題、漏答嘅題會返轉頭；每關有「📖 對照表」用 `drawCipherSymbol` 畫出該關 3 個字母嘅符號，唔識都可以對住搵 |
| 先預測後揭示 | 答中後 `#decode-reveal` 逐個 element 播出 `8-3 → V`／`.- → A`，只郁 `transform`／`opacity`，`effectsEnabled` 關掉就唔播 |
| 3 步 How it works | `#coach-overlay`：睇符號 → 輸入答案 → 連擊同弱項；`1/3`、Next／略過、首次自動出現、`？玩法` 可重開 |
| 誠實標示 | 卡片寫明「**本機紀錄 · 題目按日期固定，同一日重玩都係同一組題**」，唔扮全球榜 |

### 用戶修正（重要，已跟）

> 「你啲每日任務太難了，同時混幾種密碼一定完成不了的，可以分幾關每關 1 種。這是每日任務，是希望用戶能完成的，不是挑戰。」

第一版曾經用 **5 題混合 6 種密碼 + 3 格血**，呢個判斷錯咗：每日任務嘅目的係返嚟練習、要有完成感，唔係考驗。已改做：

- 3 關、每關**一種**密碼（日期洗牌揀 3 種），每關 3 個唔重複字母
- **唔扣血**（`lives = 9999`，漏答只係將題放回 queue）、**唔限時**、敵人速度降到 0.45×、**一次只出一題**
- 每關自動彈「📖 對照表」，直接畫出該關 3 個字母嘅符號；漏答亦會自動彈出
- 過關有 `✓ LV1 → LV2 · 點字` 提示，清楚知自己換緊邊種密碼
- 順手修咗既有 bug：`drawGrid` 兩個同名函式互相覆蓋，令「座標密碼」符號畫唔到；透視地板改名 `drawFloorGrid()`

同時補：W1 `<meta name="copyright">`（上一輪已做）、W8 來源列入 `CREDITS.md`、中英字典補齊新字串、`UI_REVIEW.md` 註明未做的視覺驗收。

---

## 4. 刻意唔抄（重要）

| Astra 有 | 我哋唔做 | 原因 |
|---|---|---|
| 全球 Leaderboard、Score board 有其他人名字／國旗／分數 | ❌ | 我哋冇伺服器，**造假數據**直接撞 `readme` repo 嘅 Scout Clean「no fake data」同 design-review 原則。改做本機最高分／連續日 |
| "Ask the tutor"（AI 導師） | ❌ | 冇 backend／LLM，唔扮有 AI。我哋用現有靜態「提示／符號拆解」 |
| 3D 人體、太陽系、火箭、逐關封面圖 | ❌ | `docs/33` G11 同 ≤5MB 限制；我哋保持 Canvas 即時繪圖、零圖片依賴 |
| 直接搬佢嘅版面／遊戲規則／品牌 | ❌ | W8：畫廊同產品只作靈感與詞彙，唔抄排版；只借「結構」 |
| 登入先保存到 Stars | ❌ | 我哋係離線童軍工具，唔應該逼隊員開 account |

> 另外，Astra 有 40 個 simulations／8 個 tools 唔係遊戲；佢哋嘅 3D／模擬線同我哋嘅「反射式密碼訓練」唔同，唔好混為一談。

---

## 5. 下一輪可以揀（未做）

1. **章節地圖**（模式 7）：`第一章 · 摩斯 0/5`、`第二章 · 旗號`（要通關先解鎖），每章標「約 2 分鐘 · 5 題」。
2. **多模式**（模式 4）：加 `自由練習 Sandbox`（冇血／冇時限，點符號即睇拆解）同 `Sprint`（60 秒衝分）。
3. **前置評量**（模式 8）：學 Mental Math「約兩分鐘、唔計時」先測 6 題，決定起點難度。
4. **Par／最少步數**（Logic Gates `Moves 0 / Minimum 3`）：顯示「本關最佳連擊／最少失誤」。
5. **觸控「點嚟睇清楚」**（Escape Room）：撳敵人放大符號＋逐步拆解，特別啱手機。

---

## 6. 老實聲明

- 只讀咗公開頁面嘅文字內容（`/lab`、game library、8 個遊戲詳情頁、搜尋結果摘要），**冇登入、冇實際玩、冇下載任何素材、冇抄任何程式碼**。
- 遊戲入面嘅動畫幀率、觸感、載入時間**冇實機量過**；呢個環境只有 JSDOM／HTTP／建置檢查。
- 上面「30 games / 40 simulations / 8 tools」、「+20 Stars each」、各頁字句係檢視當日頁面顯示嘅內容，之後可能改。
