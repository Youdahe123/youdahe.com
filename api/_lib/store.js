import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');

export function dataPath(name) {
  return path.join(dataDir, name);
}

export async function readJSON(name, fallback) {
  try {
    const raw = await readFile(dataPath(name), 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJSON(name, value) {
  await writeFile(dataPath(name), JSON.stringify(value, null, 2) + '\n');
}
