import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'

const router = Router()

// Get conversations (simple list of messages grouped by recipient/sender)
router.get('/messages/conversations', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const messages = await prisma.message.findMany({ where: { OR: [{ senderId: userId }, { recipient: userId }] }, orderBy: { createdAt: 'desc' } })
  res.json({ data: messages })
})

// Send message
router.post('/messages', requireAuth, async (req: AuthRequest, res) => {
  const { content, recipientId } = req.body
  if (!content || !recipientId) return res.status(400).json({ error: 'Missing fields' })
  const message = await prisma.message.create({ data: { content, senderId: req.userId!, recipient: recipientId } })
  res.status(201).json({ data: message })
})

// Get messages with user
router.get('/messages/:userId', requireAuth, async (req: AuthRequest, res) => {
  const otherId = req.params.userId
  const userId = req.userId!
  const messages = await prisma.message.findMany({ where: { OR: [ { senderId: userId, recipient: otherId }, { senderId: otherId, recipient: userId } ] }, orderBy: { createdAt: 'asc' } })
  res.json({ data: messages })
})

export default router
