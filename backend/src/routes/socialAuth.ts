import { Router } from 'express'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma'
import { sendWelcomeEmail } from '../services/emailService'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ===== Passport Serialization =====
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    done(null, user)
  } catch (err) {
    done(err)
  }
})

// ===== Google Strategy =====
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value
          const googleId = profile.id
          const username = profile.displayName.replace(/\s+/g, '_').toLowerCase()
          const firstName = profile.name?.givenName
          const lastName = profile.name?.familyName
          const avatar = profile.photos?.[0]?.value

          if (!email) {
            return done(new Error('No email from Google profile'))
          }

          // Check if user exists by email or googleId
          let user = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
          })

          if (user) {
            // Link Google ID if not already linked
            if (user.verificationToken !== 'google-linked') {
              await prisma.user.update({
                where: { id: user.id },
                data: { verified: true, verificationToken: 'google-linked' },
              })
            }
          } else {
            // Create new user
            const randomPassword = Math.random().toString(36).slice(2, 18)
            const hashed = await bcrypt.hash(randomPassword, 10)

            user = await prisma.user.create({
              data: {
                email,
                username: `${username}_${Math.random().toString(36).slice(2, 6)}`,
                password: hashed,
                firstName: firstName || null,
                lastName: lastName || null,
                avatar: avatar || null,
                verified: true,
                verificationToken: 'google-linked',
              },
            })

            // Email de bienvenue
            sendWelcomeEmail(email, user.username)
          }

          return done(null, user)
        } catch (err) {
          return done(err as Error)
        }
      }
    )
  )
}

// ===== Facebook Strategy =====
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails', 'name', 'photos'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value
          const facebookId = profile.id
          const username = profile.displayName.replace(/\s+/g, '_').toLowerCase()
          const firstName = profile.name?.givenName
          const lastName = profile.name?.familyName
          const avatar = profile.photos?.[0]?.value

          if (!email) {
            return done(new Error('No email from Facebook profile'))
          }

          let user = await prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
          })

          if (user) {
            if (user.verificationToken !== 'facebook-linked') {
              await prisma.user.update({
                where: { id: user.id },
                data: { verified: true, verificationToken: 'facebook-linked' },
              })
            }
          } else {
            const randomPassword = Math.random().toString(36).slice(2, 18)
            const hashed = await bcrypt.hash(randomPassword, 10)

            user = await prisma.user.create({
              data: {
                email,
                username: `${username}_${Math.random().toString(36).slice(2, 6)}`,
                password: hashed,
                firstName: firstName || null,
                lastName: lastName || null,
                avatar: avatar || null,
                verified: true,
                verificationToken: 'facebook-linked',
              },
            })

            sendWelcomeEmail(email, user.username)
          }

          return done(null, user)
        } catch (err) {
          return done(err as Error)
        }
      }
    )
  )
}

// ===== Routes =====

// Initiate Google Login
router.get('/auth/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next)
})

// Google Callback
router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err: any, user: any) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`)
    }

    const token = jwt.sign({ userId: user.id } as any, JWT_SECRET as any, { expiresIn: JWT_EXPIRATION } as any)
    const safeUser = { ...user, password: undefined, verificationToken: undefined }

    // Rediriger vers le frontend avec le token
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`)
  })(req, res, next)
})

// Initiate Facebook Login
router.get('/auth/facebook', (req, res, next) => {
  passport.authenticate('facebook', {
    scope: ['email', 'public_profile'],
    session: false,
  })(req, res, next)
})

// Facebook Callback
router.get('/auth/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err: any, user: any) => {
    if (err || !user) {
      return res.redirect(`${FRONTEND_URL}/login?error=facebook_auth_failed`)
    }

    const token = jwt.sign({ userId: user.id } as any, JWT_SECRET as any, { expiresIn: JWT_EXPIRATION } as any)
    const safeUser = { ...user, password: undefined, verificationToken: undefined }

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`)
  })(req, res, next)
})

// Route for frontend to complete login after social auth
router.get('/auth/callback', async (req, res) => {
  const { token, user: userStr } = req.query
  if (!token || !userStr) {
    return res.status(400).json({ error: 'Missing token or user data' })
  }

  try {
    const user = JSON.parse(decodeURIComponent(userStr as string))
    res.json({ token, user })
  } catch {
    res.status(400).json({ error: 'Invalid user data' })
  }
})

export default router