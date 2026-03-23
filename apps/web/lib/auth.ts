import { cache } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { appPool } from '@/lib/db/index'

// Re-export shared types/constants so server code can import everything from '@/lib/auth'
export { SESSION_UI_COOKIE } from './auth-shared'
export type { Session, SessionUI } from './auth-shared'

import type { Session, SessionUI } from './auth-shared'

const SESSION_COOKIE = 'clinic_session'
const SESSION_UI_COOKIE = 'clinic_session_ui'

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    const session: Session = { specialization: null, sessionVersion: 0, ...parsed }
    return session
  } catch {
    return null
  }
})

/**
 * Validate session version against DB.  Cached per request so multiple
 * calls within a single render only hit the database once.
 */
const validateSessionVersion = cache(async (userId: string, cookieVersion: number): Promise<boolean> => {
  try {
    const rows = await appPool<{ session_version: number; is_active: boolean }[]>`
      SELECT session_version, is_active FROM clinic_users WHERE id = ${userId} LIMIT 1
    `
    if (!rows[0]) return false
    if (!rows[0].is_active) return false
    return rows[0].session_version === cookieVersion
  } catch {
    // If the column doesn't exist yet (pre-migration), allow the session
    return true
  }
})

export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')

  const valid = await validateSessionVersion(session.userId, session.sessionVersion)
  if (!valid) {
    await clearSessionCookies()
    redirect('/login')
  }

  return session
}

export async function requireRole(allowedRoles: Session['role'][]): Promise<Session> {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) redirect('/login')
  return session
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/** Write both the httpOnly session cookie and the client-readable UI cookie. */
export async function writeSessionCookies(session: Session) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  const ui: SessionUI = {
    fullName: session.fullName,
    email: session.email,
    role: session.role,
    specialization: session.specialization,
  }
  cookieStore.set(SESSION_UI_COOKIE, JSON.stringify(ui), {
    httpOnly: false,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

/** Bump session_version in DB to invalidate all existing sessions for a user. */
export async function invalidateUserSessions(userId: string): Promise<void> {
  await appPool`UPDATE clinic_users SET session_version = session_version + 1 WHERE id = ${userId}`
}

/** Delete both session cookies. */
export async function clearSessionCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(SESSION_UI_COOKIE)
}
