import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'
import { sendNewOfferEmail, sendOfferAcceptedEmail, sendOfferDeclinedEmail, sendCounterOfferEmail } from '../services/emailService'

const router = Router()

// Get all offers for current user (as buyer or seller)
router.get('/offers', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!

  const asBuyer = await prisma.offer.findMany({
    where: { buyerId: userId },
    include: {
      product: {
        select: { id: true, title: true, price: true, image: true, status: true },
        include: {
          seller: { select: { id: true, username: true, avatar: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const asSeller = await prisma.offer.findMany({
    where: { product: { sellerId: userId } },
    include: {
      product: {
        select: { id: true, title: true, price: true, image: true, status: true },
        include: {
          seller: { select: { id: true, username: true, avatar: true } },
        },
      },
      buyer: { select: { id: true, username: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ data: { sent: asBuyer, received: asSeller } })
})

// Get offers for a specific product
router.get('/offers/:productId', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const { productId } = req.params

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true },
  })

  if (!product) return res.status(404).json({ error: 'Produit introuvable' })

  const where = product.sellerId === userId
    ? { productId } // Seller sees all offers
    : { productId, buyerId: userId } // Buyer sees only their offer

  const offers = await prisma.offer.findMany({
    where,
    include: {
      buyer: { select: { id: true, username: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ data: offers })
})

// Make an offer on a product
router.post('/offers', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const { productId, amount, message } = req.body

  if (!productId || !amount) {
    return res.status(400).json({ error: 'ID du produit et montant requis' })
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return res.status(404).json({ error: 'Produit introuvable' })
  if (product.sellerId === userId) return res.status(400).json({ error: 'Vous ne pouvez pas faire une offre sur votre propre produit' })
  if (product.status !== 'active') return res.status(400).json({ error: 'Ce produit n\'est plus disponible' })

  const price = parseFloat(amount)
  if (isNaN(price) || price <= 0) return res.status(400).json({ error: 'Montant invalide' })

  // Check if offer already exists
  const existing = await prisma.offer.findFirst({
    where: { buyerId: userId, productId, status: { in: ['pending', 'counter'] } },
  })
  if (existing) return res.status(400).json({ error: 'Vous avez déjà une offre en cours sur ce produit' })

  const offer = await prisma.offer.create({
    data: {
      amount: price,
      message: message || null,
      buyerId: userId,
      productId,
    },
    include: {
      buyer: { select: { id: true, username: true } },
      product: { select: { id: true, title: true, sellerId: true } },
    },
  })

  // Notify the seller
  await prisma.notification.create({
    data: {
      userId: product.sellerId,
      type: 'offer',
      title: 'Nouvelle offre',
      message: `${offer.buyer.username} a fait une offre de ${price}€ sur "${product.title}"`,
      metadata: { offerId: offer.id, productId, buyerId: userId },
    },
  })

  res.status(201).json({ data: offer })

  // Email : notifier le vendeur par email
  const sellerUser = await prisma.user.findUnique({ where: { id: product.sellerId }, select: { email: true } })
  if (sellerUser?.email) {
    sendNewOfferEmail(sellerUser.email, offer.buyer.username, price, product.title, product.id)
  }
})

// Accept an offer (seller only)
router.patch('/offers/:id/accept', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!

  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id },
    include: { product: { select: { sellerId: true, title: true } } },
  })

  if (!offer) return res.status(404).json({ error: 'Offre introuvable' })
  if (offer.product.sellerId !== userId) return res.status(403).json({ error: 'Non autorisé' })
  if (offer.status !== 'pending' && offer.status !== 'counter') return res.status(400).json({ error: 'Offre déjà traitée' })

  await prisma.$transaction([
    prisma.offer.update({ where: { id: offer.id }, data: { status: 'accepted' } }),
    prisma.product.update({ where: { id: offer.productId }, data: { status: 'sold' } }),
    prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: 'offer_accepted',
        title: 'Offre acceptée !',
        message: `Votre offre de ${offer.amount}€ pour "${offer.product.title}" a été acceptée !`,
        metadata: { offerId: offer.id, productId: offer.productId },
      },
    }),
  ])

  res.json({ data: { ...offer, status: 'accepted' } })

  // Email : notifier l'acheteur
  const buyerUser = await prisma.user.findUnique({ where: { id: offer.buyerId }, select: { email: true } })
  if (buyerUser?.email) {
    sendOfferAcceptedEmail(buyerUser.email, offer.amount, offer.product.title)
  }
})

// Decline an offer (seller only)
router.patch('/offers/:id/decline', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!

  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id },
    include: { product: { select: { sellerId: true, title: true } } },
  })

  if (!offer) return res.status(404).json({ error: 'Offre introuvable' })
  if (offer.product.sellerId !== userId) return res.status(403).json({ error: 'Non autorisé' })
  if (offer.status !== 'pending' && offer.status !== 'counter') return res.status(400).json({ error: 'Offre déjà traitée' })

  await prisma.$transaction([
    prisma.offer.update({ where: { id: offer.id }, data: { status: 'declined' } }),
    prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: 'offer_declined',
        title: 'Offre refusée',
        message: `Votre offre de ${offer.amount}€ pour "${offer.product.title}" a été refusée.`,
        metadata: { offerId: offer.id, productId: offer.productId },
      },
    }),
  ])

  res.json({ data: { ...offer, status: 'declined' } })
})

// Counter an offer (seller proposes different price)
router.patch('/offers/:id/counter', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const { counterAmount, counterMessage } = req.body

  if (!counterAmount) return res.status(400).json({ error: 'Montant de contre-offre requis' })

  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id },
    include: { product: { select: { sellerId: true, title: true } } },
  })

  if (!offer) return res.status(404).json({ error: 'Offre introuvable' })
  if (offer.product.sellerId !== userId) return res.status(403).json({ error: 'Non autorisé' })
  if (offer.status !== 'pending') return res.status(400).json({ error: 'Impossible de faire une contre-offre' })

  const price = parseFloat(counterAmount)
  if (isNaN(price) || price <= 0) return res.status(400).json({ error: 'Montant invalide' })

  await prisma.$transaction([
    prisma.offer.update({
      where: { id: offer.id },
      data: { status: 'counter', counterAmount: price, counterMessage: counterMessage || null },
    }),
    prisma.notification.create({
      data: {
        userId: offer.buyerId,
        type: 'offer_counter',
        title: 'Contre-offre',
        message: `Le vendeur propose ${price}€ pour "${offer.product.title}" au lieu de ${offer.amount}€.`,
        metadata: { offerId: offer.id, productId: offer.productId },
      },
    }),
  ])

  res.json({ data: { ...offer, status: 'counter', counterAmount: price, counterMessage } })
})

// Buyer accepts the counter offer
router.patch('/offers/:id/accept-counter', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!

  const offer = await prisma.offer.findUnique({
    where: { id: req.params.id },
    include: { product: { select: { sellerId: true, title: true } } },
  })

  if (!offer) return res.status(404).json({ error: 'Offre introuvable' })
  if (offer.buyerId !== userId) return res.status(403).json({ error: 'Non autorisé' })
  if (offer.status !== 'counter') return res.status(400).json({ error: 'Pas de contre-offre en attente' })

  await prisma.$transaction([
    prisma.offer.update({ where: { id: offer.id }, data: { status: 'accepted' } }),
    prisma.product.update({ where: { id: offer.productId }, data: { status: 'sold' } }),
  ])

  res.json({ data: { ...offer, status: 'accepted' } })
})

// Cancel an offer (buyer only)
router.patch('/offers/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!

  const offer = await prisma.offer.findUnique({ where: { id: req.params.id } })
  if (!offer) return res.status(404).json({ error: 'Offre introuvable' })
  if (offer.buyerId !== userId) return res.status(403).json({ error: 'Non autorisé' })
  if (offer.status !== 'pending' && offer.status !== 'counter') return res.status(400).json({ error: 'Offre déjà traitée' })

  await prisma.offer.update({ where: { id: offer.id }, data: { status: 'cancelled' } })
  res.json({ data: { ...offer, status: 'cancelled' } })
})

export default router