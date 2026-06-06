# KDS Lab - Sample Tracking & KDS Dashboard

A lab sample tracking and KDS (Knowledge Data System) dashboard for environmental testing laboratories. Built with Next.js 15, TypeScript, Drizzle ORM, and NextAuth.js.

## Phase 1: Foundation (Current)

This phase sets up the core data layer, authentication, and master-data management so admins can configure categories and tests.

### Features

- ✅ User authentication with email/password (NextAuth.js)
- ✅ Role-based access control (admin, front_desk, analyst, reviewer, signatory)
- ✅ Category management (CRUD)
- ✅ Test management (CRUD)
- ✅ MySQL database with Drizzle ORM
- ✅ TypeScript for type safety
- ✅ Tailwind CSS + basic component library

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MySQL 8+ with Drizzle ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Deployment**: Vercel + MySQL (PlanetScale/Railway)

## Prerequisites

- Node.js 18+
- npm or yarn
- MySQL 8+ database (local or managed)

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd KDS-SG
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local .env.local
```

Update `.env.local` with your database credentials:

```env
# Database - use one of:
# Local: mysql://root:password@localhost:3306/kds_lab
# PlanetScale: mysql://user:password@aws.connect.psdb.cloud/dbname?sslaccept=strict
# Railway: mysql://user:password@host:port/dbname
DATABASE_URL=mysql://user:password@localhost:3306/kds_lab

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-chars-change-in-prod

# Seed admin user credentials (optional)
SEED_ADMIN_EMAIL=admin@lab.local
SEED_ADMIN_PASSWORD=demo123
```

### 3. Create Database

```bash
# Using MySQL CLI
mysql -u root -p -e "CREATE DATABASE kds_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Or use Drizzle Kit to push the schema:
npx drizzle-kit push
```

### 4. Seed Admin User (Optional)

```bash
npm run seed
```

This creates a test admin user:
- **Email**: admin@lab.local
- **Password**: demo123

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                           # Next.js app directory
│   ├── api/auth/[...nextauth]/    # NextAuth API route
│   ├── admin/                     # Admin-only routes (protected)
│   │   ├── categories/            # Category CRUD
│   │   └── tests/                 # Test CRUD
│   ├── auth/                      # Auth pages
│   │   └── signin/                # Login page
│   ├── dashboard/                 # User dashboard
│   └── layout.tsx                 # Root layout
├── auth/                          # Authentication configuration
│   └── authOptions.ts             # NextAuth config & credentials provider
├── components/                    # Reusable components
│   ├── admin/                     # Admin-specific components
│   ├── ui/                        # Basic UI components (button, input, card, etc.)
│   ├── MainLayout.tsx             # Main app layout with sidebar
│   └── Providers.tsx              # NextAuth SessionProvider wrapper
├── db/                            # Database layer
│   ├── schema.ts                  # Drizzle schema definitions
│   ├── index.ts                   # Database connection
│   └── migrations/                # Drizzle migrations (generated)
├── lib/                           # Utility functions
│   └── actions/                   # Server actions
│       ├── categories.ts          # Category CRUD actions
│       └── tests.ts               # Test CRUD actions
├── middleware.ts                  # Route protection middleware
├── types/                         # TypeScript type definitions
│   └── next-auth.d.ts             # NextAuth type augmentations
├── scripts/                       # Utility scripts
│   └── seed.ts                    # Database seeding
└── public/                        # Static assets
```

## Database Schema

### Users
- `id` (int, PK)
- `email` (string, unique)
- `password` (string, bcrypt hashed)
- `name` (string)
- `role` (enum: admin, front_desk, analyst, reviewer, signatory)
- `active` (boolean)
- `createdAt` (timestamp)

### Categories
- `id` (int, PK)
- `code` (string, unique) - e.g., 'WW', 'AA'
- `name` (string) - e.g., 'Wastewater'
- `defaultTatHours` (int)
- `color` (string, hex) - e.g., '#1D9E75'
- `active` (boolean, soft-delete)
- `createdAt`, `updatedAt` (timestamps)

### Tests
- `id` (int, PK)
- `categoryId` (int, FK)
- `name` (string) - e.g., 'pH'
- `unit` (string) - e.g., 'pH units'
- `defaultMethod` (string, optional)
- `active` (boolean, soft-delete)
- `createdAt`, `updatedAt` (timestamps)

### Samples (Schema in place, CRUD in Phase 2)
- `id` (int, PK)
- `sampleCode` (string, unique) - Format: SG/YYYYMMDD/NNN
- `categoryId` (int, FK)
- `client` (string)
- `source` (string, optional)
- `samplingAt`, `receivedAt` (datetime)
- `receivedBy` (int, FK to users)
- `status` (enum: registered, assigned, in_analysis, under_review, approved, reported, closed)
- `dueAt` (datetime, nullable)
- `createdAt`, `updatedAt` (timestamps)

## Authentication

The app uses NextAuth.js with a Credentials provider:

1. User enters email + password on `/auth/signin`
2. Credentials are checked against hashed passwords in the `users` table
3. On success, a JWT token is issued and stored in a secure HTTP-only cookie
4. Routes like `/admin/*` are protected by middleware that checks for valid tokens and admin role
5. Session data is available on client via `useSession()` hook

**Protected Routes:**
- `/admin/categories` - Admin only
- `/admin/tests` - Admin only
- `/dashboard` - Any authenticated user

## Server Actions

All data mutations use server actions in `lib/actions/`:

- **Categories**: `createCategory`, `updateCategory`, `deleteCategory`, `getCategories`
- **Tests**: `createTest`, `updateTest`, `deleteTest`, `getTestsByCategory`

Each action:
1. Checks admin permission (calls `auth()` to verify JWT token)
2. Executes database query
3. Returns `{ success: true }` or `{ success: false, error: "message" }`

## Development Notes

- **Soft Deletes**: Categories and tests are soft-deleted (set `active = false`) to preserve referential integrity
- **Dynamic Pages**: Admin pages use `export const dynamic = 'force-dynamic'` to fetch fresh data on each request
- **Type Safety**: Full TypeScript strict mode enabled
- **Error Handling**: Try-catch blocks in server actions; graceful fallbacks in pages

## Running Tests

```bash
# Build for production
npm run build

# Run production build
npm start

# Lint
npm run lint
```

## What's Next (Phase 2)

- Sample intake form & registration
- Test assignment to analysts
- Analyst workbench for data entry
- KDS board with real-time polling
- Status tracking & events
- Client portal preview

## Deployment

### To Vercel

```bash
git push origin main
```

Vercel will automatically deploy on push. Configure environment variables in the Vercel dashboard.

### Database Setup on Vercel

1. Create a MySQL database on PlanetScale or Railway
2. Add `DATABASE_URL` to Vercel environment variables
3. Run migrations: `npx drizzle-kit push`

## Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` is correct and database is running
- Check firewall/network access
- For PlanetScale, ensure SSL is properly configured

### Auth Not Working
- Ensure `NEXTAUTH_SECRET` is set (use `openssl rand -base64 32` to generate)
- Clear cookies in browser dev tools
- Check NextAuth logs in terminal

### Build Errors
- Delete `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Ensure Node.js version is 18+

## Support & Feedback

Report issues at: https://github.com/anthropics/claude-code/issues
