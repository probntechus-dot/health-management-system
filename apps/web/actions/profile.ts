'use server'

import { compare, hash } from 'bcryptjs'
import { appPool } from '@/lib/db/index'
import { requireAuth, writeSessionCookies, invalidateUserSessions } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

// ── Profile actions ───────────────────────────────────────────────────────────

export async function updateProfileName(fullName: string): Promise<{ success: true } | { error: string }> {
  const session = await requireAuth()

  fullName = fullName.trim()
  if (!fullName || fullName.length < 2) return { error: 'Name must be at least 2 characters' }
  if (fullName.length > 100)            return { error: 'Name is too long' }

  try {
    await appPool`UPDATE clinic_users SET full_name = ${fullName} WHERE id = ${session.userId}`
    await writeSessionCookies({ ...session, fullName })
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to update name') }
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
    await writeSessionCookies({ ...session, specialization: specialization || null })
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to update specialization') }
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
    await appPool`UPDATE clinic_users SET password_hash = ${newHash}, session_version = session_version + 1 WHERE id = ${session.userId}`
    // Re-write our own session cookie with the new version so we stay logged in
    const newVersion = session.sessionVersion + 1
    await writeSessionCookies({ ...session, sessionVersion: newVersion })
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to update password') }
  }
}
