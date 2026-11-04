import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const SESSION_SECONDS = 24 * 60 * 60;
// Independent secret and password both contribute to this application's key.
// Missing secrets must fail closed; sessions are scoped to this application.
export function leaderSigningSecret(password, env = process.env) {
  if (!env.LEADER_SESSION_SECRET || !password) return '';
  return createHmac('sha256', env.LEADER_SESSION_SECRET).update('scout-paper-signing-key-v1:').update(password).digest('hex');
}
function signature(payload, secret) {
  return createHmac('sha256', secret).update('scout-paper-leader-session-v1:').update(payload).digest();
}
export function issueLeaderSession(secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + SESSION_SECONDS, nonce: randomBytes(16).toString('base64url') })).toString('base64url');
  return `${payload}.${signature(payload, secret).toString('base64url')}`;
}
export function verifyLeaderSession(token, secret, now = Date.now()) {
  if (!secret || typeof token !== 'string' || token.length > 512) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1])) return false;
  try {
    const actual = Buffer.from(parts[1], 'base64url');
    const expected = signature(parts[0], secret);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const current = Math.floor(now / 1000);
    return Number.isSafeInteger(data.exp) && data.exp > current && data.exp <= current + SESSION_SECONDS
      && typeof data.nonce === 'string' && data.nonce.length >= 20;
  } catch { return false; }
}
