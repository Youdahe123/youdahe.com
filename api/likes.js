import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const postId = req.query.postId;
  if (!postId) return res.status(400).json({ error: 'postId required' });

  const blobKey = `likes/${postId}.json`;

  async function getLikes() {
    try {
      const { blobs } = await list({ prefix: blobKey });
      if (blobs.length === 0) return 0;
      const response = await fetch(blobs[0].url);
      const data = await response.json();
      return data.count || 0;
    } catch {
      return 0;
    }
  }

  if (req.method === 'GET') {
    const count = await getLikes();
    return res.status(200).json({ count });
  }

  if (req.method === 'POST') {
    const count = await getLikes();
    const newCount = count + 1;

    await put(blobKey, JSON.stringify({ count: newCount }), {
      contentType: 'application/json',
      access: 'public',
    });

    return res.status(200).json({ count: newCount });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
