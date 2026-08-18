import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app';

const PORT = Number(process.env.PORT) || 3001;
const frontendDist = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../frontend/dist'
);

if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on http://localhost:${PORT}`);
  if (existsSync(frontendDist)) {
    console.log(`Serving frontend from ${frontendDist}`);
  }
});
