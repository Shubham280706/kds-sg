import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'mysql',
  schema: './db/schema.ts',
  out: './db/migrations',
  dbCredentials: {
    url: 'mysql://kds_user:root123@127.0.0.1:3306/kds_lab',
  } as any,
})
