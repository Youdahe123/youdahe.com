import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const postId = req.query.postId;
  if (!postId) return res.status(400).json({ error: 'postId required' });

  const blobKey = `comments/${postId}.json`;

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: blobKey });
      if (blobs.length === 0) return res.status(200).json([]);
      const response = await fetch(blobs[0].url);
      const comments = await response.json();
      return res.status(200).json(comments);
    } catch {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    const { name, text } = req.body;
    if (!name || !text) {
      return res.status(400).json({ error: 'name and text required' });
    }

    let comments = [];
    try {
      const { blobs } = await list({ prefix: blobKey });
      if (blobs.length > 0) {
        const response = await fetch(blobs[0].url);
        comments = await response.json();
      }
    } catch {}

    comments.push({
      id: Date.now().toString(36),
      name,
      text,
      date: new Date().toISOString(),
    });

    await put(blobKey, JSON.stringify(comments), {
      contentType: 'application/json',
      access: 'public',
    });

    return res.status(201).json(comments);
  }

  return res.status(405).json({ error: 'method not allowed' });
}
