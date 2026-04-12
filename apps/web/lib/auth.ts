import { cache } from 'react'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { appPool } from '@/lib/db/index'

// Re-export shared types/constants so server code can import everything from '@/lib/auth'
export { SESSION_UI_COOKIE } from './auth-shared'
export type { Session, SessionUI } from './auth-shared'

import type { Session, SessionUI } from './auth-shared'

const SESSION_COOKIE = 'clinic_session'
const SESSION_UI_COOKIE = 'clinic_session_ui'

// ── HMAC signing helpers ────────────────────────────────────────────────────

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET environment variable is required')
  return secret
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('hex')
}

function verifySignature(payload: string, signature: string): boolean {
  const expected = signPayload(payload)
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null

  try {
    const dotIdx = raw.lastIndexOf('.')
    if (dotIdx === -1) return null
    const payload = raw.slice(0, dotIdx)
    const signature = raw.slice(dotIdx + 1)
    if (!verifySignature(payload, signature)) return null

    const parsed = JSON.parse(payload)
    const session: Session = { specialization: null, sessionVersion: 0, ...parsed }
    return session
  } catch {
    return null
  }
})

/**
 * 30s in-memory cache for session validation results.
 * Keyed by `userId:sessionVersion` — a deactivated user or password change
 * produces a different sessionVersion, so it always misses and hits the DB.
 * Same pattern as app/api/queue/stream/route.ts:20-45.
 */
declare global {
  // eslint-disable-next-line no-var
  var __authSessionCache: Map<string, number> | undefined
}
const authSessionCache: Map<string, number> =
  globalThis.__authSessionCache ??
  (globalThis.__authSessionCache = new Map())

const AUTH_CACHE_TTL_MS = 30_000

/**
 * Validate session version against DB.  Cached per request so multiple
 * calls within a single render only hit the database once.  Additionally
 * uses a 30s in-memory cache to skip the DB round-trip on repeat navigations.
 */
const validateSessionVersion = cache(async (userId: string, cookieVersion: number): Promise<boolean> => {
  const cacheKey = `${userId}:${cookieVersion}`
  const cachedAt = authSessionCache.get(cacheKey)
  if (cachedAt !== undefined && Date.now() - cachedAt < AUTH_CACHE_TTL_MS) {
    return true
  }

  try {
    const rows = await appPool<{ session_version: number; is_active: boolean }[]>`
      SELECT session_version, is_active FROM clinic_users WHERE id = ${userId} LIMIT 1
    `
    if (!rows[0]) return false
    if (!rows[0].is_active) return false
    if (rows[0].session_version !== cookieVersion) return false

    authSessionCache.set(cacheKey, Date.now())
    if (authSessionCache.size > 500) {
      const now = Date.now()
      for (const [k, ts] of authSessionCache.entries()) {
        if (now - ts > AUTH_CACHE_TTL_MS) authSessionCache.delete(k)
      }
    }
    return true
  } catch {
    // DB errors should deny access, not grant it
    return false
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
  const payload = JSON.stringify(session)
  const signature = signPayload(payload)
  cookieStore.set(SESSION_COOKIE, `${payload}.${signature}`, {
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

/**
 * Read session from request headers injected by middleware.
 * Zero DB queries — middleware already verified the HMAC signature.
 * Use this in Server Components and layouts instead of requireAuth().
 */
export const getSessionFromHeaders = cache(async (): Promise<Session | null> => {
  const h = await headers()
  const userId = h.get('x-session-userId')
  if (!userId) return null
  return {
    userId,
    email:          h.get('x-session-email') ?? '',
    role:           (h.get('x-session-role') ?? 'doctor') as Session['role'],
    fullName:       h.get('x-session-fullName') ?? '',
    clinicId:       h.get('x-session-clinicId') ?? '',
    clinicSlug:     h.get('x-session-clinicSlug') ?? '',
    specialization: h.get('x-session-specialization') || null,
    sessionVersion: parseInt(h.get('x-session-sessionVersion') ?? '0', 10),
  }
})
