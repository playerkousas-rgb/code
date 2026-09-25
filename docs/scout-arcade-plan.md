# 童軍技能網上小遊戲平台 · 計劃書

> 目標：一個靜態網頁 App，成員用手機玩一個個小遊戲嚟學習／重溫童軍技能。
> **每個遊戲對應一種技能**，之後可以逐個加。
> Supabase 只負責一件事：**記低分數、日期、人名，用嚟排名**。

---

## 一、核心原則（決定晒之後慳幾多功夫）

1. **Supabase 唔理你點計分。**
   佢淨係知「邊個 · 玩邊隻遊戲 · 幾多分 · 幾時」。
   每隻遊戲可以自己發明計分方式（計時、計連擊、計星、計準確率），互不相干。
2. **所有遊戲共用一張表。**
   就係呢一點，令「加一隻遊戲 = 零後端改動」。
3. **後端只寫一次。**
   開頭做好一張表 + 一個 view + 兩句 Realtime 設定，之後一世唔使再掂。

---

## 二、技術選擇（建議）

| 項目 | 建議 | 點解 |
|---|---|---|
| 前端 | 純 HTML + JS（可選 Vite） | 靜態檔，Vercel / Netlify / GitHub Pages 免費 hosting |
| 後端 | Supabase（免費版） | 只要一張表，唔使 server |
| 資料庫存取 | `@supabase/supabase-js`（CDN 或 npm） | 自動有 REST API，唔使寫後端程式 |
| 部署 | git push → 自動 deploy | 加遊戲都係同一個動作 |

> 想成員可以「加到主畫面」當 App 咁開，第日加個 `manifest.json` + service worker（PWA）就得，
> 露營冇信號時都可以玩（分數排隊，上到網先提交）。

---

## 三、資料結構（寫一次，之後唔使改）

```sql
-- 1) 成績總表：所有遊戲共用
create table runs (
  id         bigint generated always as identity primary key,
  game       text not null,                  -- 'knots' / 'compass' / 'quiz' …
  player     text not null,                  -- 稱號
  score      int  not null check (score >= 0 and score <= 10000000),
  client_id  text,                           -- 瀏覽器隨機 id，用嚟標示「你」
  meta       jsonb not null default '{}',    -- 遊戲自己嘅嘢（準確率、題數、用時…）
  created_at timestamptz not null default now()
);

create index runs_board_idx on runs (game, score desc);
create index runs_time_idx  on runs (created_at desc);
create index runs_client_idx on runs (client_id, created_at desc);

-- 2) 排行榜 view：每位玩家淨係計最好嗰局
create view leaderboard as
  select distinct on (game, player)
         game, player, score, meta, created_at
    from runs
   order by game, player, score desc, created_at asc;

-- 3) 權限：人人睇到，人人寫得（細規模夠用）
alter table runs enable row level security;
create policy "runs: public read"  on runs for select to anon using (true);
create policy "runs: insert only"  on runs for insert to anon with check (true);
-- 唔開 update / delete：防止有人改人哋成績
```

**加一隻新遊戲要做嘅 SQL：冇。** `game` 只係一個字串。

### 前端三句嘢（唔使寫任何 SQL 函式）

```js
// 交分
await supabase.from('runs').insert({
  game: 'compass', player: '阿明', score: 2400, client_id,
  meta: { hits: 18, total: 20, accuracy: 90, duration_ms: 62000 }
});

// 排行榜 Top 20
const { data } = await supabase.from('leaderboard')
  .select('*').eq('game', 'compass')
  .order('score', { ascending: false }).limit(20);

// 自己排第幾
const { count } = await supabase.from('leaderboard')
  .select('*', { count: 'exact', head: true })
  .eq('game', 'compass').gt('score', 2400);
const rank = (count ?? 0) + 1;
```

---

## 四、一次性 Supabase 設定 checklist

- [ ] 開 project（免費）
- [ ] SQL Editor 執行上面嘅 table + view + policy
- [ ] （可選）開 Realtime：`alter publication supabase_realtime add table runs;`
- [ ] 抄低 Project URL + anon key
- [ ] **之後每加一隻遊戲：以上全部唔使再掂**

---

## 五、前端架構（加遊戲只係加一個檔）

```
index.html              ← 大廳：遊戲卡 + 排行榜
js/games-registry.js    ← 遊戲清單（slug / 名 / icon / 排序）
js/games/compass.js     ← 遊戲 A
js/games/knots.js       ← 遊戲 B
js/games/quiz.js        ← 遊戲 C
js/shell.js             ← 共用外殼：HUD、結算、提交、排行榜
```

### 遊戲模組 contract（每隻遊戲淨係要实现呢個）

```js
window.ScoutGames = window.ScoutGames || {};

window.ScoutGames['compass'] = {
  title: '羅盤方位',
  icon: '🧭',
  modes: [{ id: 'point', label: '八方位' }, { id: 'bearing', label: '方位角' }],

  // ctx: { root, mode, finish(result), cloud }
  start(ctx) {
    // 自己畫 UI、自己計分
    // 完局嗌一次：
    ctx.finish({
      score: 2400,
      meta: { hits: 18, total: 20, accuracy: 90, duration_ms: 62000 }
    });
    return function stop() { /* 清理 timer / DOM */ };
  }
};
```

**HUD、結算畫面、稱號輸入、提交、排行榜、離線排隊，全部由 `shell.js` 包辦**，
所以一隻新遊戲嘅 code 可以好短（100–250 行）。

---

## 六、排行榜顯示：polling 為主，Realtime 錦上添花

| 做法 | 做法 | 適合 |
|---|---|---|
| **Polling** | `setInterval` 每 3–5 秒 query 一次 | 大屏幕、成員自己睇榜 —— **預設用呢個** |
| **Realtime** | DB 一有新紀錄，server 推畀訂閱緊嘅分頁 | 想零延遲、第日做多人對戰 |

> 建議：**得大屏幕訂閱 Realtime**（1 條連線），成員照用普通 HTTP 交分。
> 免費版 200 條同時連線嘅限額就永遠掂唔到。
> 加遊戲時 Realtime 都唔使改 —— 因為訂閱嘅係 `runs` 張表，唔係某個遊戲。

---

## 七、遊戲點子清單（可行性評估）

工作量：`⭐` 細（半日內） · `⭐⭐` 中（一至兩日） · `⭐⭐⭐` 大（要整素材）
素材：指係咪需要先整圖片／音效，定係純文字／程式產生就OK。

### 第一批 —— 純文字或程式產生，**唔使整任何素材**，最快手出到貨

| # | 遊戲 | 技能範疇 | 玩法 | 素材 | 工作量 |
|---|---|---|---|---|---|
| 1 | **知識快問快答** | 童軍知識、諾言規律、禮節、制服、歷史 | 選擇題 + 倒數，答得快有連擊加成 | 純文字 | ⭐ |
| 2 | **羅盤方位** | 地圖與羅盤 | 出方位角（如 225°）→ 揀八方位；或反過來 | 程式產生 + SVG 羅盤 | ⭐⭐ |
| 3 | **六位格網參考** | 地圖閱讀 | 顯示格網上一點 → 輸入／揀正確格網參考 | 程式產生 + SVG 格網 | ⭐⭐ |
| 4 | **Kim's Game 記憶大考驗** | 觀察與記憶（童軍經典） | 30 秒記住 15 件物件 → 限時內彈返出嚟 | emoji / 文字（可換圖） | ⭐ |
| 5 | **繩結用途配對** | 繩結 | 「接駁兩條粗幼唔同嘅繩用邊個結？」→ 揀答案 | 純文字 | ⭐ |
| 6 | **急救情境判斷** | 急救 | 情境題：「燒傷應該…」→ 揀正確處理 | 純文字 | ⭐ |
| 7 | **露營執袋** | 露營 | 20 件物資入面揀「一定要帶嘅 10 件」 | 純文字 | ⭐ |
| 8 | **估數字** | 觀察與估算 | 估距離／高度／重量／時間，愈接近愈高分 | 純文字（可加相） | ⭐ |

### 第二批 —— 需要少量圖／聲，但全部可以 SVG 或 Web Audio 自己產生

| # | 遊戲 | 技能範疇 | 玩法 | 素材 | 工作量 |
|---|---|---|---|---|---|
| 9 | **追蹤記號** | 追蹤 | 顯示記號 → 揀意思（前進／危險／回程／水源…） | SVG 手畫 12 個符號 | ⭐⭐ |
| 10 | **摩斯聽音** | 通訊 | 播聲 → 揀字母／單字 | Web Audio 產生，唔使錄音 | ⭐⭐ |
| 11 | **旗號速認** | 通訊 | 顯示旗號姿勢 → 揀字母 | SVG 姿勢圖 | ⭐⭐ |
| 12 | **求救訊號** | 安全 | SOS、鏡子反光、哨聲、地面訊號配對 | 文字 + 簡單圖 | ⭐ |
| 13 | **天氣與雲** | 觀察、自然 | 睇雲圖／天氣現象 → 判斷天氣變化 | SVG 雲圖 | ⭐⭐ |

### 第三批 —— 要影相／畫圖，遲啲先做

| # | 遊戲 | 技能範疇 | 玩法 | 素材 | 工作量 |
|---|---|---|---|---|---|
| 14 | **繩結圖認名** | 繩結 | 睇結嘅圖 → 揀名（平結、八字結、雙套結、稱人結…） | 8–10 張相／圖 | ⭐⭐⭐ |
| 15 | **紮作辨認** | 紮作工程 | 睇圖揀紮作名（方型紮作、斜撐、椅紮作…） | 需要相片 | ⭐⭐⭐ |
| 16 | **估距離（實景版）** | 觀察與估算 | 睇現場相估距離／樹高 | 需要實景相 | ⭐⭐ |
| 17 | **植物／動物辨認** | 自然 | 睇相認品種 | 需要相片 | ⭐⭐⭐ |

> 💡 **捷徑**：第 9–11 項（追蹤記號、摩斯、旗號）嘅繪圖邏輯，
> 可以直接由你而家 `playerkousas-rgb/code` 嗰個密碼平台搬過嚟 —— 摩斯、旗號、點字、朱高嘅
> Canvas 繪圖碼已經寫好，改改就可以用。

---

## 八、計分方式（Supabase 唔理，但你有個 default 會慳好多功夫）

雖然每隻遊戲可以自己計，但建議外殼提供一套共用嘅計分器，新遊戲直接揀一種：

| 類型 | 計分邏輯 | 適合遊戲 |
|---|---|---|
| **連擊制** | 每題 100 × min(連擊, 10) | 快問快答、羅盤、格網、摩斯 |
| **準確率制** | 答啱題數 × 100 + 時間獎勵 | Kim's Game、執袋 |
| **接近度制** | `max(0, 1000 − 誤差×系數)` | 估距離、估高度 |
| **生存制** | 每答啱 +1 命，答錯扣命，撐得耐分愈高 | 無限模式 |

外殼負責 combo、計時、結算；遊戲淨係話畀外殼知「呢題啱定錯、用咗幾耐」。

---

## 九、建議開發順序

```
第 1 週：一張 runs 表 + 大廳外殼 + 排行榜（用 polling）
         └── 先用「知識快問快答」做第一隻（純文字，最快驗證成條流程）

第 2 週：加「羅盤方位」+「Kim's Game」
         └── 驗證「加一隻遊戲係咪真係唔使掂後端」

第 3 週：加「追蹤記號」/「摩斯聽音」（搬現有 Canvas 繪圖碼）

之後：   按興趣／素材進度逐隻加；想現場氣氛就開 Realtime 大屏幕
```

**判斷標準**：如果加第 2 隻遊戲時，你完全冇打開過 Supabase，個設計就成功咗。

---

## 十、進階（全部可選，需要時先做）

| 功能 | 用途 | 幾時做 |
|---|---|---|
| **Realtime** | 大屏幕即時跳名次、多人對戰／搶答 | 想現場氣氛 |
| **PWA / Service Worker** | 加到主畫面、露營離線玩（分數排隊後補） | 經常戶外活動 |
| **Storage** | 放繩結圖、雲圖、實景相 | 做第二批遊戲 |
| **Auth** | 稱號實名、換機 keep 成績 | 想認真計排名 |
| **Edge Functions** | 每晚結算「本週龍虎榜」、自動封存上季 | 人多到要自動化 |

---

## 十一、常見坑

1. **免費版 7 日冇流量會暫停** —— 一個月先玩一次嘅話，次次要人手 resume（最實際嘅麻煩）。
2. **撞名** —— 稱號可以重複。內部玩無所謂；想嚴謹就第日加 Auth。
3. **冇防作弊** —— 成員可以改 console 自己報分。童軍內部通常OK；
   想輕微防就靠上面嘅 `check (score <= 10000000)` + 只准 insert 不准 update/delete。
4. **Realtime 要 SELECT policy 先收到嘢** —— 冇開就「點解冇反應」。
5. **Realtime channel 要 `removeChannel()`** —— 唔清理會慢慢食爆連線限額。
6. **Realtime 只推「變更」** —— 開畫面時要 query 一次攞現有榜。
7. **計分方式改咗之後**，新舊分數會混埋同一條榜 —— 想要乾淨就加個 `season` 欄位或者清一次表。

---

## 十二、下一步 checklist

- [ ] 定第一隻遊戲（建議：知識快問快答）
- [ ] 開 Supabase project，執行第三章段 SQL
- [ ] 起 `index.html` 大廳 + `js/shell.js` 外殼
- [ ] 寫第一隻遊戲，驗證「交分 → 上榜 → 顯示名次」全流程
- [ ] 寫第二隻遊戲，**全程唔好打開 Supabase** —— 做得到的話，個設計就啱咗
- [ ] 之後就係不停加遊戲，後端一世唔使理
