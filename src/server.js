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
app.use(express.json());

// Serve static frontend, assets and uploaded customer photos
app.use(express.static(path.resolve('src/public')));
app.use('/assets', express.static(path.resolve('assets')));
app.use('/uploads', express.static(path.resolve('uploads')));

// Mount API routes
app.use('/api', apiRoutes);

// Fallback to Admin Panel for SPA routing
app.use((req, res) => {
  res.sendFile(path.resolve('src/public/index.html'));
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
