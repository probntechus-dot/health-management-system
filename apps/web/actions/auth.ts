'use server'

import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { compare } from 'bcryptjs'
import { appPool } from '@/lib/db/index'
import { checkRateLimit } from '@/lib/rate-limit'

const SESSION_COOKIE = 'clinic_session'

export type Session = {
  userId:         string
  email:          string
  role:           'doctor' | 'receptionist'
  fullName:       string
  clinicSlug:     string
  specialization: string | null
}

export async function login(formData: FormData) {
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Rate limit: 5 attempts per 5 minutes per IP+email
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headersList.get('x-real-ip')
    ?? 'unknown'
  const rl = checkRateLimit(`login:${ip}:${email.toLowerCase()}`, 5, 300_000)
  if (!rl.allowed) {
    const waitSec = Math.ceil(rl.retryAfterMs / 1000)
    return { error: `Too many login attempts. Please wait ${waitSec} seconds.` }
  }

  const rows = await appPool<{
    id:             string
    email:          string
    password_hash:  string
    role:           'doctor' | 'receptionist'
    full_name:      string
    specialization: string | null
    is_active:      boolean
    clinic_id:      string
    clinic_slug:    string
    clinic_status:  string
  }[]>`
    SELECT
      cu.id,
      cu.email,
      cu.password_hash,
      cu.role,
      cu.full_name,
      cu.specialization,
      cu.is_active,
      cu.clinic_id,
      c.slug   AS clinic_slug,
      c.status AS clinic_status
    FROM clinic_users cu
    JOIN clinics c ON c.id = cu.clinic_id
    WHERE cu.email = ${email}
    LIMIT 1
  `

  const user = rows[0]
  if (!user) return { error: 'Invalid email or password' }

  const passwordMatch = await compare(password, user.password_hash)
  if (!passwordMatch) return { error: 'Invalid email or password' }

  if (!user.is_active)                  return { error: 'Your account has been disabled. Contact your admin.' }
  if (user.clinic_status === 'paused')  return { error: 'This clinic is currently paused. Contact support.' }
  if (user.clinic_status === 'deleted') return { error: 'Invalid email or password' }

  const session: Session = {
    userId:         user.id,
    email:          user.email,
    role:           user.role,
    fullName:       user.full_name,
    clinicSlug:     user.clinic_slug,
    specialization: user.specialization ?? null,
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    path:     '/',
    maxAge:   60 * 60 * 8,
  })

  redirect(user.role === 'doctor' ? '/doctor' : '/receptionist/patients')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/login')
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(SESSION_COOKIE)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    // Reconstruct to backfill specialization for sessions created before the field existed
    const session: Session = { specialization: null, ...parsed }
    return session
  } catch {
    return null
  }
}

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
