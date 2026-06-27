import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'
import { sendNewReviewEmail } from '../services/emailService'

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

  // Empêcher l'utilisateur de noter son propre produit
  if (product.sellerId === req.userId) {
    return res.status(403).json({ error: 'Vous ne pouvez pas évaluer votre propre produit' })
  }

  // Vérifier que l'utilisateur a bien interagi avec le vendeur (offre acceptée)
  const hasOffer = await prisma.offer.findFirst({
    where: {
      productId,
      buyerId: req.userId!,
      status: 'accepted',
    },
  })
  if (!hasOffer) {
    return res.status(403).json({ error: 'Vous devez avoir acheté ce produit pour laisser un avis' })
  }

  // Vérifier que l'utilisateur n'a pas déjà laissé un avis
  const existingReview = await prisma.review.findFirst({
    where: { productId, authorId: req.userId! },
  })
  if (existingReview) {
    return res.status(409).json({ error: 'Vous avez déjà laissé un avis sur ce produit' })
  }

  const reviewer = await prisma.user.findUnique({ where: { id: req.userId! }, select: { username: true } })
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

  // Email : notifier le vendeur (asynchrone)
  const sellerUser = await prisma.user.findUnique({ where: { id: product.sellerId }, select: { email: true } })
  if (sellerUser?.email && reviewer) {
    sendNewReviewEmail(sellerUser.email, reviewer.username, numericRating, product.title)
  }
})

export default router
