import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const password = req.headers['x-admin-password'];
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: 'daily/' });
      const logs = [];

      for (const blob of blobs) {
        const response = await fetch(blob.url);
        const log = await response.json();
        logs.push(log);
      }

      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json(logs);
    } catch {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    const { date, libertyMutual, medica, neetcode, youdaheDB, containerRuntime, sysDesign, startup, wins, blockers } = req.body;

    const id = Date.now().toString(36);
    const log = {
      id,
      date: date || new Date().toISOString(),
      libertyMutual: libertyMutual || '',
      medica: medica || '',
      neetcode: neetcode || '',
      youdaheDB: youdaheDB || '',
      containerRuntime: containerRuntime || '',
      sysDesign: sysDesign || '',
      startup: startup || '',
      wins: wins || '',
      blockers: blockers || '',
    };

    await put(`daily/${id}.json`, JSON.stringify(log), {
      contentType: 'application/json',
      access: 'public',
    });

    return res.status(201).json(log);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'id required' });
    }

    const { blobs } = await list({ prefix: `daily/${id}` });

    for (const blob of blobs) {
      await del(blob.url);
    }

    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
