import { readJSON, writeJSON } from './_lib/store.js';

const VALID_TAGS    = new Set(['general', 'goals', 'learning', 'objectives', 'ideas']);
const MAX_TITLE_LEN  = 200;
const MAX_BODY_LEN   = 50_000;

function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9]+$/i.test(id) && id.length <= 24;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const notes = await readJSON('notes.json', []);
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return res.status(200).json(notes);
  }

  if (req.method === 'POST') {
    const { id, title, body, tag } = req.body;

    if (id !== undefined && !isValidId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const notes    = await readJSON('notes.json', []);
    const now      = new Date().toISOString();
    const noteId   = id || Date.now().toString(36);
    const safeTag  = VALID_TAGS.has(tag) ? tag : 'general';
    const existing = notes.find(n => n.id === noteId);

    const note = {
      id:        noteId,
      title:     typeof title === 'string' ? title.slice(0, MAX_TITLE_LEN) : '',
      body:      typeof body  === 'string' ? body.slice(0, MAX_BODY_LEN)   : '',
      tag:       safeTag,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const next = notes.filter(n => n.id !== noteId);
    next.push(note);
    await writeJSON('notes.json', next);

    return res.status(201).json(note);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const notes = await readJSON('notes.json', []);
    await writeJSON('notes.json', notes.filter(n => n.id !== id));

    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
