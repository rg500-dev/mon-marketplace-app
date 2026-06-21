import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import passport from 'passport';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './prisma'
import createRoutes from './routes'
import socialAuthRoutes from './routes/socialAuth'

// Load environment variables
dotenv.config();

const app: Express = express();
const http = createServer(app);

const io = new SocketIOServer(http, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const uploadDir = path.join(__dirname, '..', 'public', 'uploads')
app.use('/uploads', express.static(uploadDir))

const routes = createRoutes(io)

const PORT = process.env.PORT || 5000;

// Middleware CORS manuel - s'exécute AVANT tout
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// API routes
app.use('/api', routes)
app.use('/api', socialAuthRoutes)

// Welcome route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Marketplace API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (userId: string) => {
    socket.join(userId);
  });

  socket.on('send_message', (data: { senderId: string; recipientId: string; content: string }) => {
    io.to(data.recipientId).emit('receive_message', {
      senderId: data.senderId,
      content: data.content,
      timestamp: new Date(),
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start server
http.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📛 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});