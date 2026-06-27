import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { optionalAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// Helper: Haversine distance (returns km)
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// List products with search, filters, and distance search
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
    lat,
    lng,
    radius, // in km
    location, // text search for city/address
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

  // Text search on location (city name, address)
  if (location && !lat && !lng) {
    where.location = { contains: location, mode: 'insensitive' }
  }

  const pageNum = Math.max(1, parseInt(page))
  const lim = Math.max(1, parseInt(limit))

  const orderBy: any = { createdAt: 'desc' }
  if (sort === 'price_asc') orderBy.price = 'asc'
  if (sort === 'price_desc') orderBy.price = 'desc'
  if (sort === 'oldest') orderBy.createdAt = 'asc'
  if (sort === 'distance' && lat && lng) {
    // Distance sort will be done in-memory
  }

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

  // Apply distance filter and sorting in-memory
  let filtered = products
  if (lat && lng) {
    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const rad = radius ? parseFloat(radius) : 50 // default 50km

    filtered = products
      .filter((p) => {
        if (p.latitude == null || p.longitude == null) return false
        const dist = haversineDistance(userLat, userLng, p.latitude, p.longitude)
        return dist <= rad
      })
      .map((p) => {
        const dist = (p.latitude != null && p.longitude != null)
          ? haversineDistance(userLat, userLng, p.latitude, p.longitude)
          : null
        return { ...p, distance: dist ? Math.round(dist * 10) / 10 : null }
      })

    if (sort === 'distance') {
      filtered.sort((a: any, b: any) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    }
  }

  res.json({ data: filtered })
})

// Get product detail with seller and reviews
router.get('/products/:id', optionalAuth, async (req: AuthRequest, res) => {
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

  const isOwner = req.userId === product.sellerId
  // Une annonce non active (vendue, supprimée par son vendeur, retirée par la modération...)
  // n'est visible publiquement que par son propriétaire (pour qu'il puisse la gérer/modifier).
  if (product.status !== 'active' && !isOwner) {
    return res.status(404).json({ error: 'Not found' })
  }

  if (!isOwner) {
    await prisma.product.update({ where: { id }, data: { views: { increment: 1 } } })
  }
  res.json({ data: product })
})

// Create product (protected)
router.post('/products', requireAuth, async (req: any, res) => {
  const { title, description, price, categoryId, condition, imageUrl, status, latitude, longitude, location } = req.body
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
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      location: location || null,
    },
  })

  res.status(201).json({ data: product })
})

// Update product (owner only)
router.put('/products/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Annonce introuvable' })
  if (existing.sellerId !== req.userId) {
    return res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres annonces' })
  }

  const { title, description, price, categoryId, condition, imageUrl, status, latitude, longitude, location } = req.body

  const data: any = {}
  if (title !== undefined) data.title = title
  if (description !== undefined) data.description = description
  if (price !== undefined) data.price = parseFloat(price)
  if (categoryId !== undefined) data.categoryId = categoryId
  if (condition !== undefined) data.condition = condition
  if (imageUrl !== undefined) data.image = imageUrl || null
  if (latitude !== undefined) data.latitude = latitude !== null ? parseFloat(latitude) : null
  if (longitude !== undefined) data.longitude = longitude !== null ? parseFloat(longitude) : null
  if (location !== undefined) data.location = location

  if (status !== undefined) {
    // Le vendeur peut remettre son annonce en vente ou la marquer vendue lui-même.
    // La suppression passe par la route DELETE dédiée (statut "removed" réservé à ça/à la modération).
    const allowedStatuses = ['active', 'sold']
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }
    data.status = status
  }

  const updated = await prisma.product.update({ where: { id }, data })
  res.json({ data: updated })
})

// Delete product (owner only) — soft delete, même logique que la modération admin
router.delete('/products/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Annonce introuvable' })
  if (existing.sellerId !== req.userId) {
    return res.status(403).json({ error: 'Vous ne pouvez supprimer que vos propres annonces' })
  }

  await prisma.product.update({ where: { id }, data: { status: 'removed' } })
  res.json({ success: true })
})

export default router
