import { v2 as cloudinary } from 'cloudinary';
import { config, isCloudinaryConfigured } from '../config';

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

export async function uploadLogoBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'luxury-perfumes/logos',
    resource_type: 'image',
    overwrite: true,
    transformation: [{ width: 400, height: 400, crop: 'limit' }],
  });

  return result.secure_url;
}

export async function deleteCloudinaryLogo(logoUrl?: string | null): Promise<void> {
  if (!logoUrl || !isCloudinaryConfigured() || !logoUrl.includes('cloudinary.com')) return;

  try {
    const url = new URL(logoUrl);
    const pathParts = url.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return;

    const afterUpload = pathParts.slice(uploadIndex + 1);
    const versionIndex = afterUpload.findIndex((part) => /^v\d+$/.test(part));
    const publicIdParts = versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;
    const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.warn('Failed to delete Cloudinary logo:', error);
  }
}
