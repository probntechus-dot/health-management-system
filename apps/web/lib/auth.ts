import { cache } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

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
    const session: Session = { specialization: null, ...parsed }
    return session
  } catch {
    return null
  }
})

export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireRole(allowedRoles: Session['role'][]): Promise<Session> {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) redirect('/login')
  return session
}

/** Write both the httpOnly session cookie and the client-readable UI cookie. */
export async function writeSessionCookies(session: Session) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
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
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

/** Delete both session cookies. */
export async function clearSessionCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  cookieStore.delete(SESSION_UI_COOKIE)
}
