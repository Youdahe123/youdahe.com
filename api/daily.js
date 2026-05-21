import { put, list, del } from '@vercel/blob';
import crypto from 'crypto';

const ALLOWED_ORIGIN = 'https://youdahe.com';
const MAX_FIELD_LEN  = 20_000;

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

function sanitizeField(v) {
  if (typeof v !== 'string') return '';
  return v.slice(0, MAX_FIELD_LEN);
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
      const { blobs } = await list({ prefix: 'daily/' });
      const logs = await Promise.all(blobs.map(b => fetch(b.url).then(r => r.json())));
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json(logs);
    } catch {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    const { date, libertyMutual, medica, neetcode, youdaheDB, containerRuntime, sysDesign, startup, wins, blockers } = req.body;

    const id  = Date.now().toString(36);
    const log = {
      id,
      date: date || new Date().toISOString(),
      libertyMutual:    sanitizeField(libertyMutual),
      medica:           sanitizeField(medica),
      neetcode:         sanitizeField(neetcode),
      youdaheDB:        sanitizeField(youdaheDB),
      containerRuntime: sanitizeField(containerRuntime),
      sysDesign:        sanitizeField(sysDesign),
      startup:          sanitizeField(startup),
      wins:             sanitizeField(wins),
      blockers:         sanitizeField(blockers),
    };

    await put(`daily/${id}.json`, JSON.stringify(log), {
      contentType: 'application/json',
      access: 'public',
    });

    return res.status(201).json(log);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { blobs } = await list({ prefix: `daily/${id}.json` });
    for (const blob of blobs) await del(blob.url);

    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
