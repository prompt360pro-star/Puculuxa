import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const multerStorageCloudinary = require('multer-storage-cloudinary');

@Injectable()
export class ImageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'puculuxa-dev',
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  getStorage() {
    // multer-storage-cloudinary v2 uses default export or .CloudinaryStorage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const CloudinaryStorage =
      multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'puculuxa/products',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      },
    });
  }

  uploadImage(file: Express.Multer.File & { secure_url?: string }): string {
    return file.path || file.secure_url || '';
  }
}
