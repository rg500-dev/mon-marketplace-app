import { Router } from 'express'
import { prisma } from '../prisma'
import { requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        verified: true,
        isSuspended: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/admin/users/:id/verify', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.update({
      where: { id },
      data: { verified: true, verificationToken: null },
    })
    res.json({ data: { id: user.id, verified: user.verified } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/admin/users/:id/suspend', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.update({ where: { id }, data: { isSuspended: true } })
    res.json({ data: { id: user.id, isSuspended: user.isSuspended } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/admin/users/:id/unsuspend', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.user.update({ where: { id }, data: { isSuspended: false } })
    res.json({ data: { id: user.id, isSuspended: user.isSuspended } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/admin/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }
    const user = await prisma.user.update({ where: { id }, data: { role } })
    res.json({ data: { id: user.id, role: user.role } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    // Prefer soft delete by keeping the product record and marking it removed.
    await prisma.product.update({ where: { id }, data: { status: 'removed' } })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        seller: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: products })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/admin/reports', requireAdmin, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: { select: { id: true, username: true, email: true } },
        product: { select: { id: true, title: true } },
        reportedUser: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: reports })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/admin/reports/:id/action', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { action, comment } = req.body
    if (!['reviewed', 'dismissed', 'removed', 'suspended-user'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' })
    }

    const updateData: any = { action, status: 'closed', comment }

    if (action === 'removed') {
      const report = await prisma.report.findUnique({ where: { id } })
      if (report?.productId) {
        await prisma.product.update({ where: { id: report.productId }, data: { status: 'removed' } })
      }
    }

    if (action === 'suspended-user') {
      const report = await prisma.report.findUnique({ where: { id } })
      if (report?.reportedUserId) {
        await prisma.user.update({ where: { id: report.reportedUserId }, data: { isSuspended: true } })
      }
    }

    const report = await prisma.report.update({ where: { id }, data: updateData })
    res.json({ data: report })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
