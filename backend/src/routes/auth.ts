import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { sendWelcomeEmail } from '../services/emailService'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d'

// Register
router.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body
    if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' })

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
    if (existing) return res.status(400).json({ error: 'User already exists' })

    const hashed = await bcrypt.hash(password, 10)
    const verificationToken = Math.random().toString(36).slice(2, 12)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashed,
        firstName,
        lastName,
        verificationToken,
      },
    })

    const token = jwt.sign({ userId: user.id } as any, JWT_SECRET as any, { expiresIn: JWT_EXPIRATION } as any)
    const safeUser = { ...user, password: undefined, verificationToken: undefined }
    res.status(201).json({ token, user: safeUser, verificationToken })

    // Email de bienvenue (asynchrone)
    sendWelcomeEmail(email, username, verificationToken)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' })
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(400).json({ error: 'Invalid credentials' })
    if (!user.verified) return res.status(403).json({ error: 'Account needs verification' })
    if (user.isSuspended) return res.status(403).json({ error: 'Account suspended' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ userId: user.id } as any, JWT_SECRET as any, { expiresIn: JWT_EXPIRATION } as any)
    const safeUser = { ...user, password: undefined }
    res.json({ token, user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Verify account
router.post('/auth/verify', async (req, res) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'Verification token required' })
    const user = await prisma.user.findFirst({ where: { verificationToken: token } })
    if (!user) return res.status(404).json({ error: 'Invalid verification token' })

    await prisma.user.update({ where: { id: user.id }, data: { verified: true, verificationToken: null } })
    res.json({ success: true, message: 'Account verified' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Current user
router.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'Not found' })
    const safeUser = { ...user, password: undefined }
    res.json({ user: safeUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
