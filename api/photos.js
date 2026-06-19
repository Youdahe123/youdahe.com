import { put, list, del } from '@vercel/blob';
import crypto from 'crypto';

const ALLOWED_ORIGIN = 'https://youdahe.com';
const MAX_URL_LEN = 500;

function checkAuth(provided) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided), b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9]+$/i.test(id) && id.length <= 24;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const { blobs } = await list({ prefix: 'gallery/' });
      const photos = await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json())));
      photos.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
      return res.status(200).json(photos);
    } catch {
      return res.status(200).json([]);
    }
  }

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  if (!checkAuth(req.headers['x-admin-password'])) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.method === 'POST') {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || url.length > MAX_URL_LEN) {
      return res.status(400).json({ error: 'invalid url' });
    }
    const id = crypto.randomBytes(8).toString('hex');
    const entry = { id, url, addedAt: new Date().toISOString() };
    await put(`gallery/${id}.json`, JSON.stringify(entry), {
      access: 'public',
      contentType: 'application/json',
    });
    return res.status(200).json(entry);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (!isValidId(id)) return res.status(400).json({ error: 'invalid id' });
    const { blobs } = await list({ prefix: `gallery/${id}` });
    if (blobs.length === 0) return res.status(404).json({ error: 'not found' });
    await del(blobs[0].url);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
