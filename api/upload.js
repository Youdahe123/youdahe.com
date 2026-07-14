import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const config = {
  api: { bodyParser: false },
};

const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'images', 'uploads');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']);
const MAX_SIZE       = 5 * 1024 * 1024; // 5 MB

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  const rawType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(rawType)) {
    return res.status(400).json({ error: 'unsupported file type' });
  }

  const rawName  = req.headers['x-filename'] || `image-${Date.now()}`;
  const filename = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '_').slice(0, 80);

  const chunks = [];
  let totalSize = 0;
  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > MAX_SIZE) {
      return res.status(413).json({ error: 'file too large (max 5 MB)' });
    }
    chunks.push(chunk);
  }

  const buffer    = Buffer.concat(chunks);
  const savedName = `${Date.now()}-${filename}`;

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, savedName), buffer);

  return res.status(200).json({ url: `/images/uploads/${savedName}` });
}
