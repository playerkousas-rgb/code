/* ============================================================================
 * CipherCloud — Scout System 密碼平台 · 雲端題庫 + 排行榜
 * ----------------------------------------------------------------------------
 * 一個純前端（classic script，唔使打包）嘅雲端層，提供三種後端：
 *
 *   1. supabase — 真．多人共用：雲端題庫 + 全球排行榜
 *   2. mock     — 本機模擬：用 localStorage 扮後端，冇網絡／未設定 Supabase
 *                 都可以即刻試到題庫同排行榜嘅玩法（數據只喺自己瀏覽器）
 *   3. off      — 完全關閉，遊戲沿用原有嘅 localStorage 個人紀錄
 *
 * 用法（喺頁面入面）：
 *   CipherCloud.init();                       // 自動連線
 *   CipherCloud.onStatus(fn);                 // 監聽連線狀態
 *   CipherCloud.pickQuestion(ciphers, weak);  // 抽題（抽唔到就回 null，遊戲用隨機）
 *   CipherCloud.submitRun({...});             // 交成績 → {rank, total, percentile}
 *   CipherCloud.leaderboard({period, path});  // 排行榜
 *   CipherCloud.addQuestion({...});           // 新增題目
 *
 * 對應嘅後端 SQL：supabase/schema.sql（貼入 Supabase SQL Editor 執行）
 * ==========================================================================*/
(function (global) {
  'use strict';

  var FILE_CONFIG = global.CIPHER_CLOUD_CONFIG || {};

  var CFG_KEY = 'skw_cipher_cloud_config';
  var PLAYER_KEY = 'skw_cipher_cloud_player';
  var CLIENT_KEY = 'skw_cipher_client_id';
  var Q_CACHE_KEY = 'skw_cipher_cloud_questions';
  var BOARD_CACHE_KEY = 'skw_cipher_cloud_board';
  var MOCK_KEY = 'skw_cipher_mock_db_v1';
  var USAGE_KEY = 'skw_cipher_cloud_usage';

  var SUPABASE_SOURCES = [
    '../js/supabase.min.js',
    '/js/supabase.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
  ];

  var VALID_CIPHERS = ['MORSE', 'PIGPEN', 'BRAILLE', 'GRID', 'PHONET9', 'SEMAPHORE'];
  var VALID_PATHS = ['learn', 'mission', 'endless'];
  var VALID_PERIODS = ['today', 'week', 'month', 'all'];
  var ANSWER_RE = /^[A-Z0-9]{1,24}$/;
  var SINGLE_CHAR_RE = /^[A-Z0-9]$/;

  // ---------------------------------------------------------------------------
  // 小工具
  // ---------------------------------------------------------------------------
  function readJSON(key, fallback) {
    try {
      var raw = global.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  function sanitizeAnswer(value) {
    return String(value == null ? '' : value)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 24);
  }

  function sanitizeName(value, fallback) {
    var name = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    if (!name) name = fallback || '匿名 Scout';
    return name.slice(0, 12);
  }

  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // ---------------------------------------------------------------------------
  // 狀態
  // ---------------------------------------------------------------------------
  var state = {
    mode: 'off',        // off | mock | supabase
    status: 'idle',     // idle | loading | ready | error
    message: '未連線',
    source: 'none',     // none | file | local
    bankCount: 0,
    ready: false
  };

  var listeners = [];
  var backend = null;
  var questionCache = readJSON(Q_CACHE_KEY, { savedAt: 0, items: [] });
  var pendingUsage = readJSON(USAGE_KEY, []);
  var recentIds = [];
  var clientId = (function () {
    var id = null;
    try {
      id = global.localStorage.getItem(CLIENT_KEY);
      if (!id) {
        id = uuid();
        global.localStorage.setItem(CLIENT_KEY, id);
      }
    } catch (err) {
      id = 'no-storage';
    }
    return id;
  })();

  function setState(patch) {
    var changed = false;
    Object.keys(patch).forEach(function (key) {
      if (state[key] !== patch[key]) {
        state[key] = patch[key];
        changed = true;
      }
    });
    state.ready = state.status === 'ready';
    if (changed) notify();
  }

  function notify() {
    var snapshot = getStatus();
    listeners.forEach(function (fn) {
      try {
        fn(snapshot);
      } catch (err) {
        /* 一個 listener 壞唔好累到其他 */
      }
    });
  }

  function getStatus() {
    return {
      mode: state.mode,
      status: state.status,
      message: state.message,
      source: state.source,
      bankCount: state.bankCount,
      ready: state.ready,
      configured: state.mode !== 'off'
    };
  }

  // ---------------------------------------------------------------------------
  // 設定
  // ---------------------------------------------------------------------------
  function getConfig() {
    var local = readJSON(CFG_KEY, {});
    var cfg = {
      url: String((local && local.url) || FILE_CONFIG.url || '').trim().replace(/\/+$/, ''),
      anonKey: String((local && local.anonKey) || FILE_CONFIG.anonKey || '').trim(),
      mode: (local && local.mode) || FILE_CONFIG.mode || 'auto',
      boardLimit: (local && local.boardLimit) || FILE_CONFIG.boardLimit || 20
    };
    if (VALID_PERIODS.indexOf(cfg.mode) === -1 && ['auto', 'mock', 'off'].indexOf(cfg.mode) === -1) {
      cfg.mode = 'auto';
    }
    cfg.source = local && local.url ? 'local' : (FILE_CONFIG.url ? 'file' : 'none');
    cfg.hasLocal = Boolean(local && (local.url || local.mode));
    return cfg;
  }

  function saveLocalConfig(cfg) {
    var next = Object.assign({}, readJSON(CFG_KEY, {}), cfg || {});
    writeJSON(CFG_KEY, next);
    return next;
  }

  function clearLocalConfig() {
    try {
      global.localStorage.removeItem(CFG_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  function resolveMode(cfg) {
    if (cfg.mode === 'off') return 'off';
    if (cfg.mode === 'mock') return 'mock';
    return cfg.url && cfg.anonKey ? 'supabase' : 'off';
  }

  // ---------------------------------------------------------------------------
  // Supabase 客戶端載入（只喺真正需要嗰陣先 download 218KB）
  // ---------------------------------------------------------------------------
  var loadingPromise = null;

  function loadSupabaseScript() {
    if (global.supabase && global.supabase.createClient) return Promise.resolve(global.supabase);

    var tryIndex = 0;
    function attempt() {
      if (tryIndex >= SUPABASE_SOURCES.length) {
        return Promise.reject(new Error('載唔到 Supabase 客戶端'));
      }
      var src = SUPABASE_SOURCES[tryIndex++];
      return new Promise(function (resolve, reject) {
        var el = global.document.createElement('script');
        el.src = src;
        el.async = true;
        el.onload = function () {
          if (global.supabase && global.supabase.createClient) resolve(global.supabase);
          else reject(new Error('Supabase 客戶端格式唔啱'));
        };
        el.onerror = function () {
          reject(new Error('載唔到 ' + src));
        };
        global.document.head.appendChild(el);
      }).catch(attempt);
    }
    return attempt();
  }

  // ---------------------------------------------------------------------------
  // 後端 A：Supabase
  // ---------------------------------------------------------------------------
  function supabaseBackend(cfg) {
    var client = null;

    function db() {
      if (client) return Promise.resolve(client);
      return loadSupabaseScript().then(function (lib) {
        client = lib.createClient(cfg.url, cfg.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { 'x-application-name': 'skw-cipher-hub' } }
        });
        return client;
      });
    }

    function unwrap(result) {
      if (!result || result.error) throw result && result.error;
      return result.data;
    }

    return {
      kind: 'supabase',
      listQuestions: function (opts) {
        opts = opts || {};
        return db().then(function (c) {
          var query = c
            .from('question_bank')
            .select('id,cipher,answer,mode,difficulty,hint,tags,author,status,plays,created_at')
            .eq('status', opts.status || 'approved')
            .order('created_at', { ascending: false })
            .limit(Math.min(Number(opts.limit) || 500, 1000));
          if (opts.cipher && VALID_CIPHERS.indexOf(opts.cipher) !== -1) query = query.eq('cipher', opts.cipher);
          if (opts.author) query = query.eq('author', opts.author);
          return query;
        }).then(unwrap);
      },
      addQuestion: function (payload) {
        return db().then(function (c) {
          return c.from('question_bank').insert([payload]).select('id').single();
        }).then(unwrap);
      },
      deleteQuestion: function (id, author) {
        return db().then(function (c) {
          return c.rpc('delete_question', { p_id: id, p_author: author || '' });
        }).then(unwrap);
      },
      submitRun: function (payload) {
        return db().then(function (c) {
          return c.rpc('submit_run', {
            p_player: payload.player,
            p_client_id: payload.clientId,
            p_score: payload.score,
            p_accuracy: payload.accuracy,
            p_neutralized: payload.neutralized,
            p_max_combo: payload.maxCombo,
            p_path: payload.path,
            p_ciphers: payload.ciphers,
            p_speed: payload.speed,
            p_lives: payload.lives,
            p_time_limit: payload.timeLimit,
            p_duration_ms: payload.durationMs
          });
        }).then(unwrap);
      },
      leaderboard: function (opts) {
        return db().then(function (c) {
          return c.rpc('get_leaderboard', {
            p_period: opts.period || 'all',
            p_path: opts.path || null,
            p_cipher: opts.cipher || null,
            p_limit: opts.limit || 20,
            p_client_id: opts.clientId || null
          });
        }).then(unwrap);
      },
      markUsage: function (ids) {
        if (!ids || !ids.length) return Promise.resolve(0);
        return db().then(function (c) {
          return c.rpc('record_question_usage', { p_ids: ids });
        }).then(unwrap).catch(function () {
          return 0;
        });
      }
    };
  }

  // ---------------------------------------------------------------------------
  // 後端 B：本機模擬（localStorage）
  // ---------------------------------------------------------------------------
  function mockBackend() {
    function db() {
      var data = readJSON(MOCK_KEY, null);
      if (!data || !Array.isArray(data.questions) || !Array.isArray(data.runs)) {
        data = { questions: seedQuestions(), runs: [] };
        writeJSON(MOCK_KEY, data);
      }
      return data;
    }

    function save(data) {
      writeJSON(MOCK_KEY, data);
      return data;
    }

    function seedQuestions() {
      var seed = [
        ['MORSE', 'S', '國際求救訊號嘅頭一個字母'],
        ['MORSE', 'O', '三劃'],
        ['PIGPEN', 'C', '只有兩條邊'],
        ['PIGPEN', 'E', '四邊形實心'],
        ['BRAILLE', 'B', '頭兩個凸點'],
        ['BRAILLE', 'T', '第四至第六點'],
        ['GRID', 'A', 'SCOUT 格入面嘅 SS'],
        ['GRID', 'T', '第四行第一個'],
        ['PHONET9', 'S', '按 7 四次'],
        ['PHONET9', 'K', '按 5 兩次'],
        ['SEMAPHORE', 'A', '手向下斜'],
        ['SEMAPHORE', 'Z', '兩手交叉向下']
      ];
      return seed.map(function (row) {
        return {
          id: uuid(),
          cipher: row[0],
          answer: row[1],
          mode: 'decode',
          difficulty: 1,
          hint: row[2],
          tags: ['示範'],
          author: '示範題庫',
          status: 'approved',
          plays: 0,
          created_at: nowISO()
        };
      });
    }

    function validateRun(payload) {
      if (!(payload.score >= 0) || payload.score > 5000000) throw new Error('分數唔合理');
      if (payload.score > payload.neutralized * 1000 + 10000) throw new Error('分數同破解數目不符');
      if (payload.durationMs > 0 && payload.durationMs < payload.neutralized * 150) {
        throw new Error('完成時間過短');
      }
      var hourAgo = Date.now() - 60 * 60 * 1000;
      var recent = db().runs.filter(function (r) {
        return r.client_id === payload.clientId && new Date(r.created_at).getTime() > hourAgo;
      });
      if (recent.length >= 60) throw new Error('提交太頻密，請稍後再試');
    }

    return {
      kind: 'mock',
      listQuestions: function (opts) {
        opts = opts || {};
        var items = db().questions.slice();
        var status = opts.status || 'approved';
        return Promise.resolve(
          items
            .filter(function (q) {
              if (status !== 'any' && q.status !== status) return false;
              if (opts.cipher && q.cipher !== opts.cipher) return false;
              if (opts.author && q.author !== opts.author) return false;
              return true;
            })
            .sort(function (a, b) {
              return String(b.created_at).localeCompare(String(a.created_at));
            })
            .slice(0, Math.min(Number(opts.limit) || 500, 1000))
        );
      },
      addQuestion: function (payload) {
        var data = db();
        var row = Object.assign({ id: uuid(), plays: 0, created_at: nowISO() }, payload);
        data.questions.unshift(row);
        save(data);
        return Promise.resolve({ id: row.id });
      },
      deleteQuestion: function (id, author) {
        var data = db();
        var before = data.questions.length;
        data.questions = data.questions.filter(function (q) {
          return !(q.id === id && q.status === 'pending' &&
            String(q.author || '').toLowerCase() === String(author || '').trim().toLowerCase());
        });
        save(data);
        return Promise.resolve(data.questions.length < before);
      },
      submitRun: function (payload) {
        validateRun(payload);
        var data = db();
        var row = {
          id: Date.now(),
          player: payload.player,
          client_id: payload.clientId,
          score: payload.score,
          accuracy: payload.accuracy,
          neutralized: payload.neutralized,
          max_combo: payload.maxCombo,
          path: payload.path,
          ciphers: payload.ciphers,
          speed: payload.speed,
          lives: payload.lives,
          time_limit: payload.timeLimit,
          duration_ms: payload.durationMs,
          created_at: nowISO()
        };
        data.runs.push(row);
        save(data);
        return Promise.resolve(rankResult(data.runs, row));
      },
      leaderboard: function (opts) {
        return Promise.resolve(buildBoard(db().runs, opts || {}));
      },
      markUsage: function (ids) {
        if (!ids || !ids.length) return Promise.resolve(0);
        var data = db();
        var count = 0;
        data.questions.forEach(function (q) {
          if (ids.indexOf(q.id) !== -1) {
            q.plays = (q.plays || 0) + 1;
            count++;
          }
        });
        save(data);
        return Promise.resolve(count);
      },
      // 模擬模式專用：清空／塞示範數據
      reset: function (keepQuestions) {
        var data = db();
        save({ questions: keepQuestions ? data.questions : seedQuestions(), runs: [] });
        return Promise.resolve(true);
      },
      seedRuns: function (rows) {
        var data = db();
        (rows || []).forEach(function (row) {
          data.runs.push(Object.assign({ id: Date.now() + Math.random(), created_at: nowISO() }, row));
        });
        save(data);
        return Promise.resolve(data.runs.length);
      }
    };
  }

  // 排名計算（模擬模式同 Supabase 嘅 get_leaderboard 邏輯一致：每位玩家計最好嗰局）
  function rankResult(runs, row) {
    var samePath = runs.filter(function (r) {
      return r.path === row.path;
    });
    var rank = samePath.filter(function (r) {
      return r.score > row.score || (r.score === row.score && String(r.created_at) < String(row.created_at));
    }).length + 1;
    var total = samePath.length;
    var best = 0;
    runs.forEach(function (r) {
      if (r.client_id === row.client_id && r.path === row.path) best = Math.max(best, r.score);
    });
    return {
      id: row.id,
      rank: rank,
      total: total,
      percentile: total <= 1 ? 100 : Math.round((1 - (rank - 1) / total) * 100),
      best: Math.max(best, row.score),
      personal_best: row.score >= best,
      player: row.player
    };
  }

  function buildBoard(runs, opts) {
    var period = VALID_PERIODS.indexOf(opts.period) !== -1 ? opts.period : 'all';
    var cutoff = 0;
    var now = new Date();
    if (period === 'today') cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    else if (period === 'week') cutoff = now.getTime() - 7 * 24 * 3600 * 1000;
    else if (period === 'month') cutoff = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    var filtered = runs.filter(function (r) {
      if (opts.path && r.path !== opts.path) return false;
      if (opts.cipher && (r.ciphers || []).indexOf(opts.cipher) === -1) return false;
      if (cutoff && new Date(r.created_at).getTime() < cutoff) return false;
      return true;
    });
    var bestByPlayer = {};
    filtered.forEach(function (r) {
      var cur = bestByPlayer[r.player];
      if (!cur || r.score > cur.score ||
        (r.score === cur.score && String(r.created_at) < String(cur.created_at))) {
        bestByPlayer[r.player] = r;
      }
    });
    var list = Object.keys(bestByPlayer).map(function (k) {
      return bestByPlayer[k];
    }).sort(function (a, b) {
      return b.score - a.score ||
        (b.neutralized || 0) - (a.neutralized || 0) ||
        String(a.created_at).localeCompare(String(b.created_at));
    });
    var total = list.length;
    return list.slice(0, Math.min(Number(opts.limit) || 20, 200)).map(function (r, index) {
      return {
        rank: index + 1,
        player: r.player,
        score: r.score,
        accuracy: r.accuracy,
        neutralized: r.neutralized,
        max_combo: r.max_combo,
        path: r.path,
        ciphers: r.ciphers || [],
        created_at: r.created_at,
        is_you: Boolean(opts.clientId) && r.client_id === opts.clientId,
        total_players: total
      };
    });
  }

  // ---------------------------------------------------------------------------
  // 初始化
  // ---------------------------------------------------------------------------
  function init(options) {
    options = options || {};
    var cfg = getConfig();
    var mode = resolveMode(cfg);

    if (mode === 'off') {
      backend = null;
      setState({
        mode: 'off',
        status: 'idle',
        source: cfg.source,
        message: '未設定雲端 · 用緊本機個人紀錄',
        bankCount: 0
      });
      return Promise.resolve(getStatus());
    }

    if (mode === 'mock') {
      backend = mockBackend();
      setState({
        mode: 'mock',
        status: 'loading',
        source: 'local',
        message: '本機模擬雲端連線中…',
        bankCount: 0
      });
      return refreshQuestions(options).then(function () {
        setState({ status: 'ready', message: '本機模擬模式（數據只喺呢部機）' });
        return getStatus();
      }).catch(function (err) {
        setState({ status: 'error', message: '模擬模式失敗：' + err.message });
        return getStatus();
      });
    }

    if (loadingPromise) return loadingPromise;

    setState({
      mode: 'supabase',
      status: 'loading',
      source: cfg.source,
      message: '連接 Supabase…',
      bankCount: 0
    });

    loadingPromise = (function () {
      backend = supabaseBackend(cfg);
      return backend.listQuestions({ limit: 500 }).then(function (rows) {
        questionCache = { savedAt: Date.now(), items: normalizeQuestions(rows) };
        writeJSON(Q_CACHE_KEY, questionCache);
        setState({
          status: 'ready',
          message: 'Supabase 已連線',
          bankCount: questionCache.items.length
        });
        flushUsage();
        return getStatus();
      }).catch(function (err) {
        setState({
          status: 'error',
          message: '連唔到 Supabase：' + ((err && err.message) || '未知錯誤')
        });
        return getStatus();
      }).then(function (status) {
        loadingPromise = null;
        return status;
      });
    })();

    return loadingPromise;
  }

  function normalizeQuestions(rows) {
    return (rows || [])
      .map(function (row) {
        return {
          id: row.id,
          cipher: row.cipher,
          answer: String(row.answer || '').toUpperCase(),
          mode: row.mode || 'decode',
          difficulty: Number(row.difficulty) || 1,
          hint: row.hint || '',
          tags: row.tags || [],
          author: row.author || '',
          status: row.status || 'approved',
          plays: Number(row.plays) || 0,
          created_at: row.created_at
        };
      })
      .filter(function (q) {
        return VALID_CIPHERS.indexOf(q.cipher) !== -1 && ANSWER_RE.test(q.answer);
      });
  }

  function reconfigure(cfg) {
    loadingPromise = null;
    backend = null;
    if (cfg) saveLocalConfig(cfg);
    return init();
  }

  // ---------------------------------------------------------------------------
  // 題庫
  // ---------------------------------------------------------------------------
  function refreshQuestions(options) {
    options = options || {};
    if (!backend) return Promise.resolve([]);
    return backend
      .listQuestions({ status: 'approved', limit: options.limit || 500 })
      .then(function (rows) {
        questionCache = { savedAt: Date.now(), items: normalizeQuestions(rows) };
        writeJSON(Q_CACHE_KEY, questionCache);
        setState({ bankCount: questionCache.items.length });
        return questionCache.items;
      })
      .catch(function (err) {
        setState({ status: 'error', message: '攞唔到題庫：' + ((err && err.message) || '未知錯誤') });
        return questionCache.items || [];
      });
  }

  // 畀遊戲引擎用：只會揀單個字符（A–Z / 0–9）嘅題目
  function questionsFor(ciphers, options) {
    options = options || {};
    var wanted = (ciphers || []).filter(function (c) {
      return VALID_CIPHERS.indexOf(c) !== -1;
    });
    return (questionCache.items || []).filter(function (q) {
      if (!SINGLE_CHAR_RE.test(q.answer)) return false;
      if (q.mode && q.mode !== 'decode' && q.mode !== 'encode') return false;
      if (wanted.length && wanted.indexOf(q.cipher) === -1) return false;
      if (options.maxDifficulty && q.difficulty > options.maxDifficulty) return false;
      return true;
    });
  }

  /**
   * 抽一題雲端題目。
   * @param {string[]} ciphers      已選密碼，例如 ['MORSE','BRAILLE']
   * @param {string[]} weakLetters  玩家錯過嘅字母，會優先抽（同原有弱項機制配合）
   * @param {number}  [bias=0.55]   幾多機會優先抽弱項字母
   * @returns {object|null}
   */
  function pickQuestion(ciphers, weakLetters, bias) {
    var pool = questionsFor(ciphers);
    if (!pool.length) return null;

    var weak = (weakLetters || []).filter(function (letter) {
      return SINGLE_CHAR_RE.test(String(letter).toUpperCase());
    }).map(function (letter) {
      return String(letter).toUpperCase();
    });

    var chosen = null;
    if (weak.length && Math.random() < (bias == null ? 0.55 : bias)) {
      var weakPool = pool.filter(function (q) {
        return weak.indexOf(q.answer) !== -1;
      });
      if (weakPool.length) chosen = pickRandom(weakPool);
    }
    if (!chosen) chosen = pickRandom(pool);

    // 避免短時間內重覆出同一題（題庫細嗰陣好重要）
    if (pool.length > 4) {
      for (var tries = 0; tries < 3 && recentIds.indexOf(chosen.id) !== -1; tries++) {
        chosen = pickRandom(pool);
      }
    }
    recentIds.push(chosen.id);
    if (recentIds.length > 12) recentIds.shift();

    markUsage(chosen.id);
    return chosen;
  }

  function markUsage(id) {
    if (!id || !backend) return;
    if (pendingUsage.indexOf(id) === -1) pendingUsage.push(id);
    if (pendingUsage.length >= 20) flushUsage();
    else writeJSON(USAGE_KEY, pendingUsage);
  }

  function flushUsage() {
    if (!backend || !pendingUsage.length) return Promise.resolve(0);
    var ids = pendingUsage.slice();
    pendingUsage = [];
    writeJSON(USAGE_KEY, pendingUsage);
    return Promise.resolve().then(function () {
      return backend.markUsage(ids);
    });
  }

  function addQuestion(payload) {
    if (!backend) return Promise.reject(new Error('雲端未連線'));
    var cipher = String((payload && payload.cipher) || '').toUpperCase();
    var answer = sanitizeAnswer(payload && payload.answer);
    if (VALID_CIPHERS.indexOf(cipher) === -1) return Promise.reject(new Error('密碼類型唔啱'));
    if (!ANSWER_RE.test(answer)) return Promise.reject(new Error('答案只可以用 A–Z / 0–9'));

    var row = {
      cipher: cipher,
      answer: answer,
      mode: payload.mode === 'encode' ? 'encode' : 'decode',
      difficulty: Math.max(1, Math.min(5, Number(payload.difficulty) || 1)),
      hint: String(payload.hint || '').slice(0, 80) || null,
      tags: Array.isArray(payload.tags) ? payload.tags.slice(0, 5) : [],
      author: sanitizeName(payload.author, '匿名領袖').slice(0, 24),
      status: 'pending'
    };
    return Promise.resolve().then(function () {
      return backend.addQuestion(row);
    }).then(function (res) {
      return Object.assign({}, row, { id: res && res.id });
    });
  }

  function listQuestions(options) {
    if (!backend) return Promise.resolve([]);
    return Promise.resolve().then(function () {
      return backend.listQuestions(options || {});
    }).then(normalizeQuestions);
  }

  function deleteQuestion(id, author) {
    if (!backend) return Promise.reject(new Error('雲端未連線'));
    return Promise.resolve().then(function () {
      return backend.deleteQuestion(id, author);
    }).then(function () {
      questionCache.items = (questionCache.items || []).filter(function (q) {
        return q.id !== id;
      });
      writeJSON(Q_CACHE_KEY, questionCache);
      setState({ bankCount: questionCache.items.length });
      return true;
    });
  }

  // ---------------------------------------------------------------------------
  // 成績／排行榜
  // ---------------------------------------------------------------------------
  function submitRun(payload) {
    if (!backend) return Promise.reject(new Error('雲端未連線'));
    var data = payload || {};
    var run = {
      player: sanitizeName(data.player, '匿名 Scout'),
      clientId: clientId,
      score: Math.max(0, Math.round(Number(data.score) || 0)),
      accuracy: Math.max(0, Math.min(100, Math.round(Number(data.accuracy) || 0))),
      neutralized: Math.max(0, Math.round(Number(data.neutralized) || 0)),
      maxCombo: Math.max(0, Math.round(Number(data.maxCombo) || 0)),
      path: VALID_PATHS.indexOf(data.path) !== -1 ? data.path : 'endless',
      ciphers: (data.ciphers || []).filter(function (c) {
        return VALID_CIPHERS.indexOf(c) !== -1;
      }),
      speed: Number(data.speed) || null,
      lives: data.lives == null ? null : Number(data.lives),
      timeLimit: Number(data.timeLimit) || null,
      durationMs: Math.max(0, Math.round(Number(data.durationMs) || 0))
    };
    setPlayerName(run.player);
    flushUsage();
    return Promise.resolve().then(function () {
      return backend.submitRun(run);
    }).then(function (result) {
      var board = readJSON(BOARD_CACHE_KEY, {});
      board.last = { run: run, result: result, at: Date.now() };
      writeJSON(BOARD_CACHE_KEY, board);
      return result;
    });
  }

  function leaderboard(options) {
    options = options || {};
    var request = {
      period: VALID_PERIODS.indexOf(options.period) !== -1 ? options.period : 'all',
      path: VALID_PATHS.indexOf(options.path) !== -1 ? options.path : null,
      cipher: VALID_CIPHERS.indexOf(options.cipher) !== -1 ? options.cipher : null,
      limit: Math.min(Number(options.limit) || 20, 100),
      clientId: clientId
    };
    if (!backend) return Promise.resolve([]);
    return Promise.resolve().then(function () {
      return backend.leaderboard(request);
    }).then(function (rows) {
      var board = readJSON(BOARD_CACHE_KEY, {});
      board[cacheKey(request)] = { rows: rows, at: Date.now() };
      writeJSON(BOARD_CACHE_KEY, board);
      return rows || [];
    }).catch(function () {
      // 離線時用上次嘅快照，至少睇到排行榜個樣
      var board = readJSON(BOARD_CACHE_KEY, {});
      return (board[cacheKey(request)] && board[cacheKey(request)].rows) || [];
    });
  }

  function cacheKey(request) {
    return [request.period, request.path || 'all', request.cipher || 'all', request.limit].join('|');
  }

  function myBest(path) {
    var board = readJSON(BOARD_CACHE_KEY, {});
    var last = board.last;
    if (!last) return null;
    if (path && last.run.path !== path) return null;
    return last.result;
  }

  // ---------------------------------------------------------------------------
  // 玩家身份
  // ---------------------------------------------------------------------------
  function getPlayerName() {
    var stored = readJSON(PLAYER_KEY, {});
    return stored && stored.name ? stored.name : '';
  }

  function setPlayerName(name) {
    var clean = sanitizeName(name, '');
    if (!clean) return '';
    writeJSON(PLAYER_KEY, { name: clean, updatedAt: Date.now() });
    return clean;
  }

  // ---------------------------------------------------------------------------
  // 對外 API
  // ---------------------------------------------------------------------------
  var api = {
    // 生命週期
    init: init,
    reconfigure: reconfigure,
    getStatus: getStatus,
    status: getStatus,
    onStatus: function (fn) {
      if (typeof fn === 'function') listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (item) {
          return item !== fn;
        });
      };
    },
    isReady: function () {
      return state.status === 'ready' && Boolean(backend);
    },
    getMode: function () {
      return state.mode;
    },
    getClientId: function () {
      return clientId;
    },

    // 設定
    getConfig: getConfig,
    saveConfig: saveLocalConfig,
    clearConfig: clearLocalConfig,

    // 玩家
    getPlayerName: getPlayerName,
    setPlayerName: setPlayerName,

    // 題庫
    refreshQuestions: refreshQuestions,
    questionsFor: questionsFor,
    pickQuestion: pickQuestion,
    addQuestion: addQuestion,
    listQuestions: listQuestions,
    deleteQuestion: deleteQuestion,
    markUsage: markUsage,
    flushUsage: flushUsage,
    bankCount: function () {
      return (questionCache.items || []).length;
    },
    bankSyncedAt: function () {
      return questionCache.savedAt || 0;
    },

    // 排行榜
    submitRun: submitRun,
    leaderboard: leaderboard,
    myBest: myBest,

    // 模擬模式專用（Supabase 模式下會係 undefined）
    mockReset: function (keepQuestions) {
      return backend && backend.reset ? backend.reset(keepQuestions) : Promise.resolve(false);
    },
    mockSeedRuns: function (rows) {
      return backend && backend.seedRuns ? backend.seedRuns(rows) : Promise.resolve(0);
    },

    // 畀頁面用嘅常數
    CIPHERS: VALID_CIPHERS.slice(),
    PATHS: VALID_PATHS.slice(),
    PERIODS: VALID_PERIODS.slice()
  };

  global.CipherCloud = api;

  // 自動初始化（除非頁面想自己控制）
  if (!global.CIPHER_CLOUD_MANUAL_INIT) {
    if (global.document && global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', function () {
        init();
      });
    } else {
      init();
    }
  }

  // 收工／轉頁前記得將「題目用咗幾多次」送去雲端
  if (global.document) {
    global.addEventListener('pagehide', flushUsage);
    global.document.addEventListener('visibilitychange', function () {
      if (global.document.visibilityState === 'hidden') flushUsage();
    });
  }
})(window);
