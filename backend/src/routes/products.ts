import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth from '../middleware/auth'

const router = Router()

// List products with optional category filter
router.get('/products', async (req, res) => {
  const { category, page = '1', limit = '20' } = req.query as any
  const where: any = { status: 'active' }
  if (category) where.categoryId = category
  const pageNum = Math.max(1, parseInt(page))
  const lim = Math.max(1, parseInt(limit))
  const products = await prisma.product.findMany({
    where,
    skip: (pageNum - 1) * lim,
    take: lim,
    orderBy: { createdAt: 'desc' },
  })
  res.json({ data: products })
})

// Get product
router.get('/products/:id', async (req, res) => {
  const { id } = req.params
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return res.status(404).json({ error: 'Not found' })
  res.json({ data: product })
})

// Create product (protected)
router.post('/products', requireAuth, async (req: any, res) => {
  const { title, description, price, categoryId, condition } = req.body
  if (!title || !price || !categoryId) return res.status(400).json({ error: 'Missing fields' })
  const product = await prisma.product.create({
    data: {
      title,
      description: description || '',
      price: parseFloat(price),
      categoryId,
      sellerId: req.userId,
      condition: condition || 'used',
    },
  })
  res.status(201).json({ data: product })
})

export default router
