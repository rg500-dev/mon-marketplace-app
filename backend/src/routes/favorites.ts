import { Router } from 'express'
import { prisma } from '../prisma'
import requireAuth, { AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/favorites', requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!
  const favs = await prisma.favorite.findMany({ where: { userId }, include: { product: true } })
  res.json({ data: favs })
})

router.post('/favorites/:productId', requireAuth, async (req: AuthRequest, res) => {
  const { productId } = req.params
  const userId = req.userId!
  try {
    const fav = await prisma.favorite.create({ data: { userId, productId } })
    res.status(201).json({ data: fav })
  } catch (err) {
    res.status(400).json({ error: 'Unable to add favorite' })
  }
})

router.delete('/favorites/:productId', requireAuth, async (req: AuthRequest, res) => {
  const { productId } = req.params
  const userId = req.userId!
  await prisma.favorite.deleteMany({ where: { userId, productId } })
  res.status(204).send()
})

export default router
