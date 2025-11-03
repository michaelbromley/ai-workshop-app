import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupSocketHandlers } from './socket.js';
import type { ServerToClientEvents, ClientToServerEvents } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files from the client build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientBuildPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode: CORS enabled for http://localhost:5173');
  }
});
