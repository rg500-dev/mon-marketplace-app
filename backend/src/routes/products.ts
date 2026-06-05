import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth from '../middleware/auth'

const router = Router()

// List products with search and filters
router.get('/products', async (req, res) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    condition,
    sort = 'newest',
    page = '1',
    limit = '20',
  } = req.query as any

  const where: any = { status: 'active' }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (category) where.categoryId = category
  if (condition) where.condition = condition

  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.gte = parseFloat(minPrice)
    if (maxPrice) where.price.lte = parseFloat(maxPrice)
  }

  const pageNum = Math.max(1, parseInt(page))
  const lim = Math.max(1, parseInt(limit))

  const orderBy: any = { createdAt: 'desc' }
  if (sort === 'price_asc') orderBy.price = 'asc'
  if (sort === 'price_desc') orderBy.price = 'desc'
  if (sort === 'oldest') orderBy.createdAt = 'asc'

  const products = await prisma.product.findMany({
    where,
    skip: (pageNum - 1) * lim,
    take: lim,
    orderBy,
    include: {
      category: true,
      seller: {
        select: { id: true, username: true, avatar: true, rating: true, verified: true },
      },
    },
  })

  res.json({ data: products })
})

// Get product detail with seller and reviews
router.get('/products/:id', async (req, res) => {
  const { id } = req.params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      seller: {
        select: { id: true, username: true, avatar: true, rating: true, verified: true, location: true },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, username: true, avatar: true } } },
      },
    },
  })

  if (!product) return res.status(404).json({ error: 'Not found' })
  if (product.status !== 'active') return res.status(404).json({ error: 'Not found' })

  await prisma.product.update({ where: { id }, data: { views: { increment: 1 } } })
  res.json({ data: product })
})

// Create product (protected)
router.post('/products', requireAuth, async (req: any, res) => {
  const { title, description, price, categoryId, condition, imageUrl, status } = req.body
  if (!title || !price || !categoryId) return res.status(400).json({ error: 'Missing fields' })

  const product = await prisma.product.create({
    data: {
      title,
      description: description || '',
      price: parseFloat(price),
      categoryId,
      sellerId: req.userId,
      condition: condition || 'used',
      status: status || 'active',
      image: imageUrl || null,
    },
  })

  res.status(201).json({ data: product })
})

export default router
