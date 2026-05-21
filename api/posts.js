import { put, list, del } from '@vercel/blob';
import crypto from 'crypto';

const ALLOWED_ORIGIN  = 'https://youdahe.com';
const MAX_TITLE_LEN   = 300;
const MAX_CONTENT_LEN = 200_000;
const MAX_PREVIEW_LEN = 500;

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

  // GET is public — any origin may read posts
  if (req.method === 'GET') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    try {
      const { blobs } = await list({ prefix: 'posts/' });
      const posts = await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json())));
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json(posts);
    } catch {
      return res.status(200).json([]);
    }
  }

  // All write operations require auth and restrict origin
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  if (!checkAuth(req.headers['x-admin-password'])) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.method === 'POST') {
    const { title, content, preview, date } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content required' });
    }

    const id   = Date.now().toString(36);
    const safeTitle   = String(title).slice(0, MAX_TITLE_LEN);
    const safeContent = String(content).slice(0, MAX_CONTENT_LEN);
    const safePreview = preview ? String(preview).slice(0, MAX_PREVIEW_LEN) : safeContent.slice(0, 200);

    const post = {
      id,
      title:   safeTitle,
      content: safeContent,
      preview: safePreview,
      date:    date || new Date().toISOString(),
    };

    await put(`posts/${id}.json`, JSON.stringify(post), {
      contentType: 'application/json',
      access: 'public',
    });

    return res.status(201).json(post);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { blobs } = await list({ prefix: `posts/${id}.json` });
    for (const blob of blobs) await del(blob.url);

    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
