import { readJSON, writeJSON } from './_lib/store.js';

const MAX_TITLE_LEN   = 300;
const MAX_CONTENT_LEN = 200_000;
const MAX_PREVIEW_LEN = 500;

function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9]+$/i.test(id) && id.length <= 24;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const posts = await readJSON('posts.json', []);
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.status(200).json(posts);
  }

  if (req.method === 'POST') {
    const { title, content, preview, date } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content required' });
    }

    const posts = await readJSON('posts.json', []);
    const id = Date.now().toString(36);
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

    posts.push(post);
    await writeJSON('posts.json', posts);

    return res.status(201).json(post);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const posts = await readJSON('posts.json', []);
    await writeJSON('posts.json', posts.filter(p => p.id !== id));

    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
