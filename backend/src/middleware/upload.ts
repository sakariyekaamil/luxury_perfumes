import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export const LOGO_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'logos');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function ensureLocalUploadDir() {
  if (!config.isServerless) {
    fs.mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });
  }
}

const memoryStorage = multer.memoryStorage();

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureLocalUploadDir();
    cb(null, LOGO_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `logo-${uuidv4()}${ext}`);
  },
});

export const logoUpload = multer({
  storage: config.isServerless ? memoryStorage : diskStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

export function saveLocalLogo(file: Express.Multer.File): string {
  ensureLocalUploadDir();
  const ext = path.extname(file.originalname).toLowerCase() || '.png';
  const filename = `logo-${uuidv4()}${ext}`;
  const filePath = path.join(LOGO_UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/logos/${filename}`;
}

export function deleteLocalLogo(logoUrl?: string | null) {
  if (!logoUrl || !logoUrl.startsWith('/uploads/logos/')) return;
  const filePath = path.join(process.cwd(), logoUrl.replace(/^\//, '').replace(/\//g, path.sep));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
