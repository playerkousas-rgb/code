import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const i18nSource = await readFile(new URL('../js/i18n.js', import.meta.url), 'utf8');
const trainingHtml = await readFile(new URL('../training/index.html', import.meta.url), 'utf8');

function makeContext() {
  const gradient = { addColorStop() {} };
  const base = {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    measureText: () => ({ width: 10 }),
  };
  return new Proxy(base, {
    get(target, prop) { return prop in target ? target[prop] : () => {}; },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

// Top-level `let` bindings inside an eval'd classic script are not reachable
// from a later eval, so append a debug closure to the SAME script string.
const EXPOSE = `
window.__dbg = () => ({
  dailyMode, sessionGoal, queue: dailyQueue.slice(), threats,
  levels: dailyLevels.map(l => ({ cipher: l.cipher, letters: l.letters.slice() })),
  dailyLevelIndex, totalNeutralized, gameState, lives, trainingPath,
  dailyPrevPath, effectsEnabled, record: readDailyRecord()
});
window.__setRecord = (r) => writeDailyRecord(r);
window.__pushThreat = (cipher, letter) => threats.push({
  x: 100, y: 100, size: 30, type: 'hex', cipher, answer: letter,
  glow: '#ffffff', stroke: '#ffffff', fill: '#ffffff'
});
window.__forceWin = () => { totalNeutralized = sessionGoal; checkStageComplete(); };
`;

function boot(options = {}) {
  const dom = new JSDOM(trainingHtml, {
    url: 'https://scout.example/training/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const win = dom.window;
  if (options.reducedMotion) {
    win.matchMedia = (query) => ({
      media: query, matches: /prefers-reduced-motion/.test(query),
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
    });
  }
  if (options.record) win.localStorage.setItem('skw_cipher_daily', JSON.stringify(options.record));
  if (options.coachSeen) win.localStorage.setItem('skw_cipher_coach_seen', '1');
  win.CanvasRenderingContext2D = class { fill() {} };
  win.HTMLCanvasElement.prototype.getContext = () => makeContext();
  const frames = [];
  let simTime = 0;
  win.requestAnimationFrame = options.captureFrames
    ? (cb) => { frames.push(cb); return frames.length; }
    : () => 0;
  win.eval(i18nSource);
  const scripts = [...trainingHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1])
    .filter((s) => s.includes('function startGame'));
  assert.equal(scripts.length, 1);
  win.eval(scripts[0] + EXPOSE);
  const step = (n) => {
    for (let i = 0; i < n; i++) {
      const cb = frames.pop();
      frames.length = 0;
      if (!cb) break;
      simTime += 50;
      cb(simTime);
    }
  };
  return { dom, win, dbg: () => win.__dbg(), step };
}

test('W8: the Astra reference, its limits, and the user correction are documented', async () => {
  const credits = await readFile(new URL('../CREDITS.md', import.meta.url), 'utf8');
  const doc = await readFile(new URL('../docs/astra-lab-reference.md', import.meta.url), 'utf8');
  assert.match(credits, /app\.astra-ai\.co\/lab/);
  assert.match(doc, /沒有.*複製|冇複製|唔抄/);
  assert.match(doc, /no fake data|造假數據|假造/);
  assert.match(doc, /3 關/);
  assert.match(doc, /唔扣血/);
});

test('each daily stage has exactly ONE cipher and three distinct letters', () => {
  const { dom, win } = boot({ coachSeen: true });
  const a = win.dailyLevelsForDate('2026-11-08');
  const b = win.dailyLevelsForDate('2026-11-08');
  const c = win.dailyLevelsForDate('2026-11-09');
  assert.deepEqual(a, b, 'same date must give the same stages');
  assert.notDeepEqual(a, c, 'different dates must give different stages');
  assert.equal(a.length, 3);
  assert.equal(new Set(a.map((l) => l.cipher)).size, 3, 'one cipher per stage, no repeats');
  for (const level of [...a, ...c]) {
    assert.ok(['MORSE', 'PIGPEN', 'BRAILLE', 'GRID', 'PHONET9', 'SEMAPHORE'].includes(level.cipher));
    assert.equal(level.letters.length, 3);
    assert.equal(new Set(level.letters).size, 3, 'no repeated letters inside a stage');
    for (const letter of level.letters) {
      assert.match(letter, /^[A-Z]$/);
      assert.ok(!(level.cipher === 'GRID' && letter === 'J'));
    }
  }
  dom.window.close();
});

test('the daily starts as finishable practice: 9 questions, one cipher at a time, no lives lost', () => {
  const { dom, win, dbg } = boot({ coachSeen: true });
  const savedPath = dbg().trainingPath;
  win.startDaily();
  const state = dbg();
  assert.equal(state.dailyMode, true);
  assert.equal(state.sessionGoal, 9);
  assert.equal(state.levels.length, 3);
  assert.equal(state.dailyLevelIndex, 0);
  assert.equal(state.queue.length, 3);
  assert.ok(state.queue.every((q) => q.cipher === state.levels[0].cipher), 'stage 1 uses one cipher only');
  assert.equal(state.lives, 9999, 'no lives can be lost in a daily');
  assert.ok(!win.document.getElementById('daily-hud').classList.contains('hidden'));
  assert.ok(!win.document.getElementById('daily-ref-wrap').classList.contains('hidden'));
  assert.equal(win.document.querySelectorAll('#daily-ref-body .daily-ref-row').length, 3);
  assert.match(win.document.querySelector('.daily-note').textContent, /練習模式/);

  win.returnToSelection(false);
  assert.equal(dbg().dailyMode, false);
  assert.equal(dbg().trainingPath, savedPath, 'the saved learning path is restored');
  dom.window.close();
});

test('letting threats through never ends or damages a daily session', () => {
  const { dom, win, dbg, step } = boot({ coachSeen: true, captureFrames: true });
  win.startDaily();
  const initialLives = dbg().lives;
  step(1600); // enough frames for several slow threats to reach the firewall
  const state = dbg();
  assert.equal(state.gameState, 'play', 'a missed question must not trigger game over');
  assert.equal(state.lives, initialLives, 'no life is deducted');
  assert.equal(state.totalNeutralized, 0);
  assert.ok(state.queue.length <= 3, 'missed questions are re-queued, not lost');
  dom.window.close();
});

test('after 3 correct answers the daily advances to a new single-cipher stage', () => {
  const { dom, win, dbg } = boot({ coachSeen: true });
  win.startDaily();
  const first = dbg().levels[0];
  const second = dbg().levels[1];
  assert.notEqual(first.cipher, second.cipher);
  for (const letter of first.letters) {
    win.__pushThreat(first.cipher, letter);
    win.answerLetter(letter);
  }
  const state = dbg();
  assert.equal(state.dailyLevelIndex, 1);
  assert.equal(state.queue.length, 3);
  assert.ok(state.queue.every((q) => q.cipher === second.cipher));
  const labels = { MORSE: '摩斯', PIGPEN: '朱高', BRAILLE: '點字', GRID: '座標', PHONET9: '電話 T9', SEMAPHORE: '旗號' };
  const refTitle = win.document.getElementById('daily-ref-title').textContent;
  assert.match(refTitle, /LV2\/3/, 'reference sheet switches to stage 2');
  assert.ok(refTitle.includes(labels[second.cipher]), `reference sheet names ${second.cipher}`);
  assert.equal(win.document.querySelectorAll('#daily-ref-body .daily-ref-row').length, 3);
  dom.window.close();
});

test('Stars are awarded once per date and the streak grows on consecutive days', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const pad = (n) => String(n).padStart(2, '0');
  const yKey = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

  const { dom, win } = boot({
    coachSeen: true,
    record: { stars: 20, streak: 2, lastCompleted: yKey, bestMs: 90000 },
  });
  win.startDaily();
  const first = win.awardDaily();
  assert.equal(first.firstToday, true);
  assert.equal(first.stars, 40);
  assert.equal(first.streak, 3);
  assert.equal(win.awardDaily(), null, 'replaying today must not double-award');
  assert.equal(win.document.getElementById('daily-stars').textContent, '40');
  assert.match(win.document.getElementById('btn-daily').textContent, /今日已完成/);
  dom.window.close();
});

test('three-step coach marks appear once, advance, and can be skipped', () => {
  const { dom, win } = boot();
  const overlay = win.document.getElementById('coach-overlay');
  assert.ok(!overlay.classList.contains('hidden'), 'first visit shows the tutorial');
  assert.match(win.document.getElementById('coach-title').textContent, /1 \/ 3/);
  assert.ok(!overlay.querySelector('[data-step="1"]').classList.contains('hidden'));

  win.document.getElementById('coach-next').click();
  assert.match(win.document.getElementById('coach-title').textContent, /2 \/ 3/);
  win.document.getElementById('coach-next').click();
  assert.match(win.document.getElementById('coach-title').textContent, /3 \/ 3/);
  assert.equal(win.document.getElementById('coach-next').textContent, '開始 ▶');
  win.document.getElementById('coach-next').click();
  assert.ok(overlay.classList.contains('hidden'));
  assert.equal(win.localStorage.getItem('skw_cipher_coach_seen'), '1');

  win.document.getElementById('btn-howto-start').click();
  assert.ok(!overlay.classList.contains('hidden'), 're-openable from the start screen');
  assert.match(win.document.getElementById('coach-title').textContent, /1 \/ 3/);
  win.document.getElementById('coach-skip').click();
  assert.ok(overlay.classList.contains('hidden'));
  dom.window.close();
});

test('a correct answer plays the decode reveal, and reduced motion disables it', () => {
  const normal = boot({ coachSeen: true });
  normal.win.startGame();
  normal.win.__pushThreat('MORSE', 'A');
  normal.win.answerLetter('A');
  const reveal = normal.win.document.getElementById('decode-reveal');
  assert.ok(reveal.classList.contains('show'));
  assert.match(reveal.textContent, /A/);
  assert.ok(reveal.querySelectorAll('.decode-part').length >= 3);
  normal.dom.window.close();

  const reduced = boot({ coachSeen: true, reducedMotion: true });
  reduced.win.startGame();
  reduced.win.__pushThreat('MORSE', 'A');
  reduced.win.answerLetter('A');
  assert.equal(reduced.win.document.getElementById('decode-reveal').textContent, '');
  reduced.dom.window.close();
});

test('the SCOUT-grid symbol is no longer shadowed by the floor grid function', () => {
  assert.equal((trainingHtml.match(/^function drawGrid\(/gm) || []).length, 1);
  assert.match(trainingHtml, /function drawGrid\(ctx, letter, x, y, size\)/);
  assert.match(trainingHtml, /function drawFloorGrid\(\)/);
  assert.match(trainingHtml, /drawFloorGrid\(\);/);
});

test('new daily / coach strings are translated in English mode', () => {
  const { dom, win } = boot({ coachSeen: true });
  win.SKW_I18N.setLang('en');
  const doc = win.document;
  assert.equal(doc.getElementById('daily-card').getAttribute('aria-label'), 'Daily mission');
  assert.match(doc.getElementById('btn-daily').textContent, /Play today/);
  assert.match(doc.querySelector('.daily-note').textContent, /Practice mode/);
  assert.equal(doc.getElementById('btn-daily-ref').textContent, '📖 Reference');
  assert.equal(doc.querySelector('.coach-step[data-step="1"] h2').textContent, 'Read the symbol');
  assert.equal(doc.getElementById('coach-skip').textContent, 'Skip');
  assert.equal(doc.getElementById('coach-next').textContent, 'Next ▶');
  dom.window.close();
});

test('finishing the daily mission shows its own win banner and awards Stars', async () => {
  const { dom, win } = boot({ coachSeen: true });
  win.startDaily();
  win.__forceWin();
  await new Promise((resolve) => setTimeout(resolve, 720)); // showWin() is deferred 650 ms
  const stats = win.document.getElementById('win-stats').textContent;
  assert.match(stats, /★/, 'the daily banner includes the Star award');
  assert.equal(win.document.querySelector('#screen-win .neon-title').textContent, '今日任務完成');
  assert.equal(win.document.getElementById('daily-stars').textContent, '20');
  dom.window.close();
});
