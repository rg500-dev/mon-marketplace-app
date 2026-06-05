import { Router } from 'express'
import { prisma } from '../prisma'

const router = Router()

router.get('/users/:id', async (req, res) => {
  const { id } = req.params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      phone: true,
      location: true,
      bio: true,
      rating: true,
      verified: true,
      role: true,
      isSuspended: true,
      createdAt: true,
      products: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        include: { category: true },
        take: 12,
      },
    },
  })

  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

  const reviewStats = await prisma.review.aggregate({
    _count: { rating: true },
    _avg: { rating: true },
    where: { product: { sellerId: id } },
  })

  res.json({
    data: {
      ...user,
      totalProducts: user.products.length,
      reviewCount: reviewStats._count.rating,
      averageRating: reviewStats._avg.rating ?? user.rating,
    },
  })
})

export default router
