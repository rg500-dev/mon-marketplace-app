import { Router } from 'express'
import authRoutes from './auth'
import productsRoutes from './products'
import categoriesRoutes from './categories'
import createMessagesRoutes from './messages'
import favoritesRoutes from './favorites'
import notificationsRoutes from './notifications'
import usersRoutes from './users'
import reviewsRoutes from './reviews'
import uploadRoutes from './upload'
import adminRoutes from './admin'
import reportsRoutes from './reports'
import offersRoutes from './offers'
import paymentRoutes from './payment'
import savedSearchesRoutes from './savedSearches'
import sellerRoutes from './seller'

export default function createRoutes(io: any, loginLimiter?: any) {
  const router = Router()

  router.use('/', loginLimiter ? (req, res, next) => {
    if (req.path === '/auth/login') {
      return loginLimiter(req, res, next)
    }
    next()
  } : (req, res, next) => next())

  router.use('/', authRoutes)
  router.use('/', productsRoutes)
  router.use('/', categoriesRoutes)
  router.use('/', createMessagesRoutes(io))
  router.use('/', favoritesRoutes)
  router.use('/', notificationsRoutes)
  router.use('/', usersRoutes)
  router.use('/', reviewsRoutes)
  router.use('/', uploadRoutes)
  router.use('/', adminRoutes)
  router.use('/', reportsRoutes)
  router.use('/', offersRoutes)
  router.use('/payment', paymentRoutes)
  router.use('/', savedSearchesRoutes)
  router.use('/', sellerRoutes)
  return router
}
