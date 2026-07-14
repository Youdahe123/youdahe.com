import { readJSON, writeJSON } from './_lib/store.js';

const MAX_FIELD_LEN = 20_000;

function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9]+$/i.test(id) && id.length <= 24;
}

function sanitizeField(v) {
  if (typeof v !== 'string') return '';
  return v.slice(0, MAX_FIELD_LEN);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const logs = await readJSON('daily.json', []);
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.status(200).json(logs);
  }

  if (req.method === 'POST') {
    const { date, libertyMutual, medica, neetcode, youdaheDB, containerRuntime, sysDesign, startup, wins, blockers } = req.body;

    const logs = await readJSON('daily.json', []);
    const id   = Date.now().toString(36);
    const log  = {
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

    logs.push(log);
    await writeJSON('daily.json', logs);

    return res.status(201).json(log);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (!isValidId(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const logs = await readJSON('daily.json', []);
    await writeJSON('daily.json', logs.filter(l => l.id !== id));

    return res.status(200).json({ deleted: id });
  }

  return res.status(405).json({ error: 'method not allowed' });
}
