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

// JWT_SECRET est requis en production : on refuse de démarrer sans lui
// plutôt que de retomber silencieusement sur une valeur par défaut connue.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET manquant en production. Arrêt du serveur.')
  process.exit(1)
}

const app: Express = express();
// Render (comme Heroku, etc.) est derrière un reverse proxy qui ajoute X-Forwarded-For.
// Sans ce réglage, express-rate-limit ne peut pas identifier les IP correctement.
app.set('trust proxy', 1);
const http = createServer(app);

// Liste blanche des origines autorisées (séparées par des virgules dans FRONTEND_URL)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, '')) // on retire un éventuel "/" final

const corsOriginCheck = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Pas d'origine (ex: curl, app mobile, requêtes server-to-server) : on laisse passer
  if (!origin) return callback(null, true)
  const normalizedOrigin = origin.replace(/\/$/, '')
  if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true)
  console.warn(`⚠️ CORS refusé pour l'origine: "${origin}" — autorisées: ${allowedOrigins.join(', ')}`)
  return callback(new Error('Non autorisé par la politique CORS'))
}

const io = new SocketIOServer(http, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const uploadDir = path.join(__dirname, '..', 'public', 'uploads')
app.use('/uploads', express.static(uploadDir))

const routes = createRoutes(io)

const PORT = process.env.PORT || 10000;

// CSP désactivée : ce serveur est une API JSON + fichiers statiques, pas de pages HTML à protéger.
// crossOriginResourcePolicy en "cross-origin" : nécessaire pour que le frontend (autre domaine sur Render)
// puisse charger les images servies depuis /uploads.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Middleware CORS - restreint aux origines de la liste blanche (FRONTEND_URL)
app.use(cors({
  origin: corsOriginCheck,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Rate limiting global : limite les abus simples (scraping, DoS basique)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', globalLimiter)

// Rate limiting strict sur les routes d'authentification (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez plus tard.' },
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

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