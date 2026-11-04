import { test } from 'node:test';
import assert from 'node:assert/strict';
import login from '../api/leader.js';
import verify from '../api/leader-verify.js';

const secret = 'test-independent-secret-0123456789abcdef';
const env = { LEADER_PASSWORD: 'test-password', LEADER_SESSION_SECRET: secret };
function res() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(body) { this.body = JSON.parse(body); } };
}
async function request(handler, body, options, headers = {}) {
  const response = res();
  await handler({ method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body }, response, options);
  return response;
}
test('leader login requires correctly configured independent secret and password', async () => {
  assert.equal((await request(login, {password: 'test-password'}, {env: {LEADER_PASSWORD: 'test-password'}})).statusCode, 503);
  assert.equal((await request(login, {password: 'incorrect'}, {env})).statusCode, 401);
  const good = await request(login, {password: 'test-password'}, {env});
  assert.equal(good.statusCode, 200);
  assert.ok(good.body.token);
  assert.equal(good.body.durationSeconds, 86400);
  assert.equal(good.headers['Cache-Control'], 'no-store, max-age=0');
  const headers = {authorization: `Bearer ${good.body.token}`, 'x-scout-paper-worker-key': secret};
  assert.equal((await request(verify, {}, {env}, headers)).statusCode, 200);
  assert.equal((await request(verify, {}, {env: {...env, LEADER_PASSWORD: 'new-password'}}, headers)).statusCode, 401);
  assert.equal((await request(verify, {}, {env}, {...headers, 'x-scout-paper-worker-key': 'incorrect'})).statusCode, 403);
});

test('sessions expire after twenty-four hours', async () => {
  const { issueLeaderSession, verifyLeaderSession, leaderSigningSecret } = await import('../server/leader-session.js');
  const key = leaderSigningSecret(env.LEADER_PASSWORD, env);
  const start = 1700000000000;
  const token = issueLeaderSession(key, start);
  assert.equal(verifyLeaderSession(token, key, start + 24 * 60 * 60 * 1000 - 1000), true);
  assert.equal(verifyLeaderSession(token, key, start + 24 * 60 * 60 * 1000), false);
  assert.equal(verifyLeaderSession(token + 'x', key, start), false);
});
