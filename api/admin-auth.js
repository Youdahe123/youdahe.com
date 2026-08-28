import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000;

// In-memory only; resets on server restart, which is fine for a
// local-only admin tool with a single operator.
const sessions = new Map();       // token -> expiresAt
const failedAttempts = new Map(); // ip -> { count, lockUntil }

function getCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

function isValidSession(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

// Fixed-length digest comparison so neither the match/mismatch outcome
// nor the timing depends on the length or content of the input.
function safeCompare(a, b) {
  const digestA = createHash('sha256').update(String(a)).digest();
  const digestB = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(digestA, digestB);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const token = getCookie(req, COOKIE_NAME);
    return res.status(200).json({ authenticated: isValidSession(token) });
  }

  if (req.method === 'POST') {
    const configured = process.env.ADMIN_PASSWORD;
    if (!configured) {
      return res.status(500).json({ error: 'admin auth not configured' });
    }

    const ip = req.ip || 'unknown';
    const attempt = failedAttempts.get(ip);
    if (attempt && attempt.lockUntil > Date.now()) {
      return res.status(429).json({ error: 'too many attempts, try again shortly' });
    }

    const { password } = req.body || {};
    const valid = typeof password === 'string' && password.length <= 200 && safeCompare(password, configured);

    if (!valid) {
      const count = (attempt?.count || 0) + 1;
      failedAttempts.set(ip, {
        count: count >= MAX_ATTEMPTS ? 0 : count,
        lockUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0,
      });
      return res.status(401).json({ error: 'invalid credentials' });
    }

    failedAttempts.delete(ip);

    const token = randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL_MS);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: req.secure,
      path: '/',
      maxAge: SESSION_TTL_MS,
    });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const token = getCookie(req, COOKIE_NAME);
    if (token) sessions.delete(token);
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
