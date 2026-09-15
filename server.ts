import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { aiRouter } from './server/aiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI & Generation API routes
  app.use('/api/ai', aiRouter);

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CREOVA AI Core Engine',
      version: '0.1.0-foundation',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/system/status', (req, res) => {
    res.json({
      name: 'CREOVA AI',
      version: '0.1.0',
      phase: 'Phase 1 - Foundation Engine',
      architecture: 'Node.js Express + React 19 + TypeScript',
      databaseStatus: 'Firebase-ready (Local persistence active)',
      integrations: {
        youtube: 'Not connected yet',
        videoGeneration: 'Not connected yet',
        externalAI: 'Not connected yet',
      },
    });
  });

  // Safe Firebase Config Resolution Endpoint
  app.get('/api/firebase/config', (req, res) => {
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(raw);
        return res.json({ configured: true, config: parsed });
      }
      return res.json({
        configured: false,
        error: 'Firebase configuration is missing or could not be loaded.',
      });
    } catch (err) {
      console.error('Failed to read firebase-applet-config.json:', err);
      return res.status(500).json({
        configured: false,
        error: 'Failed to read Firebase configuration file.',
      });
    }
  });

  // Catch-all 404 for API routes so they NEVER fall through to Vite SPA HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
    });
  });

  // Global API error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error encountered:', err);
    if (req.path.startsWith('/api/')) {
      return res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
      });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CREOVA AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CREOVA AI server:', err);
  process.exit(1);
});
