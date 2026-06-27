import { Router } from 'express'
import { prisma } from '../prisma'
import { optionalAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/users/:id', optionalAuth, async (req: AuthRequest, res) => {
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

  // Email et téléphone sont des données personnelles : on ne les renvoie qu'au
  // propriétaire du profil lui-même (ou à un admin), jamais à un visiteur public.
  const isSelfOrAdmin = req.userId === id || (await isAdmin(req.userId))
  const { email, phone, ...publicUser } = user

  res.json({
    data: {
      ...publicUser,
      ...(isSelfOrAdmin ? { email, phone } : {}),
      totalProducts: user.products.length,
      reviewCount: reviewStats._count.rating,
      averageRating: reviewStats._avg.rating ?? user.rating,
    },
  })
})

async function isAdmin(userId?: string): Promise<boolean> {
  if (!userId) return false
  const requester = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  return requester?.role === 'admin'
}

export default router
