/**
 * Custom Next.js Server with Socket.IO Integration
 * This server integrates Socket.IO with the Next.js application
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    path: '/api/socket/social-wall',
    cors: {
      origin: process.env.NEXTAUTH_URL || `http://localhost:${port}`,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Store Socket.IO instance globally for access in API routes
  global.__socialWallSocketIO = io;

  // Initialize the Social Wall Socket Server
  try {
    const { socialWallSocketServer } = require('./src/features/social-wall/services/socket-server.ts');
    socialWallSocketServer.initialize(io);
    console.log('Social Wall Socket.IO server initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Social Wall Socket.IO server:', error);

    // Fallback basic setup
    io.on('connection', (socket) => {
      console.log('Socket connected (fallback):', socket.id);

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected (fallback):', socket.id, reason);
      });
    });

    // Dynamic namespace handling for classes (fallback)
    io.of(/^\/class-[\w]+$/).on('connection', (socket) => {
      const classId = socket.nsp.name.replace('/class-', '');
      console.log(`User connected to class ${classId} (fallback):`, socket.id);

      socket.on('disconnect', () => {
        console.log(`User disconnected from class ${classId} (fallback):`, socket.id);
      });
    });
  }

  // Start the server
  server
    .once('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO server running on path: /api/socket/social-wall`);

      // Memory monitoring
      setInterval(() => {
        const memUsage = process.memoryUsage();
        const memUsageMB = {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        };

        // Log memory usage every 5 minutes
        console.log('Memory usage (MB):', memUsageMB);

        // Warning if memory usage is high
        if (memUsageMB.heapUsed > 1000) {
          console.warn('High memory usage detected:', memUsageMB);

          // Force garbage collection if available
          if (global.gc) {
            global.gc();
            console.log('Forced garbage collection');
          }
        }
      }, 300000); // Every 5 minutes
    });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);

    try {
      const { socialWallSocketServer } = require('./src/features/social-wall/services/socket-server.ts');
      socialWallSocketServer.shutdown();
    } catch (error) {
      console.error('Error during socket server shutdown:', error);
    }

    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.log('Forcing exit...');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle memory issues
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
});
