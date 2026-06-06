import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL || 'mysql://localhost:3306/kds_lab'

export default defineConfig({
  dialect: 'mysql',
  schema: './db/schema.ts',
  out: './db/migrations',
  dbCredentials: {
    url: databaseUrl,
  } as any,
})
