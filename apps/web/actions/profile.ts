'use server'

import { cookies } from 'next/headers'
import { compare, hash } from 'bcryptjs'
import { appPool } from '@/lib/db/index'
import { requireAuth, type Session } from './auth'

const SESSION_COOKIE = 'clinic_session'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function writeSession(session: Session) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    path:     '/',
    maxAge:   60 * 60 * 8,
  })
}

// ── Profile actions ───────────────────────────────────────────────────────────

export async function updateProfileName(fullName: string): Promise<{ success: true } | { error: string }> {
  const session = await requireAuth()

  fullName = fullName.trim()
  if (!fullName || fullName.length < 2) return { error: 'Name must be at least 2 characters' }
  if (fullName.length > 100)            return { error: 'Name is too long' }

  try {
    await appPool`UPDATE clinic_users SET full_name = ${fullName} WHERE id = ${session.userId}`
    await writeSession({ ...session, fullName })
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update name' }
  }
}

export async function updateSpecialization(specialization: string): Promise<{ success: true } | { error: string }> {
  const session = await requireAuth()

  specialization = specialization.trim()
  if (specialization.length > 150) return { error: 'Specialization is too long' }

  try {
    await appPool`
      UPDATE clinic_users SET specialization = ${specialization || null} WHERE id = ${session.userId}
    `
    await writeSession({ ...session, specialization: specialization || null })
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update specialization' }
  }
}

export async function updateProfilePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: true } | { error: string }> {
  const session = await requireAuth()

  if (!currentPassword)       return { error: 'Current password is required' }
  if (newPassword.length < 8) return { error: 'New password must be at least 8 characters' }

  const rows = await appPool<{ password_hash: string }[]>`
    SELECT password_hash FROM clinic_users WHERE id = ${session.userId}
  `
  if (!rows[0]) return { error: 'User not found' }

  const match = await compare(currentPassword, rows[0].password_hash)
  if (!match) return { error: 'Current password is incorrect' }

  try {
    const newHash = await hash(newPassword, 12)
    await appPool`UPDATE clinic_users SET password_hash = ${newHash} WHERE id = ${session.userId}`
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update password' }
  }
}
