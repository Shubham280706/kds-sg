import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

const pool = mysql.createPool({
  uri: DATABASE_URL,
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 0,
})

export const db = drizzle(pool, { schema, mode: 'default' })

export async function getDb() {
  return db
}

export type Db = Awaited<ReturnType<typeof getDb>>