import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

const router = Router()
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads')

// Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Configuration Cloudinary (si configuré)
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET

let storage: any

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  // @ts-ignore
  const CloudinaryStorage = require('multer-storage-cloudinary')
  storage = CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'marketplace-uploads',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' }
      ]
    } as any,
  })
} else {
  // Stockage local (fallback)
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueName + path.extname(file.originalname))
    }
  })
}

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req: Request, file: any, cb: any) => {
    const allowedTypes = /jpeg|jpg|png|webp/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Seuls les fichiers JPEG, PNG et WebP sont autorisés'))
  }
})

router.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  const file = (req as any).file
  if (!file) return res.status(400).json({ error: 'No file uploaded' })
  
  const url = useCloudinary ? file.path : `/uploads/${file.filename}`
  res.status(201).json({ 
    data: { 
      url,
      publicId: file.filename
    } 
  })
})

export default router
