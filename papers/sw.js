/* Electronic-paper shell only. Never cache activity responses, answers or API calls. */
const CACHE = 'scout-paper-shell-v2';
const SHELL = '/papers/';
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const response = await fetch(SHELL, {cache:'no-store'});
  if (!response.ok) throw new Error('paper shell unavailable');
  const html = await response.clone().text();
  await cache.put(SHELL, response);
  // Vite hashes its bundles; the static deployment instead has native modules.
  const resources = new Set(['/js/qrcode.min.js','/js/jsQR.js','/js/i18n.js']);
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const url = new URL(match[1], self.location.origin);
    if (url.origin === self.location.origin && (url.pathname.startsWith('/assets/') || url.pathname === '/papers/papers.js' || url.pathname === '/papers/papers.css')) resources.add(url.pathname);
  }
  if (resources.has('/papers/papers.js')) {
    resources.add('/js/paper-codec.js'); resources.add('/shared/question-set.js');
  }
  await cache.addAll([...resources]);
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const key of await caches.keys()) if (key.startsWith('scout-paper-shell-') && key !== CACHE) await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (event.request.mode === 'navigate' && (url.pathname === '/papers/' || url.pathname === '/papers/index.html')) {
    event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(event.request);if(response.ok)await cache.put(SHELL,response.clone());return response;}catch{return (await cache.match(SHELL)) || Response.error();}})());
    return;
  }
  const allowed = url.pathname.startsWith('/assets/') || ['/papers/papers.js','/papers/papers.css','/js/paper-codec.js','/shared/question-set.js','/js/qrcode.min.js','/js/jsQR.js','/js/i18n.js'].includes(url.pathname);
  if (!allowed || url.search) return;
  event.respondWith((async()=>{const cache=await caches.open(CACHE);if(url.pathname.startsWith('/assets/')){const hit=await cache.match(event.request);if(hit)return hit;}try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch{return (await cache.match(event.request)) || Response.error();}})());
});
