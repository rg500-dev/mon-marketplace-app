import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.post('/reports', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { type, title, description, productId, reportedUserId } = req.body
    if (!type || !title || !description) {
      return res.status(400).json({ error: 'Type, title and description are required' })
    }

    if (type === 'product' && !productId) {
      return res.status(400).json({ error: 'productId is required for product reports' })
    }

    if (type === 'user' && !reportedUserId) {
      return res.status(400).json({ error: 'reportedUserId is required for user reports' })
    }

    const report = await prisma.report.create({
      data: {
        type,
        title,
        description,
        reporterId: req.userId!,
        productId: productId || undefined,
        reportedUserId: reportedUserId || undefined,
      },
    })

    const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } })
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'report',
          title: `Nouveau signalement: ${title}`,
          message: description,
          metadata: { reportId: report.id },
        },
      })
    }

    res.status(201).json({ data: report })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
