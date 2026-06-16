/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F172A',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0F172A',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#fdf8e8',
          100: '#f9ecd0',
          200: '#f3d9a1',
          300: '#ecc66f',
          400: '#D4AF37',
          500: '#c49a2e',
          600: '#a67c24',
          700: '#885f1c',
          800: '#6a4814',
          900: '#4c320d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
