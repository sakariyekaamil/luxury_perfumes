import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export const LOGO_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'logos');

fs.mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOGO_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `logo-${uuidv4()}${ext}`);
  },
});

export const logoUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

export function deleteLocalLogo(logoUrl?: string | null) {
  if (!logoUrl || !logoUrl.startsWith('/uploads/logos/')) return;
  const filePath = path.join(process.cwd(), logoUrl.replace(/^\//, '').replace(/\//g, path.sep));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
