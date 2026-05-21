import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
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
    const now    = new Date().toISOString();
    const noteId = id || Date.now().toString(36);

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
      id: noteId,
      title: title || '',
      body: body || '',
      tag: tag || 'general',
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
    if (!id) return res.status(400).json({ error: 'id required' });
    const { blobs } = await list({ prefix: `notes/${id}` });
    for (const blob of blobs) await del(blob.url);
    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
