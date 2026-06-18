import { Router, Request, Response } from 'express'
import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
// @ts-ignore
const CloudinaryStorage = require('multer-storage-cloudinary')

const router = Router()

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configuration du stockage Cloudinary
const storage = CloudinaryStorage({
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
  
  res.status(201).json({ 
    data: { 
      url: file.path,
      publicId: file.filename
    } 
  })
})

export default router
