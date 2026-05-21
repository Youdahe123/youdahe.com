import { put } from '@vercel/blob';
import crypto from 'crypto';

export const config = {
  api: { bodyParser: false },
};

const ALLOWED_ORIGIN  = 'https://youdahe.com';
const ALLOWED_TYPES   = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']);
const MAX_SIZE        = 5 * 1024 * 1024; // 5 MB

function checkAuth(provided) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided), b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password, x-filename');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  if (!checkAuth(req.headers['x-admin-password'])) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Validate content type — only images allowed
  const rawType  = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(rawType)) {
    return res.status(400).json({ error: 'unsupported file type' });
  }

  // Sanitize filename — strip path separators and special chars
  const rawName  = req.headers['x-filename'] || `image-${Date.now()}`;
  const filename = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '_').slice(0, 80);

  // Stream body with size limit
  const chunks = [];
  let totalSize = 0;
  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > MAX_SIZE) {
      return res.status(413).json({ error: 'file too large (max 5 MB)' });
    }
    chunks.push(chunk);
  }

  const buffer = Buffer.concat(chunks);
  const blob   = await put(`images/${Date.now()}-${filename}`, buffer, {
    access:      'public',
    contentType: rawType,
  });

  return res.status(200).json({ url: blob.url });
}
