declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer'
  import cloudinaryModule from 'cloudinary'

  interface CloudinaryStorageOptions {
    // La lib accède en interne à `this.cloudinary.v2.uploader...`,
    // donc elle attend le module cloudinary complet, pas le namespace v2 seul.
    cloudinary: typeof cloudinaryModule
    params?: {
      folder?: string
      allowed_formats?: string[]
      transformation?: object[]
      public_id?: string
      type?: string
      format?: string
      [key: string]: any
    }
  }

  function CloudinaryStorage(opts: CloudinaryStorageOptions): StorageEngine

  export default CloudinaryStorage
}
