import { put, list } from '@vercel/blob';
import crypto from 'crypto';

const ALLOWED_ORIGIN = 'https://youdahe.com';
const STATUS_KEY = 'status/current.json';
const DEFAULT_STATUS = 'open to chatting about systems and startups';

function checkAuth(provided) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided), b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const { blobs } = await list({ prefix: 'status/' });
      if (blobs.length === 0) return res.status(200).json({ text: DEFAULT_STATUS });
      const data = await fetch(blobs[0].url).then(r => r.json());
      return res.status(200).json(data);
    } catch {
      return res.status(200).json({ text: DEFAULT_STATUS });
    }
  }

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  if (req.method === 'POST') {
    if (!checkAuth(req.headers['x-admin-password'])) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const { text } = req.body || {};
    if (!text || typeof text !== 'string' || text.length > 200) {
      return res.status(400).json({ error: 'invalid status text' });
    }
    await put(STATUS_KEY, JSON.stringify({ text: text.trim() }), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return res.status(200).json({ text: text.trim() });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
