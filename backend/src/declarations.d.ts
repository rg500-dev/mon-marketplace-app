declare module 'multer-storage-cloudinary' {
  import { StorageEngine } from 'multer'
  import { v2 as cloudinary } from 'cloudinary'

  interface CloudinaryStorageOptions {
    cloudinary: typeof cloudinary
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
