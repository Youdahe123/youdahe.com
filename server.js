import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiDir = path.join(__dirname, 'api');

async function loadApiHandlers() {
  const files = await readdir(apiDir);
  const handlers = [];

  for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const route = `/api/${file.replace(/\.js$/, '')}`;
    const modulePath = pathToFileURL(path.join(apiDir, file)).href;
    const mod = await import(modulePath);

    if (typeof mod.default === 'function') {
      handlers.push({ route, handler: mod.default });
    }
  }

  return handlers;
}

async function start() {
  const app = express();
  const handlers = await loadApiHandlers();
  const port = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use((req, res, next) => {
    if (req.path === '/api/upload') return next();
    return express.json({ limit: '1mb' })(req, res, next);
  });

  for (const { route, handler } of handlers) {
    app.all(route, async (req, res) => {
      try {
        await handler(req, res);
      } catch (error) {
        console.error(`API error on ${route}:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'internal server error' });
        }
      }
    });
  }

  app.use(express.static(__dirname));

  app.listen(port, () => {
    console.log(`Local server running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start local server:', error);
  process.exit(1);
});
