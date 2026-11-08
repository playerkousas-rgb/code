import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const PAGES = ['index.html', 'papers/index.html', 'training/index.html'];
const i18nSource = await readFile(new URL('../js/i18n.js', import.meta.url), 'utf8');
const trainingHtml = await readFile(new URL('../training/index.html', import.meta.url), 'utf8');

// Minimal 2D context: jsdom does not implement canvas, but the game only needs
// a callable surface for its drawing calls during a head-time boot.
function makeContext() {
  const gradient = { addColorStop() {} };
  const base = {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createPattern: () => ({}),
    measureText: () => ({ width: 10 }),
    getImageData: () => ({ data: [] }),
  };
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return () => {};
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

function boot(options = {}) {
  const dom = new JSDOM(trainingHtml, {
    url: 'https://scout.example/training/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const win = dom.window;
  if (options.reducedMotion) {
    win.matchMedia = (query) => ({
      media: query,
      matches: /prefers-reduced-motion/.test(query),
      addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {},
    });
  }
  if (options.devicePixelRatio) {
    Object.defineProperty(win, 'devicePixelRatio', { value: options.devicePixelRatio, configurable: true });
  }
  if (options.settings) {
    win.localStorage.setItem('skw_cipher_training_settings', JSON.stringify(options.settings));
  }
  win.CanvasRenderingContext2D = class { fill() {} };
  win.HTMLCanvasElement.prototype.getContext = () => makeContext();
  // Do not run the animation loop in a headless test.
  win.requestAnimationFrame = () => 0;
  win.eval(i18nSource);

  const scripts = [...trainingHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1])
    .filter((s) => s.includes('function startGame'));
  assert.equal(scripts.length, 1, 'the inline game script must be identifiable');
  win.eval(scripts[0]);
  return { dom, win };
}

test('W1 copyright meta is present on every page', async () => {
  for (const name of PAGES) {
    const html = await readFile(new URL(`../${name}`, import.meta.url), 'utf8');
    assert.match(html, /<meta name="copyright" content="© SCOUT SYSTEM">/, name);
  }
});

test('the game shell contains the new mobile / game-feel hooks', () => {
  assert.match(trainingHtml, /id="pause-overlay"/);
  assert.match(trainingHtml, /id="rotate-hint"/);
  assert.match(trainingHtml, /id="effectsToggle"/);
  assert.match(trainingHtml, /id="btn-fullscreen"/);
  assert.match(trainingHtml, /id="combo-meter-fill"/);
  assert.match(trainingHtml, /overscroll-behavior: none/);
  assert.match(trainingHtml, /prefers-reduced-motion: reduce/);
});

test('new UI strings have English translations in the shared dictionary', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
  dom.window.eval(i18nSource);
  const dict = dom.window.SKW_I18N._dictionary;
  for (const key of [
    '動感效果（粒子／震動／閃光）',
    '⛶ 全螢幕＋螢幕常亮',
    '⛶ 離開全螢幕',
    '已暫停',
    '▶ 繼續遊戲',
    '↻ 請把手機轉回直向',
  ]) {
    assert.ok(dict[key], `missing EN translation for ${key}`);
  }
  dom.window.close();
});

test('canvas uses devicePixelRatio so cipher symbols stay sharp on phones', () => {
  const { dom, win } = boot({ devicePixelRatio: 2 });
  const canvas = win.document.getElementById('gameCanvas');
  assert.equal(canvas.width, Math.round(win.innerWidth * 2));
  assert.equal(canvas.height, Math.round(win.innerHeight * 2));
  assert.equal(canvas.style.width, win.innerWidth + 'px');
  assert.equal(canvas.style.height, win.innerHeight + 'px');
  dom.window.close();
});

test('game feel defaults off under prefers-reduced-motion, but a saved choice wins', () => {
  const a = boot({ reducedMotion: true });
  assert.equal(a.win.document.getElementById('effectsToggle').checked, false);
  a.dom.window.close();

  const b = boot({ reducedMotion: true, settings: { effects: true } });
  assert.equal(b.win.document.getElementById('effectsToggle').checked, true);
  b.dom.window.close();

  const c = boot();
  assert.equal(c.win.document.getElementById('effectsToggle').checked, true);
  c.dom.window.close();
});

test('hiding the tab auto-pauses, and the resume button restarts play', () => {
  const { dom, win } = boot();
  const overlay = win.document.getElementById('pause-overlay');
  win.startGame();
  assert.ok(overlay.classList.contains('hidden'), 'no pause when the game is visible');

  Object.defineProperty(win.document, 'hidden', { configurable: true, get: () => true });
  win.document.dispatchEvent(new win.Event('visibilitychange'));
  assert.ok(!overlay.classList.contains('hidden'), 'switching apps must pause the session');

  Object.defineProperty(win.document, 'hidden', { configurable: true, get: () => false });
  win.document.getElementById('btn-resume').click();
  assert.ok(overlay.classList.contains('hidden'), 'resume hides the pause overlay');
  dom.window.close();
});

test('fullscreen and effects controls boot without runtime errors', () => {
  const { dom, win } = boot();
  const btn = win.document.getElementById('btn-fullscreen');
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  btn.click(); // jsdom has no Fullscreen API: must degrade silently
  assert.ok(btn.textContent.includes('全螢幕'));

  const toggle = win.document.getElementById('effectsToggle');
  toggle.checked = false;
  toggle.dispatchEvent(new win.Event('change'));
  assert.equal(
    JSON.parse(win.localStorage.getItem('skw_cipher_training_settings')).effects,
    false,
  );
  dom.window.close();
});
