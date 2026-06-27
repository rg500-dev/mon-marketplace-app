import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth from '../middleware/auth'

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

// Update product (vendeur uniquement)
router.put('/products/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' })
    if (product.sellerId !== req.userId) return res.status(403).json({ error: 'Vous n\'êtes pas le vendeur' })

    const { title, description, price, categoryId, condition, imageUrl, status, latitude, longitude, location } = req.body
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(condition !== undefined && { condition }),
        ...(imageUrl !== undefined && { image: imageUrl }),
        ...(status !== undefined && { status }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) }),
        ...(location !== undefined && { location }),
      },
    })
    res.json({ data: updated })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur lors de la mise à jour' })
  }
})

// Delete product (vendeur ou admin)
router.delete('/products/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' })
    if (product.sellerId !== req.userId) return res.status(403).json({ error: 'Vous n\'êtes pas le vendeur' })

    await prisma.product.delete({ where: { id } })
    res.json({ message: 'Produit supprimé' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur lors de la suppression' })
  }
})

export default router
