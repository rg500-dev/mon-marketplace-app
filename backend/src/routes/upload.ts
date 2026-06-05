import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'

const router = Router()
const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads')
const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => cb(null, uploadDir),
  filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    cb(null, `${timestamp}-${file.fieldname}${ext}`)
  },
})

const upload = multer({ storage })

router.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  const file = (req as any).file as { filename: string } | undefined
  if (!file) return res.status(400).json({ error: 'No file uploaded' })
  const relativePath = `/uploads/${file.filename}`
  res.status(201).json({ data: { url: relativePath } })
})

export default router
