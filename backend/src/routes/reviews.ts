import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/products/:id/reviews', async (req, res) => {
  const { id } = req.params
  const reviews = await prisma.review.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, username: true, avatar: true } } },
  })
  res.json({ data: reviews })
})

router.post('/reviews', requireAuth, async (req: AuthRequest, res) => {
  const { productId, rating, comment } = req.body
  if (!productId || !rating) return res.status(400).json({ error: 'Missing fields' })
  const numericRating = parseInt(rating, 10)
  if (numericRating < 1 || numericRating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' })

  const product = await prisma.product.findUnique({ where: { id: productId }, include: { seller: true } })
  if (!product) return res.status(404).json({ error: 'Product not found' })

  const review = await prisma.review.create({
    data: {
      authorId: req.userId!,
      productId,
      rating: numericRating,
      comment: comment || '',
    },
  })

  const aggregate = await prisma.review.aggregate({
    _avg: { rating: true },
    where: { product: { sellerId: product.sellerId } },
  })

  await prisma.user.update({
    where: { id: product.sellerId },
    data: { rating: aggregate._avg?.rating ?? product.seller.rating },
  })

  await prisma.notification.create({
    data: {
      userId: product.sellerId,
      type: 'review',
      title: 'Nouvelle évaluation',
      message: `Votre produit "${product.title}" a reçu une nouvelle note.`,
      metadata: { productId, reviewId: review.id },
    },
  })

  res.status(201).json({ data: review })
})

export default router
