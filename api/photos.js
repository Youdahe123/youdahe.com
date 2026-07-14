import { readJSON, writeJSON } from './_lib/store.js';
import crypto from 'crypto';

const MAX_URL_LEN = 500;

function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9]+$/i.test(id) && id.length <= 24;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const photos = await readJSON('photos.json', []);
    photos.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    return res.status(200).json(photos);
  }

  if (req.method === 'POST') {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string' || url.length > MAX_URL_LEN) {
      return res.status(400).json({ error: 'invalid url' });
    }

    const photos = await readJSON('photos.json', []);
    const id     = crypto.randomBytes(8).toString('hex');
    const entry  = { id, url, addedAt: new Date().toISOString() };

    photos.push(entry);
    await writeJSON('photos.json', photos);

    return res.status(200).json(entry);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query || {};
    if (!isValidId(id)) return res.status(400).json({ error: 'invalid id' });

    const photos = await readJSON('photos.json', []);
    const next   = photos.filter(p => p.id !== id);
    if (next.length === photos.length) return res.status(404).json({ error: 'not found' });

    await writeJSON('photos.json', next);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
