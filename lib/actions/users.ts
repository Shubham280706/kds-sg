'use server'

import { getDb } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth/authOptions'
import bcryptjs from 'bcryptjs'

async function checkAdmin() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized: Admin only')
  }
  return (session.user as any).id
}

export async function createUser(data: {
  email: string
  name: string
  role: string
  password: string
}) {
  try {
    await checkAdmin()
    const db = await getDb()

    // Check email unique
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })
    if (existing) {
      return { success: false, error: 'Email already exists' }
    }

    // Validate password
    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' }
    }

    const hashedPassword = await bcryptjs.hash(data.password, 10)

    const result = await db.insert(users).values({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role as any,
      active: true,
    })

    return { success: true, userId: result[0].insertId }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateUser(userId: number, data: {
  email: string
  name: string
  role: string
  active: boolean
}) {
  try {
    await checkAdmin()
    const db = await getDb()

    // Check email unique (if changed)
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })
    if (existing && existing.id !== userId) {
      return { success: false, error: 'Email already exists' }
    }

    await db
      .update(users)
      .set({
        email: data.email,
        name: data.name,
        role: data.role as any,
        active: data.active,
      })
      .where(eq(users.id, userId))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteUser(userId: number) {
  try {
    const adminId = await checkAdmin()
    
    // Prevent deleting self
    if (userId === parseInt(adminId, 10)) {
      return { success: false, error: 'Cannot delete your own account' }
    }

    const db = await getDb()
    
    // Soft delete
    await db.update(users).set({ active: false }).where(eq(users.id, userId))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getAllUsers() {
  try {
    await checkAdmin()
    const db = await getDb()

    const allUsers = await db.query.users.findMany({
      orderBy: (users, { asc }) => [asc(users.email)],
    })

    return { success: true, users: allUsers }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getUsersByRole(role: string) {
  try {
    const db = await getDb()

    const roleUsers = await db.query.users.findMany({
      where: (users, { eq: dbEq, and }) => and(dbEq(users.role, role as any), dbEq(users.active, true)),
      orderBy: (users, { asc }) => [asc(users.name)],
    })

    return { success: true, users: roleUsers }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
