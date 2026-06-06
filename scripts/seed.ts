import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import bcryptjs from 'bcryptjs'
import * as schema from '../db/schema'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    const poolConnection = await mysql.createPool({
      uri: DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })

    const db = drizzle(poolConnection, { schema, mode: 'default' })

    const hashedPassword = await bcryptjs.hash(process.env.SEED_ADMIN_PASSWORD || 'demo123', 10)

    console.log('👤 Creating admin user...')
    await db.insert(schema.users).values({
      email: process.env.SEED_ADMIN_EMAIL || 'admin@lab.local',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      active: true,
    })

    console.log('✅ Admin user created successfully')
    console.log(`   Email: ${process.env.SEED_ADMIN_EMAIL || 'admin@lab.local'}`)
    console.log(`   Password: ${process.env.SEED_ADMIN_PASSWORD || 'demo123'}`)

    await poolConnection.end()
    console.log('✅ Database seed completed!')
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message)
    process.exit(1)
  }
}

seed()
