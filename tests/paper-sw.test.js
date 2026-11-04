import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('paper service worker caches shell only and never intercepts activity APIs', async()=>{
 const script=await readFile(new URL('../papers/sw.js',import.meta.url),'utf8');
 for(const html of [await readFile(new URL('../papers/index.html',import.meta.url),'utf8'),'<html><link href="/assets/style-ab.css"><script type="module" src="/assets/paper-ab.js"></script><link rel="modulepreload" href="/assets/preload-ab.js"><script src="/js/jsQR.js"></script><script src="/js/qrcode.min.js"></script></html>']){
  const listeners={}, values=new Map();let offline=false;
  const key=req=>typeof req==='string'?new URL(req,'https://scout.example').pathname:new URL(req.url).pathname;
  const cache={async put(req,res){values.set(key(req),res)},async match(req){return values.get(key(req))?.clone()},async addAll(paths){for(const path of paths){const r=await fakeFetch(path);if(!r.ok)throw Error();await this.put(path,r)}}};
  const fakeFetch=async req=>{if(offline)throw Error('offline');return new Response(key(req)==='/papers/'?html:'asset',{status:200})};
  const context={self:{location:{origin:'https://scout.example'},addEventListener(n,fn){listeners[n]=fn},skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>[],delete:async()=>{}},fetch:fakeFetch,URL,Response};
  vm.runInNewContext(script,context);
  let job;listeners.install({waitUntil(p){job=p}});await job;
  assert.ok(values.has('/papers/'));assert.ok(values.has('/js/jsQR.js'));assert.ok(values.has('/js/qrcode.min.js'));
  if(html.includes('/papers/papers.js'))assert.ok(values.has('/shared/question-set.js'));
  else assert.ok(values.has('/assets/paper-ab.js'));
  offline=true;let reply;
  listeners.fetch({request:{method:'GET',mode:'navigate',url:'https://scout.example/papers/?activity=xyz'},respondWith(p){reply=p}});
  assert.equal(await (await reply).text(),html);
  let intercepted=false;listeners.fetch({request:{method:'GET',mode:'cors',url:'https://scout.example/api/activity?id=xyz'},respondWith(){intercepted=true}});assert.equal(intercepted,false);
 }
});
