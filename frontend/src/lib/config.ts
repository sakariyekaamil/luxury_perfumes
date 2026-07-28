const raw =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://luxury-perfumes-three.vercel.app/api');

export const API_BASE_URL = raw.replace(/\/$/, '');

export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
