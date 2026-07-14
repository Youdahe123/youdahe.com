import { readJSON, writeJSON } from './_lib/store.js';

const DEFAULT_STATUS = 'open to chatting about systems and startups';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readJSON('status.json', { text: DEFAULT_STATUS });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string' || text.length > 200) {
      return res.status(400).json({ error: 'invalid status text' });
    }
    const trimmed = text.trim();
    await writeJSON('status.json', { text: trimmed });
    return res.status(200).json({ text: trimmed });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
