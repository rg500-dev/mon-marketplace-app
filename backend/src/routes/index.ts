import { Router } from 'express'
import authRoutes from './auth'
import productsRoutes from './products'
import categoriesRoutes from './categories'
import messagesRoutes from './messages'
import favoritesRoutes from './favorites'

const router = Router()

router.use('/', authRoutes)
router.use('/', productsRoutes)
router.use('/', categoriesRoutes)
router.use('/', messagesRoutes)
router.use('/', favoritesRoutes)

export default router
