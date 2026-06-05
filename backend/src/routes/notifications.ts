import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  res.json({ data: notifications })
})

router.patch('/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const { id } = req.params
  const notification = await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  })
  if (notification.count === 0) return res.status(404).json({ error: 'Notification not found' })
  res.json({ success: true })
})

export default router
