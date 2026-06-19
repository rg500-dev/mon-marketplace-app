import { Router } from 'express'
import { Server as SocketIOServer } from 'socket.io'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'
import { sendNewMessageEmail } from '../services/emailService'

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Multer pour stockage temporaire en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) return cb(null, true)
    cb(new Error('Seules les images (JPEG, PNG, WebP, GIF) sont autorisées'))
  },
})

export default function createMessagesRoutes(io: SocketIOServer) {
  const router = Router()

  // Get conversations with unread counts
  router.get('/messages/conversations', requireAuth, async (req: AuthRequest, res) => {
    const userId = req.userId!
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { recipient: userId }] },
      orderBy: { createdAt: 'desc' },
    })

    const conversations = new Map<string, { partnerId: string; lastMessage: string; updatedAt: Date; unread: number }>()
    messages.forEach((msg) => {
      const partnerId = msg.senderId === userId ? msg.recipient : msg.senderId
      const entry = conversations.get(partnerId)
      const unread = msg.recipient === userId && !msg.read ? 1 : 0

      if (!entry) {
        conversations.set(partnerId, {
          partnerId,
          lastMessage: msg.image ? '📷 Image' : msg.content,
          updatedAt: msg.createdAt,
          unread,
        })
      } else {
        if (msg.createdAt > entry.updatedAt) {
          entry.lastMessage = msg.image ? '📷 Image' : msg.content
          entry.updatedAt = msg.createdAt
        }
        entry.unread += unread
      }
    })

    res.json({ data: Array.from(conversations.values()) })
  })

  // Envoyer un message (texte + image optionnelle)
  router.post('/messages', requireAuth, upload.single('image'), async (req: AuthRequest, res) => {
    try {
      const { content, recipientId } = req.body
      const senderId = req.userId!

      if ((!content || !content.trim()) && !req.file) {
        return res.status(400).json({ error: 'Message ou image requis' })
      }

      const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { username: true } })
      if (!sender) return res.status(404).json({ error: 'Sender not found' })
      if (!recipientId) return res.status(400).json({ error: 'Destinataire requis' })

      let imageUrl: string | null = null

      // Upload de l'image vers Cloudinary si présente
      if (req.file) {
        const result = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'marketplace-chat',
              allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
              transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          stream.end(req.file!.buffer)
        })
        imageUrl = result.secure_url
      }

      // Créer le message
      const message = await prisma.message.create({
        data: {
          content: content || '',
          image: imageUrl,
          senderId,
          recipient: recipientId,
        },
      })

      // Notification
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'message',
          title: 'Nouveau message',
          message: imageUrl
            ? `${sender.username} vous a envoyé une photo.`
            : `${sender.username} vous a envoyé un message.`,
          metadata: { senderId, product: null, messageId: message.id },
        },
      })

      // Envoi temps réel
      io.to(recipientId).emit('receive_message', {
        id: message.id,
        senderId,
        content: message.content,
        image: message.image,
        createdAt: message.createdAt,
      })
      io.to(recipientId).emit('notification', {
        type: 'message',
        title: 'Nouveau message',
        message: imageUrl ? `${sender.username} a envoyé une photo.` : `${sender.username} a envoyé un message.`,
        data: { messageId: message.id, senderId },
      })

      res.status(201).json({ data: message })

      // Email (asynchrone)
      const recipientUser = await prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } })
      if (recipientUser?.email) {
        sendNewMessageEmail(recipientUser.email, sender.username, content || '(Photo)')
      }
    } catch (err: any) {
      console.error('Send message error:', err)
      res.status(500).json({ error: err.message || 'Erreur lors de l\'envoi du message' })
    }
  })

  // Récupérer les messages d'une conversation
  router.get('/messages/:userId', requireAuth, async (req: AuthRequest, res) => {
    const otherId = req.params.userId
    const userId = req.userId!
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipient: otherId },
          { senderId: otherId, recipient: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    await prisma.message.updateMany({
      where: { senderId: otherId, recipient: userId, read: false },
      data: { read: true },
    })

    res.json({ data: messages })
  })

  return router
}