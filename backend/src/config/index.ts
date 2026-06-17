import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isServerless = Boolean(process.env.VERCEL);

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  isProduction,
  isServerless,
  frontendUrl: process.env.FRONTEND_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'luxury-bms-secret-key-2024',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'luxury-bms-refresh-secret-key-2024',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    config.cloudinary.cloudName &&
    config.cloudinary.apiKey &&
    config.cloudinary.apiSecret
  );
}

export function validateProductionConfig(): void {
  if (!isProduction) return;

  const missing: string[] = [];
  if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (isServerless && !isCloudinaryConfigured()) {
    console.warn(
      'Cloudinary is not configured. Logo uploads will not persist on Vercel without CLOUDINARY_* env vars.'
    );
  }
}
