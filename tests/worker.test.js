import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';

const env = {ALLOWED_ORIGINS:'https://scout.example', ACTIVITY_DB:{}};
test('Worker applies explicit origin rules and rejects unverified writes', async () => {
  let r = await worker.fetch(new Request('https://worker.example/api/activity', {method:'OPTIONS',headers:{Origin:'https://evil.example'}}),env);
  assert.equal(r.status,403);
  r = await worker.fetch(new Request('https://worker.example/api/activity', {method:'OPTIONS',headers:{Origin:'https://scout.example'}}),env);
  assert.equal(r.status,204);
  assert.equal(r.headers.get('access-control-allow-origin'),'https://scout.example');
  r = await worker.fetch(new Request('https://worker.example/api/activity',{method:'POST',headers:{Origin:'https://scout.example','Content-Type':'application/json'},body:'{}'}),env);
  assert.equal(r.status,503);
  assert.equal((await r.json()).error,'leader_not_configured');
});
