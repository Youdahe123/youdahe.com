import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'posts/' });
      const posts = [];

      for (const blob of blobs) {
        const response = await fetch(blob.url);
        const post = await response.json();
        posts.push(post);
      }

      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json(posts);
    } catch {
      return res.status(200).json([]);
    }
  }

  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.method === 'POST') {
    const { title, content, preview } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content required' });
    }

    const id = Date.now().toString(36);
    const post = {
      id,
      title,
      content,
      preview: preview || content.slice(0, 200),
      date: new Date().toISOString(),
    };

    await put(`posts/${id}.json`, JSON.stringify(post), {
      contentType: 'application/json',
      access: 'public',
    });

    return res.status(201).json(post);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }

    const { blobs } = await list({ prefix: `posts/${id}` });

    for (const blob of blobs) {
      await del(blob.url);
    }

    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
