import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const CJK = /[\u3400-\u9fff]/;
const PAGES = ['index.html', 'papers/index.html', 'training/index.html'];
const i18nSource = await readFile(new URL('../js/i18n.js', import.meta.url), 'utf8');

function boot(html, { url = 'https://scout.example/', storedLang } = {}) {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;
  if (storedLang) win.localStorage.setItem('skw_ui_lang', storedLang);
  win.eval(i18nSource);
  return { dom, win, api: win.SKW_I18N };
}

async function page(name) {
  return readFile(new URL(`../${name}`, import.meta.url), 'utf8');
}

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));

test('every page loads the shared i18n script and offers a language switch', async () => {
  for (const name of PAGES) {
    const html = await page(name);
    assert.match(html, /<script src="\/js\/i18n\.js"><\/script>/, `${name} must load the dictionary`);
    assert.match(html, /data-lang-switch/, `${name} must expose a language toggle`);
    assert.match(html, /© 2026 Scout System · 版權所有 \/ All rights reserved/, `${name} must show the copyright`);
  }
});

test('default is Traditional Chinese; English is applied and can be restored', async () => {
  const html = await page('index.html');
  const { win, api, dom } = boot(html);
  assert.equal(api.getLang(), 'zh-Hant');
  assert.equal(win.document.getElementById('btnExportPDF').textContent.trim(), '🖨 列印試卷');
  assert.equal(win.document.documentElement.lang, 'zh-Hant');

  api.setLang('en');
  assert.equal(api.getLang(), 'en');
  assert.equal(win.document.documentElement.lang, 'en');
  assert.equal(win.document.getElementById('btnExportPDF').textContent.trim(), '🖨 Print Exam');
  assert.equal(win.document.querySelector('title').textContent, 'Cipher & Semaphore Toolkit | Scout System');
  assert.equal(win.document.querySelector('meta[name=description]').getAttribute('content'),
    'Scout System cipher toolkit: encode messages, build exam papers, run buzz quizzes and play training games.');
  assert.equal(win.document.querySelector('textarea#inputText').getAttribute('placeholder'), 'e.g. BE PREPARED');
  assert.equal(win.document.getElementById('langSwitch').getAttribute('aria-pressed'), 'true');
  assert.equal(win.document.querySelector('#langSwitch [data-lang-label]').textContent, '繁');
  assert.equal(win.localStorage.getItem('skw_ui_lang'), 'en');

  api.setLang('zh-Hant');
  assert.equal(win.document.getElementById('btnExportPDF').textContent.trim(), '🖨 列印試卷');
  assert.equal(win.document.querySelector('title').textContent, '密碼旗號助手｜Scout System');
  assert.equal(win.document.querySelector('#langSwitch [data-lang-label]').textContent, 'EN');
  dom.window.close();
});

test('stored language and ?lang=en are honoured on a fresh page', async () => {
  const html = await page('papers/index.html');
  const a = boot(html, { storedLang: 'en' });
  assert.equal(a.api.getLang(), 'en');
  await wait(); // DOMContentLoaded finishes the initial translation sweep
  assert.equal(a.win.document.getElementById('memberTab').textContent, 'Member');
  assert.equal(a.win.document.documentElement.lang, 'en');
  a.dom.window.close();

  const b = boot(html, { url: 'https://scout.example/papers/?lang=en' });
  assert.equal(b.api.getLang(), 'en');
  await wait();
  assert.equal(b.win.document.getElementById('memberTab').textContent, 'Member');
  b.dom.window.close();
});

test('all static Chinese UI strings have a complete English translation', async () => {
  const { api, dom } = boot('<!doctype html><html lang="zh-Hant"><head></head><body></body></html>');
  api.setLang('en');
  const misses = [];
  for (const name of PAGES) {
    const html = await page(name);
    const doc = new JSDOM(html).window.document;
    const walker = doc.createTreeWalker(doc.documentElement, dom.window.NodeFilter.SHOW_TEXT);
    const strings = new Set();
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE'].includes(parent.tagName)) continue;
      if (parent.closest('[data-i18n-skip]')) continue;
      const text = node.nodeValue.trim().replace(/\s+/g, ' ');
      if (text && CJK.test(text)) strings.add(text);
    }
    for (const el of doc.querySelectorAll('*')) {
      if (el.closest('[data-i18n-skip]')) continue;
      for (const attr of [...el.attributes]) {
        if (['placeholder', 'title', 'aria-label', 'alt', 'content'].includes(attr.name) && CJK.test(attr.value)) {
          strings.add(attr.value.trim());
        }
      }
    }
    for (const source of strings) {
      const translated = api.t(source);
      if (CJK.test(translated)) misses.push(`${name}: ${source} -> ${translated}`);
    }
  }
  assert.deepEqual(misses, [], 'no Chinese characters may remain in static UI text');
  dom.window.close();
});

test('dynamically inserted content is translated; user data marked skip is untouched', async () => {
  const { win, api, dom } = boot('<!doctype html><html lang="zh-Hant"><head></head><body><div id="root"></div></body></html>');
  api.setLang('en');
  const root = win.document.getElementById('root');
  root.innerHTML = '<p>試卷還未有題目</p><span data-i18n-skip>試卷</span><input placeholder="輸入姓名" aria-label="輸入姓名"><button title="清除">清除</button>';
  await wait();
  assert.equal(root.querySelector('p').textContent, 'No questions yet');
  assert.equal(root.querySelector('span').textContent, '試卷', 'user-authored text is never rewritten');
  assert.equal(root.querySelector('input').getAttribute('placeholder'), 'Enter your name');
  assert.equal(root.querySelector('input').getAttribute('aria-label'), 'Enter your name');
  assert.equal(root.querySelector('button').getAttribute('title'), 'Clear');
  assert.equal(root.querySelector('button').textContent, 'Clear');
  api.setLang('zh-Hant');
  assert.equal(root.querySelector('p').textContent, '試卷還未有題目');
  assert.equal(root.querySelector('button').textContent, '清除');
  assert.equal(root.querySelector('input').getAttribute('placeholder'), '輸入姓名');
  dom.window.close();
});

test('English exam paper, decoder sheets and answer key strings', async () => {
  const { api, dom } = boot('<!doctype html><html><head></head><body></body></html>');
  api.setLang('en');
  const expected = [
    ['童軍密碼考核試卷', 'Scout Cipher Examination'],
    ['姓名: __________________', 'Name: __________________'],
    ['試卷參考答案', 'Exam Answer Key'],
    ['列印日期:', 'Print date:'],
    ['Q1. 翻譯以下密碼 (Morse)：', 'Q1. Decode the following Morse cipher:'],
    ['Q2. 將以下文字寫成 Semaphore：', 'Q2. Write the following text in Semaphore:'],
    ['↑ 請用 摩斯密碼 表示 ↑', '↑ Write the above in Morse Code ↑'],
    ['解碼紙：旗號對照表', 'Decoder Sheet: Semaphore Reference'],
    ['英文字母移位列', 'Alphabet shift strips'],
    ['原文字', 'Plain text'],
    ['參考答案', 'Answer'],
    ['倒轉題', 'Reverse question'],
    ['（聽力考核項目）', '(Audio assessment item)'],
    ['5 題 · 題組版本 2 · 連網活動，版本 3', '5 questions · set version 2 · online activity, version 3'],
    ['第 3 題 · 用摩斯密碼表示', 'Question 3 · Write in Morse Code']
  ];
  for (const [source, english] of expected) assert.equal(api.t(source), english);
  assert.equal(api.locale(), 'en-GB');
  dom.window.close();
});

test('copyright footer is on both sheets, uses © wording and repeats on every printed page', async () => {
  const html = await page('index.html');
  const css = await readFile(new URL('../css/style.css', import.meta.url), 'utf8');
  const doc = new JSDOM(html).window.document;

  assert.doesNotMatch(html, /COPY RIGHT/, 'the old misspelled notice is gone');
  const examFooter = doc.querySelector('#printExamSheet .print-footer');
  const answerFooter = doc.querySelector('#printAnswerSheet .print-footer');
  assert.ok(examFooter && answerFooter, 'both exam and answer sheets carry a footer');
  for (const footer of [examFooter, answerFooter]) {
    assert.match(footer.textContent, /© 2026 Scout System/);
    assert.match(footer.textContent, /版權所有 \/ All rights reserved/);
    assert.equal(footer.hasAttribute('data-i18n-skip'), true, 'bilingual notice stays identical in both languages');
  }
  assert.match(answerFooter.textContent, /CONFIDENTIAL/);

  const printBlock = css.slice(css.indexOf('@media print'), css.indexOf('/* ===== Print screen styles'));
  assert.match(printBlock, /\.print-footer\s*\{[^}]*position:\s*fixed\s*!important/s,
    'fixed footer repeats at the bottom of every printed page');
  assert.match(printBlock, /margin:\s*20mm 15mm 26mm/, 'bottom page margin reserves room for the footer');
});

test('main app runs and prints a fully English exam paper in English mode', async (t) => {
  const html = await page('index.html');
  const dom = new JSDOM(html, { url: 'https://scout.example/', runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;
  const saved = new Map();
  for (const key of ['window', 'document', 'location', 'localStorage', 'navigator', 'URL', 'URLSearchParams', 'MutationObserver', 'CustomEvent', 'NodeFilter']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value: win[key], configurable: true, writable: true });
  }
  t.after(() => {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    dom.window.close();
  });
  win.matchMedia = () => ({ matches: false });
  win.scrollTo = () => {};
  win.alert = () => {};
  win.confirm = () => true;
  win.print = () => {};
  win.localStorage.setItem('skw_test_questions', JSON.stringify([
    { id: 1, text: 'SOS', type: 'Morse', display: 'static', direction: 'encode', includeDecoder: true },
    { id: 2, text: 'BE PREPARED', type: 'Semaphore', display: 'static', direction: 'decode' }
  ]));
  win.eval(i18nSource);
  win.SKW_I18N.setLang('en');
  win.eval(await readFile(new URL('../js/app.js', import.meta.url), 'utf8'));
  win.document.dispatchEvent(new win.Event('DOMContentLoaded'));
  const doc = win.document;
  assert.equal(doc.getElementById('currentModeTitle').textContent, 'Cipher Tools');
  assert.equal(doc.getElementById('btnExportPDF').textContent.trim(), '🖨 Print Exam');

  doc.getElementById('btnExportPDF').click();
  assert.equal(doc.querySelector('#printQuestions b').textContent, 'Q1. Decode the following Morse cipher:');
  assert.equal(doc.querySelectorAll('#printQuestions b')[1].textContent, 'Q2. Write the following text in Semaphore:');
  assert.equal(doc.querySelector('.print-decoder-sheet h2').textContent, 'Decoder Sheet: Morse Code and Alphabet');
  assert.equal(doc.querySelector('.print-info-area p').textContent, 'Name: __________________');
  assert.match(doc.querySelector('#printExamSheet .print-footer').textContent, /© 2026 Scout System/);

  doc.getElementById('btnPrintAnswers').click();
  assert.equal(doc.querySelector('#printAnswerSheet .print-title').textContent, 'Exam Answer Key');
  assert.equal(doc.querySelector('.answer-label').textContent, 'Plain text');
});
