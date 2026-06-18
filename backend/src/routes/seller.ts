import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'

const router = Router()

// Statistiques du tableau de bord vendeur
router.get('/seller/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!

    // Produits
    const totalProducts = await prisma.product.count({ where: { sellerId: userId } })
    const activeProducts = await prisma.product.count({ where: { sellerId: userId, status: 'active' } })
    const soldProducts = await prisma.product.count({ where: { sellerId: userId, status: 'sold' } })
    const totalViews = await prisma.product.aggregate({
      where: { sellerId: userId },
      _sum: { views: true },
    })

    // Revenus (offres acceptées)
    const acceptedOffers = await prisma.offer.findMany({
      where: {
        product: { sellerId: userId },
        status: 'accepted',
      },
      select: { amount: true, counterAmount: true },
    })
    const totalRevenue = acceptedOffers.reduce((sum, offer) => {
      return sum + (offer.counterAmount || offer.amount)
    }, 0)

    // Offres reçues
    const totalOffers = await prisma.offer.count({
      where: { product: { sellerId: userId } },
    })
    const pendingOffers = await prisma.offer.count({
      where: { product: { sellerId: userId }, status: 'pending' },
    })

    // Avis
    const totalReviews = await prisma.review.count({
      where: { product: { sellerId: userId } },
    })
    const avgRating = await prisma.review.aggregate({
      where: { product: { sellerId: userId } },
      _avg: { rating: true },
    })

    // Produits récents
    const recentProducts = await prisma.product.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { category: { select: { name: true } } },
    })

    // Ventes par mois (12 derniers mois)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlySales = await prisma.offer.findMany({
      where: {
        product: { sellerId: userId },
        status: 'accepted',
        updatedAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, counterAmount: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    })

    // Grouper par mois
    const salesByMonth: { [key: string]: number } = {}
    monthlySales.forEach((sale) => {
      const monthKey = sale.updatedAt.toISOString().slice(0, 7) // "2026-06"
      const amount = sale.counterAmount || sale.amount
      salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + amount
    })

    // Vues par produit (top 5)
    const topProducts = await prisma.product.findMany({
      where: { sellerId: userId, status: { not: 'removed' } },
      orderBy: { views: 'desc' },
      take: 5,
      select: { id: true, title: true, views: true, price: true },
    })

    res.json({
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          sold: soldProducts,
          views: totalViews._sum.views || 0,
        },
        revenue: {
          total: totalRevenue,
          monthly: salesByMonth,
        },
        offers: {
          total: totalOffers,
          pending: pendingOffers,
        },
        reviews: {
          total: totalReviews,
          average: avgRating._avg.rating || 0,
        },
        recentProducts,
        topProducts,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router