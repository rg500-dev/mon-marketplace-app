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
// On accepte les images ET les documents courants (PDF, Office, texte, zip).
// Liste blanche volontairement restreinte : pas d'exécutables ni de scripts.
const ALLOWED_EXTENSIONS = /\.(jpe?g|png|webp|gif|pdf|docx?|xlsx?|pptx?|txt|csv|zip)$/i

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (documents un peu plus volumineux que des photos)
  fileFilter: (req: any, file: any, cb: any) => {
    if (ALLOWED_EXTENSIONS.test(file.originalname)) return cb(null, true)
    cb(new Error('Type de fichier non autorisé (images, PDF, Word, Excel, PowerPoint, texte ou ZIP uniquement)'))
  },
})

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i

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
      const preview = msg.image ? (msg.fileName && !IMAGE_EXTENSIONS.test(msg.fileName) ? `📎 ${msg.fileName}` : '📷 Image') : msg.content

      if (!entry) {
        conversations.set(partnerId, {
          partnerId,
          lastMessage: preview,
          updatedAt: msg.createdAt,
          unread,
        })
      } else {
        if (msg.createdAt > entry.updatedAt) {
          entry.lastMessage = preview
          entry.updatedAt = msg.createdAt
        }
        entry.unread += unread
      }
    })

    // On récupère en une requête les infos publiques (username, avatar) de tous les contacts,
    // pour ne plus afficher un ID tronqué illisible côté frontend.
    const partnerIds = Array.from(conversations.keys())
    const partners: { id: string; username: string; avatar: string | null }[] = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, username: true, avatar: true },
    })
    const partnerById = new Map(partners.map((p) => [p.id, p]))

    const result = Array.from(conversations.values()).map((c) => ({
      ...c,
      username: partnerById.get(c.partnerId)?.username || 'Utilisateur supprimé',
      avatar: partnerById.get(c.partnerId)?.avatar || null,
    }))

    res.json({ data: result })
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

      const recipientUser = await prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } })
      if (!recipientUser) return res.status(404).json({ error: 'Destinataire introuvable' })

      let imageUrl: string | null = null
      let fileName: string | null = null

      // Upload du fichier vers Cloudinary si présent (image ou document)
      if (req.file) {
        const isImage = IMAGE_EXTENSIONS.test(req.file.originalname)
        const result = await new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'marketplace-chat',
              resource_type: 'auto', // laisse Cloudinary détecter image/raw selon le contenu
              // La transformation (redimensionnement) n'a de sens que pour les images.
              ...(isImage
                ? { transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }] }
                : {}),
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          stream.end(req.file!.buffer)
        })
        imageUrl = result.secure_url
        fileName = req.file.originalname
      }

      // Créer le message
      const message = await prisma.message.create({
        data: {
          content: content || '',
          image: imageUrl,
          fileName,
          senderId,
          recipient: recipientId,
        },
      })

      // Notification
      const attachmentLabel = fileName && !IMAGE_EXTENSIONS.test(fileName) ? 'un fichier' : 'une photo'
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'message',
          title: 'Nouveau message',
          message: imageUrl
            ? `${sender.username} vous a envoyé ${attachmentLabel}.`
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
        fileName: message.fileName,
        createdAt: message.createdAt,
      })
      io.to(recipientId).emit('notification', {
        type: 'message',
        title: 'Nouveau message',
        message: imageUrl ? `${sender.username} a envoyé ${attachmentLabel}.` : `${sender.username} a envoyé un message.`,
        data: { messageId: message.id, senderId },
      })

      res.status(201).json({ data: message })

      // Email (asynchrone)
      if (recipientUser.email) {
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