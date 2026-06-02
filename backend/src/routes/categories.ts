import { Router } from 'express'
import { prisma } from '../prisma'

const router = Router()

router.get('/categories', async (req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  res.json({ data: categories })
})

router.get('/categories/:id/products', async (req, res) => {
  const { id } = req.params
  const products = await prisma.product.findMany({ where: { categoryId: id, status: 'active' } })
  res.json({ data: products })
})

export default router
