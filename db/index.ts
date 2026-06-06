import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from './schema'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

export async function getDb() {
  const poolConnection = await mysql.createPool({
    uri: DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })

  return drizzle(poolConnection, { schema, mode: 'default' })
}

export type Db = Awaited<ReturnType<typeof getDb>>
