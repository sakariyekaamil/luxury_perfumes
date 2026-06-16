# Luxury Perfumes ERP

Luxury Perfume ERP & Business Management System — enterprise-grade platform for perfume retailers.

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, React Router, Recharts

**Backend:** Node.js, Express, TypeScript, Prisma ORM

**Database:** PostgreSQL (Neon)

## Features

- Dashboard with revenue analytics and KPIs
- Product management with barcode support
- Categories & Brands CRUD
- Inventory management (stock in/out/adjustment)
- Supplier & Customer management
- Purchase orders with approval workflow
- POS system with multi-payment methods
- Sales tracking and returns
- Payment processing (Cash, EVC Plus, Zaad, eDahab, Bank Transfer)
- Expense tracking
- Reports (daily/weekly/monthly/yearly)
- User management (Admin only)
- Audit logs
- Notifications
- Company settings
- Dark/Light mode

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

Backend `.env` is pre-configured with your Neon database. Update if needed:

```
DATABASE_URL=your_postgresql_url
JWT_SECRET=your-secret
PORT=5000
```

### 3. Setup database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Start development servers

```bash
# Terminal 1 - Backend (port 5000)
npm run dev:backend

# Terminal 2 - Frontend (port 3000)
npm run dev:frontend
```

### 5. Login

Open http://localhost:3000

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@luxuryperfumes.com | admin123 |

## Project Structure

```
├── backend/
│   ├── prisma/schema.prisma    # Database schema
│   ├── src/
│   │   ├── config/             # App configuration
│   │   ├── middleware/         # Auth, RBAC, error handling
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic layer
│   │   └── utils/              # Helpers
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page components
│   │   ├── store/              # Zustand stores
│   │   ├── lib/                # API client, utils
│   │   └── types/              # TypeScript types
│   └── package.json
└── package.json
```

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Dashboard | `/api/dashboard` |
| Products | `/api/products` |
| Catalog | `/api/catalog` |
| Operations | `/api/operations` |
| Admin | `/api/admin` |

## Roles & Permissions

| Role | Access Level |
|------|-------------|
| Super Admin | Full access to all modules |
| Admin | Full access except user deletion |

Only admin roles can log in and appear in User Management.

## Production Build

```bash
npm run build:backend
npm run build:frontend
```

## License

Proprietary — Luxury Perfumes
