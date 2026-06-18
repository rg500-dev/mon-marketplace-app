import { Router } from 'express'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'
import { sendNewMessageEmail } from '../services/emailService'

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
          lastMessage: msg.content,
          updatedAt: msg.createdAt,
          unread,
        })
      } else {
        if (msg.createdAt > entry.updatedAt) {
          entry.lastMessage = msg.content
          entry.updatedAt = msg.createdAt
        }
        entry.unread += unread
      }
    })

    res.json({ data: Array.from(conversations.values()) })
  })

  // Send message and notification
  router.post('/messages', requireAuth, async (req: AuthRequest, res) => {
    const { content, recipientId } = req.body
    if (!content || !recipientId) return res.status(400).json({ error: 'Missing fields' })

    const senderId = req.userId!
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { username: true } })
    if (!sender) return res.status(404).json({ error: 'Sender not found' })

    const message = await prisma.message.create({ data: { content, senderId, recipient: recipientId } })

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'message',
        title: 'Nouveau message',
        message: `${sender.username} vous a envoyé un message.`,
        metadata: { senderId, product: null, messageId: message.id },
      },
    })

    io.to(recipientId).emit('receive_message', {
      senderId,
      content: message.content,
      createdAt: message.createdAt,
    })
    io.to(recipientId).emit('notification', {
      type: 'message',
      title: 'Nouveau message',
      message: `${sender.username} vous a envoyé un message.`,
      data: { messageId: message.id, senderId },
    })

    res.status(201).json({ data: message })

    // Email : notifier le destinataire (asynchrone)
    const recipientUser = await prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } })
    if (recipientUser?.email) {
      sendNewMessageEmail(recipientUser.email, sender.username, content)
    }
  })

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