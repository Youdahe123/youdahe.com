import { put, list, del } from '@vercel/blob';
import crypto from 'crypto';

const ALLOWED_ORIGIN = 'https://youdahe.com';
const VALID_TAGS     = new Set(['general', 'goals', 'learning', 'objectives', 'ideas']);
const MAX_TITLE_LEN  = 200;
const MAX_BODY_LEN   = 50_000;

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
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!checkAuth(req.headers['x-admin-password'])) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'notes/' });
      const notes = await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json())));
      notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.status(200).json(notes);
    } catch {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    const { id, title, body, tag } = req.body;

    if (id !== undefined && !isValidId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const now    = new Date().toISOString();
    const noteId = id || Date.now().toString(36);
    const safeTag = VALID_TAGS.has(tag) ? tag : 'general';

    let createdAt = now;
    if (id) {
      try {
        const { blobs } = await list({ prefix: `notes/${id}.json` });
        if (blobs.length) {
          const existing = await fetch(blobs[0].url).then(r => r.json());
          createdAt = existing.createdAt || now;
          await del(blobs[0].url);
        }
      } catch {}
    }

    const note = {
      id:        noteId,
      title:     typeof title === 'string' ? title.slice(0, MAX_TITLE_LEN) : '',
      body:      typeof body  === 'string' ? body.slice(0, MAX_BODY_LEN)   : '',
      tag:       safeTag,
      createdAt,
      updatedAt: now,
    };

    await put(`notes/${noteId}.json`, JSON.stringify(note), {
      contentType: 'application/json',
      access: 'public',
    });

    return res.status(201).json(note);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { blobs } = await list({ prefix: `notes/${id}.json` });
    for (const blob of blobs) await del(blob.url);

    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
