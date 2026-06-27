import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

export interface AuthRequest extends Request {
  userId?: string
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    if (!payload || !payload.userId) return res.status(401).json({ error: 'Unauthorized' })
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, isSuspended: true } })
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    if (user.isSuspended) return res.status(403).json({ error: 'Account suspended' })
    req.userId = payload.userId
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  await requireAuth(req, res, async () => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } })
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    next()
  })
}

export default requireAuth
