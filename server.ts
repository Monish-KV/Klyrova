import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const FASTAPI_PORT = 8001;

let fastApiProcess: ChildProcess | null = null;
let isFastApiReady = false;

function startFastApiServer() {
  console.log(`[GuardianPay AI] Spawning Python FastAPI backend on port ${FASTAPI_PORT}...`);

  fastApiProcess = spawn(
    'python3',
    ['-m', 'uvicorn', 'backend.app.main:app', '--host', '127.0.0.1', '--port', `${FASTAPI_PORT}`],
    {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: `${FASTAPI_PORT}`, PYTHONPATH: process.cwd() },
    }
  );

  fastApiProcess.stdout?.on('data', (data) => {
    const msg = data.toString();
    process.stdout.write(`[FastAPI] ${msg}`);
    if (msg.includes('Application startup complete') || msg.includes('Uvicorn running')) {
      isFastApiReady = true;
    }
  });

  fastApiProcess.stderr?.on('data', (data) => {
    process.stderr.write(`[FastAPI] ${data.toString()}`);
  });

  fastApiProcess.on('error', (err) => {
    console.error('[GuardianPay AI] Error starting FastAPI child process:', err);
  });

  fastApiProcess.on('exit', (code, signal) => {
    console.log(`[GuardianPay AI] FastAPI child process exited with code ${code}, signal ${signal}`);
    isFastApiReady = false;
  });
}

// Clean up child process when Node process exits
function cleanup() {
  if (fastApiProcess && !fastApiProcess.killed) {
    try {
      fastApiProcess.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});
process.on('exit', () => {
  cleanup();
});

// Proxy function to forward requests to the FastAPI backend
function proxyRequestToFastApi(req: express.Request, res: express.Response, targetPath?: string, attempt = 1) {
  const options: http.RequestOptions = {
    hostname: '127.0.0.1',
    port: FASTAPI_PORT,
    path: targetPath || req.originalUrl,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${FASTAPI_PORT}`,
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    if (attempt <= 6) {
      // Retry for up to 3 seconds while FastAPI boots
      setTimeout(() => {
        proxyRequestToFastApi(req, res, targetPath, attempt + 1);
      }, 500);
      return;
    }

    console.warn(`[GuardianPay AI Proxy] Connection failed to FastAPI (${options.path}):`, err.message);
    if (!res.headersSent) {
      res.status(503).json({
        error: 'GuardianPay AI FastAPI backend is starting up. Please refresh or retry in a few seconds.',
        detail: err.message,
      });
    }
  });

  req.pipe(proxyReq, { end: true });
}

app.use(cors());

// Direct all /api/* requests to FastAPI
app.use('/api', (req, res) => {
  proxyRequestToFastApi(req, res, req.originalUrl);
});

// Direct /health to FastAPI
app.use('/health', (req, res) => {
  proxyRequestToFastApi(req, res, req.originalUrl);
});

// Start Server & mount Vite
async function startServer() {
  startFastApiServer();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`[GuardianPay AI] Full-stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
