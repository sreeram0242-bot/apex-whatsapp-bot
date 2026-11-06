import express from 'express';
import cors from 'cors';
import path from 'node:path';
import apiRoutes from './api/routes.js';
import { initWhatsApp } from './whatsapp/client.js';

// Prevent unhandled errors from terminating the Node process
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const publicDir = path.join(import.meta.dirname, 'public');
const assetsDir = path.resolve('assets');
const uploadsDir = path.resolve('uploads');

// Ensure uploads directories exist
import('node:fs').then(fs => {
  fs.mkdirSync(path.join(uploadsDir, 'products'), { recursive: true });
});

// Explicit static serving with proper Content-Type & cache headers (disabled caching for instant reload)
app.use(express.static(publicDir, {
  maxAge: 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));
app.use('/assets', express.static(assetsDir));
app.use('/uploads', express.static(uploadsDir));

// Mount API routes
app.use('/api', apiRoutes);

// Fallback to Admin Panel ONLY for HTML page navigations (never for missing .css, .js, or assets)
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.includes('.') && !req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(path.join(publicDir, 'index.html'));
  }
  res.status(404).send('Not Found');
});

// Start Express server and Baileys WhatsApp client
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`  📸 PHOTO STUDIO WHATSAPP BOT & ADMIN PANEL RUNNING`);
  console.log(`  Admin Panel URL: http://localhost:${PORT}`);
  console.log(`======================================================\n`);

  try {
    await initWhatsApp();
  } catch (err) {
    console.error('[Main] Failed to initialize WhatsApp engine:', err);
  }
});
