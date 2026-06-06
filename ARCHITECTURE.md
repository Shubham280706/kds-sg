# KDS Lab Architecture

## Overview

KDS Lab is a multi-phase lab sample tracking system designed to handle:
1. **Phase 1**: Foundation (data layer, auth, master data management)
2. **Phase 2**: Sample workflow (intake, assignment, analysis, KDS board)
3. **Phase 3**: Reporting & client portal

This document covers Phase 1 architecture.

## Core Principles

1. **Type Safety**: Full TypeScript strict mode throughout
2. **Security**: Role-based access control (RBAC) enforced server-side
3. **Data Integrity**: Soft deletes, foreign key constraints, audit trails
4. **Scalability**: Stateless server actions, connection pooling, async operations
5. **User Experience**: Real-time UI feedback, optimistic updates where sensible

## Technology Choices

### Framework: Next.js 15 (App Router)
- Modern React with server components
- Built-in API routes for NextAuth
- Automatic code splitting & optimization
- Dynamic route protection via middleware

### Authentication: NextAuth.js v5
- JWT-based stateless sessions
- Secure HTTP-only cookies
- Type-safe session callbacks
- Extensible provider architecture (add OAuth/OIDC later)

### Database: MySQL + Drizzle ORM
- Relational data structure with strong constraints
- Type-safe queries (no SQL strings)
- Migration support via drizzle-kit
- Connection pooling for production stability

### UI: Tailwind + Custom Components
- No external component library (minimal dependencies)
- Custom button, input, card components
- Easy to swap for shadcn/ui later
- Responsive design from ground up

## Authentication Flow

```
User                          Client                    Server
  |                             |                          |
  +------ /auth/signin -------->|                          |
  |                             |                          |
  |                             +---- POST /api/auth/callback/credentials
  |                             |                          |
  |                             |    Check credentials     |
  |                             |<-----against DB----------+
  |                             |                          |
  |<----- JWT token set in cookie                          |
  |       (HTTP-only, secure)    |                          |
  |                             |                          |
  +------ GET /admin/categories +---- Middleware checks JWT
  |                             |                          |
  |                             |    Valid? Correct role?
  |                             |<-----Yes, allow---------+
  |                             |                          |
  |                             +---- Fetch categories
  |                             |<-----Return data--------+
  |                             |                          |
  |<---- Render page with data  |                          |
```

### Session Data Structure

```typescript
// JWT Token
{
  id: "1",
  email: "admin@lab.local",
  name: "Admin User",
  role: "admin",
  iat: 1717...
}

// Session (available to client via useSession())
{
  user: {
    id: "1",
    email: "admin@lab.local",
    name: "Admin User",
    role: "admin"
  },
  expires: "2026-07-06T..."
}
```

## Data Layer Architecture

### Server Actions Pattern

Server actions provide a clean boundary between client and server:

```
Client Component
      |
      |-- "use client" directive
      |-- React state & UI
      |-- Call server action on form submit
      |
      v
Server Action (lib/actions/*)
      |
      |-- Security: Check auth & permissions
      |-- Validation: Zod or manual checks
      |-- Database: Execute mutation
      |-- Return: { success, data/error }
      |
      v
Client Component
      |
      |-- Revalidate local state
      |-- Show success/error toast
```

### Database Access Pattern

All database access is centralized through:

1. **Schema Definition** (`db/schema.ts`)
   - Drizzle table definitions
   - Relations between entities
   - Constraints and indexes

2. **Connection** (`db/index.ts`)
   - Single connection pool
   - Async initialization
   - Reusable across server actions

3. **Queries** (Pages & Server Actions)
   - Use `db.query.*` for reads
   - Use `db.insert/update/delete` for writes
   - Type-safe: TypeScript catches errors

Example:
```typescript
// This is type-safe - TypeScript knows the shape of `users`
const user = await db.query.users.findFirst({
  where: eq(users.email, email)
})
// Error at compile time if user.password doesn't exist
const isValid = await bcrypt.compare(password, user.password)
```

## Route Protection

### Middleware (`middleware.ts`)

Protects routes before they execute:

```
Request → Middleware
           |
           +-- Is path /admin/* or /dashboard/*?
               |
               +-- Yes: Check JWT token validity
                   |
                   +-- Valid? Yes: Continue
                   +-- Valid? No: Redirect to /auth/signin
               |
               +-- No: Continue
               |
               v
            Route Handler
```

### Server Actions

Perform additional checks:

```typescript
export async function createCategory(...) {
  const session = await auth()
  
  // Double-check: middleware ensures JWT is valid,
  // but server action rechecks role
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  
  // ... database mutation
}
```

## Soft Deletes

Categories and tests use soft deletes (set `active = false`) instead of hard deletes:

**Benefits:**
- Preserves referential integrity (samples can still reference deleted categories)
- Audit trail: When was this deleted?
- Easy recovery if deletion was accidental
- No orphaned records

**Implementation:**
```typescript
// Delete is actually an update
await db
  .update(categories)
  .set({ active: false })
  .where(eq(categories.id, id))

// Queries automatically filter
const active = await db.query.categories.findMany({
  where: eq(categories.active, true)
})
```

## Error Handling Strategy

### Server Actions
```typescript
export async function createCategory(data) {
  try {
    // Validation, auth, database
    return { success: true, id: result.insertId }
  } catch (error: any) {
    // Return error to client, don't throw
    return { success: false, error: error.message }
  }
}
```

### Client Components
```typescript
// Call server action and handle result
const result = await createCategory(formData)

if (result.success) {
  setCategories([...categories, newCategory])
  setMessage('Created successfully')
} else {
  setMessage(`Error: ${result.error}`)
}
```

### Database Errors
- Handled in try-catch in server actions
- Logged to console
- Returned as user-friendly messages
- Never exposed raw SQL or stack traces

## Future Extensions

### Phase 2: Workflow
- Extend categories with `createdBy` audit field
- Add status transition table (statusEvents)
- Implement real-time updates via WebSockets or polling
- Add sample intake form with file upload

### Phase 3: Reporting
- Analytics dashboard (SQL aggregations)
- Report generation (PDF export)
- Client portal (read-only access to their samples)
- Compliance audit logging

### Performance Optimizations
- Database query caching (Redis)
- File storage (S3 or Vercel Blob)
- Real-time subscriptions (Pusher/Supabase)
- Search indexing (Elasticsearch)

## Deployment Checklist

- [ ] Set `NEXTAUTH_SECRET` (32+ random chars)
- [ ] Configure database connection string
- [ ] Run `npx drizzle-kit push` to sync schema
- [ ] Seed test users: `npm run seed`
- [ ] Test login flow end-to-end
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Enable HTTPS enforcement
- [ ] Configure CORS headers if needed
- [ ] Set up error tracking (Sentry)
- [ ] Add monitoring (DataDog)
- [ ] Document API endpoints for Phase 2 integration
