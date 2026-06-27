import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Vérification JWT_SECRET au démarrage
if (!process.env.JWT_SECRET) {
  console.error('❌ ERREUR CRITIQUE: JWT_SECRET non défini dans les variables d\'environnement')
  console.error('Le serveur ne peut pas démarrer sans JWT_SECRET.')
  process.exit(1)
}

const app: Express = express();
const http = createServer(app);

const FRONTEND_URLS = [
  process.env.FRONTEND_URL,
  'https://marketplace-frontend-rv3l.onrender.com',
].filter(Boolean) as string[]

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, curl, etc.)
    if (!origin) return callback(null, true)
    if (FRONTEND_URLS.some(url => origin.startsWith(url))) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}

app.use(cors(corsOptions))

// Sécurité HTTP
app.use(helmet())

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
})
app.use(globalLimiter)

// Rate limiting pour /auth/login (anti brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
})

const io = new SocketIOServer(http, {
  cors: {
    origin: FRONTEND_URLS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const uploadDir = path.join(__dirname, '..', 'public', 'uploads')
app.use('/uploads', express.static(uploadDir))

const routes = createRoutes(io, loginLimiter)

const PORT = process.env.PORT || 10000;

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
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origine non autorisée' })
  }
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
  console.log(`🔒 CORS autorisé pour: ${FRONTEND_URLS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📛 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});