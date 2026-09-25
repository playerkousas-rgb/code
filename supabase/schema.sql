-- ============================================================================
-- Scout System 密碼平台 · 雲端題庫 + 排行榜（Supabase）
-- ----------------------------------------------------------------------------
-- 用法：Supabase Dashboard → 左邊 SQL Editor → New query → 全部貼上 → Run
-- 可以重複執行（全部用 if not exists / create or replace）。
--
-- 建立三樣嘢：
--   1. public.question_bank  雲端密碼題庫
--   2. public.runs           每局成績（排行榜原始數據）
--   3. 4 個 RPC：submit_run / get_leaderboard / record_question_usage /
--                delete_question
--
-- 安全設計（重要）：
--   · 只會開 anon（公開）權限，唔會將任何 secret key 放落瀏覽器。
--   · 所有人都可以「讀」已上架題目同排行榜。
--   · 匿名人士只可以新增「待審核(pending)」題目，需要領袖喺 Dashboard 改做
--     approved 先會出喺遊戲入面（防破壞）。想自己快手上架，睇最底「信任模式」。
--   · 成績一定要經 submit_run() 寫入，入面做咗合理性檢查 + 限速，
--     避免直接 INSERT 亂報分數。
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. 雲端題庫
-- ----------------------------------------------------------------------------
create table if not exists public.question_bank (
  id          uuid primary key default gen_random_uuid(),
  cipher      text not null check (cipher in ('MORSE','PIGPEN','BRAILLE','GRID','PHONET9','SEMAPHORE')),
  -- 答案只限大寫 A–Z / 0–9（遊戲引擎逐個符號出題，最長 24 個字符留畀將來單字題）
  answer      text not null check (answer ~ '^[A-Z0-9]{1,24}$'),
  mode        text not null default 'decode' check (mode in ('decode','encode')),
  difficulty  smallint not null default 1 check (difficulty between 1 and 5),
  hint        text check (hint is null or char_length(hint) <= 80),
  tags        text[] not null default '{}',
  author      text check (author is null or char_length(author) <= 24),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  plays       bigint not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists question_bank_lookup_idx
  on public.question_bank (status, cipher, difficulty);
create index if not exists question_bank_created_idx
  on public.question_bank (created_at desc);

-- ----------------------------------------------------------------------------
-- 2. 排行榜（每局一條記錄）
-- ----------------------------------------------------------------------------
create table if not exists public.runs (
  id           bigserial primary key,
  player       text not null check (char_length(player) between 1 and 12),
  client_id    text not null,               -- 瀏覽器隨機產生的 UUID，用嚟限速/搵自己
  score        integer not null check (score >= 0 and score <= 5000000),
  accuracy     integer not null default 0 check (accuracy between 0 and 100),
  neutralized  integer not null default 0 check (neutralized >= 0),
  max_combo    integer not null default 0 check (max_combo >= 0),
  path         text not null default 'endless' check (path in ('learn','mission','endless')),
  ciphers      text[] not null default '{}',
  speed        integer,
  lives        integer,
  time_limit   integer,
  duration_ms  integer not null default 0 check (duration_ms >= 0),
  created_at   timestamptz not null default now()
);

create index if not exists runs_score_idx  on public.runs (score desc, created_at asc);
create index if not exists runs_path_idx   on public.runs (path, score desc);
create index if not exists runs_client_idx on public.runs (client_id, created_at desc);
create index if not exists runs_time_idx   on public.runs (created_at desc);

-- ----------------------------------------------------------------------------
-- 3. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.question_bank enable row level security;
alter table public.runs enable row level security;

drop policy if exists "question_bank: read approved" on public.question_bank;
create policy "question_bank: read approved"
  on public.question_bank for select
  to anon, authenticated
  using (status = 'approved');

drop policy if exists "question_bank: submit pending" on public.question_bank;
create policy "question_bank: submit pending"
  on public.question_bank for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "runs: public read" on public.runs;
create policy "runs: public read"
  on public.runs for select
  to anon, authenticated
  using (true);

-- 唔開任何 INSERT / UPDATE / DELETE policy 畀 anon：
-- 成績一律經 submit_run()（security definer）寫入，題目改動一律經 RPC。

-- ----------------------------------------------------------------------------
-- 4. RPC：提交一局成績 → 回傳排名
-- ----------------------------------------------------------------------------
create or replace function public.submit_run(
  p_player       text,
  p_client_id    text,
  p_score        integer,
  p_accuracy     integer,
  p_neutralized  integer,
  p_max_combo    integer,
  p_path         text    default 'endless',
  p_ciphers      text[]  default '{}',
  p_speed        integer default null,
  p_lives        integer default null,
  p_time_limit   integer default null,
  p_duration_ms  integer default 0
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player     text;
  v_best       integer;
  v_rank       bigint;
  v_total      bigint;
  v_recent     integer;
  v_run_id     bigint;
  v_new_record boolean := false;
begin
  -- 4.1 清理玩家名稱
  v_player := regexp_replace(coalesce(p_player, ''), '\s+', ' ', 'g');
  v_player := btrim(v_player);
  if char_length(v_player) < 1 then
    v_player := '匿名 Scout';
  end if;
  v_player := left(v_player, 12);

  -- 4.2 基本合理性檢查
  if p_score is null or p_score < 0 or p_score > 5000000 then
    raise exception '分數唔合理';
  end if;
  if p_accuracy is null or p_accuracy < 0 or p_accuracy > 100 then
    raise exception '準確率唔合理';
  end if;
  if coalesce(p_neutralized, 0) < 0 or coalesce(p_max_combo, 0) < 0 then
    raise exception '數據唔合理';
  end if;
  -- 每題最多 100 分 × 最高 10 倍連擊 = 1000 分，加 10000 寬容值
  if p_score > p_neutralized * 1000 + 10000 then
    raise exception '分數同破解數目不符';
  end if;
  -- 每題至少 150ms，否則係外掛／極速腳本（冇提供時間就唔檢查）
  if coalesce(p_duration_ms, 0) > 0 and p_duration_ms < p_neutralized * 150 then
    raise exception '完成時間過短';
  end if;

  -- 4.3 限速：同一個 client_id 一分鐘最多 10 局、一小時最多 60 局
  select count(*) into v_recent
    from public.runs
   where client_id = p_client_id
     and created_at > now() - interval '1 hour';
  if v_recent >= 60 then
    raise exception '提交太頻密，請稍後再試';
  end if;
  select count(*) into v_recent
    from public.runs
   where client_id = p_client_id
     and created_at > now() - interval '1 minute';
  if v_recent >= 10 then
    raise exception '提交太頻密，請稍後再試';
  end if;

  -- 4.4 寫入
  insert into public.runs
    (player, client_id, score, accuracy, neutralized, max_combo,
     path, ciphers, speed, lives, time_limit, duration_ms)
  values
    (v_player, p_client_id, p_score, p_accuracy, p_neutralized, p_max_combo,
     coalesce(p_path, 'endless'), coalesce(p_ciphers, '{}'),
     p_speed, p_lives, p_time_limit, coalesce(p_duration_ms, 0))
  returning id into v_run_id;

  -- 4.5 排名（同一條路線之內，平手以較早完成行先）
  select count(*) + 1 into v_rank
    from public.runs
   where path = coalesce(p_path, 'endless')
     and (score > p_score or (score = p_score and created_at < now()));
  select count(*) into v_total
    from public.runs
   where path = coalesce(p_path, 'endless');

  -- 4.6 個人最佳
  select max(score) into v_best
    from public.runs
   where client_id = p_client_id
     and path = coalesce(p_path, 'endless');
  v_new_record := coalesce(v_best, 0) <= p_score;

  return json_build_object(
    'id', v_run_id,
    'rank', v_rank,
    'total', v_total,
    'percentile', case when v_total <= 1 then 100
                       else round((1 - (v_rank - 1)::numeric / v_total) * 100) end,
    'best', coalesce(v_best, p_score),
    'personal_best', v_new_record,
    'player', v_player
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. RPC：攞排行榜（每位玩家只計最好嗰局）
-- ----------------------------------------------------------------------------
create or replace function public.get_leaderboard(
  p_period     text    default 'all',   -- today | week | month | all
  p_path       text    default null,   -- learn | mission | endless | null = 全部
  p_cipher     text    default null,   -- 'MORSE' 等，只用該密碼嘅局
  p_limit      integer default 20,
  p_client_id  text    default null    -- 用嚟標記「你」嗰行
) returns table (
  rank        bigint,
  player      text,
  score       integer,
  accuracy    integer,
  neutralized integer,
  max_combo   integer,
  path        text,
  ciphers     text[],
  created_at  timestamptz,
  is_you      boolean,
  total_players bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select *
      from public.runs
     where (p_path is null or path = p_path)
       and (p_cipher is null or p_cipher = any(ciphers))
       and (
         case p_period
           when 'today' then created_at >= date_trunc('day', now())
           when 'week'  then created_at >= date_trunc('week', now())
           when 'month' then created_at >= date_trunc('month', now())
           else true
         end
       )
  ),
  best_per_player as (
    select distinct on (player) *
      from filtered
     order by player, score desc, created_at asc
  ),
  ranked as (
    select
      row_number() over (order by score desc, neutralized desc, created_at asc) as rnk,
      count(*) over () as total_players,
      *
    from best_per_player
  )
  select rnk, player, score, accuracy, neutralized, max_combo, path, ciphers,
         created_at,
         (p_client_id is not null and client_id = p_client_id) as is_you,
         total_players
    from ranked
   order by rnk
   limit least(coalesce(p_limit, 20), 200);
$$;

-- ----------------------------------------------------------------------------
-- 6. RPC：記錄題目被用咗幾次（畀領袖睇邊題最常用／邊題最值得留）
-- ----------------------------------------------------------------------------
create or replace function public.record_question_usage(p_ids uuid[])
returns integer
language sql
security definer
set search_path = public
as $$
  with touched as (
    update public.question_bank
       set plays = plays + 1
     where id = any(coalesce(p_ids, '{}'::uuid[]))
       and status = 'approved'
    returning 1
  )
  select count(*)::integer from touched;
$$;

-- ----------------------------------------------------------------------------
-- 7. RPC：刪除自己提交、仲未上架嘅題目（唔畀掂已上架嘅嘢）
-- ----------------------------------------------------------------------------
create or replace function public.delete_question(p_id uuid, p_author text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  delete from public.question_bank
   where id = p_id
     and status = 'pending'
     and lower(coalesce(author, '')) = lower(btrim(coalesce(p_author, '')))
     and btrim(coalesce(p_author, '')) <> '';
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. 權限：anon / authenticated 可以呼叫上面嘅 RPC
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.question_bank to anon, authenticated;
grant select on public.runs to anon, authenticated;
grant execute on function public.submit_run(text, text, integer, integer, integer, integer, text, text[], integer, integer, integer, integer) to anon, authenticated;
grant execute on function public.get_leaderboard(text, text, text, integer, text) to anon, authenticated;
grant execute on function public.record_question_usage(uuid[]) to anon, authenticated;
grant execute on function public.delete_question(uuid, text) to anon, authenticated;

-- ============================================================================
-- 附加：圖表／管理用嘅唯讀 view（喺 Supabase Dashboard 或者自己嘅 BI 用）
-- ============================================================================
create or replace view public.leaderboard_top as
  select distinct on (player) player, score, accuracy, neutralized, max_combo,
         path, ciphers, created_at
    from public.runs
   order by player, score desc, created_at asc;

create or replace view public.question_bank_stats as
  select cipher, difficulty, status, count(*) as questions, sum(plays) as plays
    from public.question_bank
   group by cipher, difficulty, status
   order by cipher, difficulty;

-- ============================================================================
-- 可選（一）信任模式：領袖自己用，想成員都可以直接上架題目
--   → 喺 SQL Editor 另外執行下面兩行（注意：任何人都可以直接加題目）
--
-- drop policy if exists "question_bank: submit pending" on public.question_bank;
-- create policy "question_bank: open insert"
--   on public.question_bank for insert to anon, authenticated with check (true);
--
-- 可選（二）清空數據（示範後想重設）：
--   truncate public.runs restart identity;
--   truncate public.question_bank restart identity;
-- ============================================================================
