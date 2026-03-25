'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { compare } from 'bcryptjs'
import { appPool } from '@/lib/db/index'
import { checkRateLimit } from '@/lib/rate-limit'
import { writeSessionCookies, clearSessionCookies } from '@/lib/auth'
import type { Session } from '@/lib/auth'

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
    id:              string
    email:           string
    password_hash:   string
    role:            'doctor' | 'receptionist' | 'clinic_admin'
    full_name:       string
    specialization:  string | null
    session_version: number
    is_active:       boolean
    clinic_id:       string
    clinic_slug:     string
    clinic_status:   string
    clinic_plan:     string
    trial_expires_at: string | null
  }[]>`
    SELECT
      cu.id,
      cu.email,
      cu.password_hash,
      cu.role,
      cu.full_name,
      cu.specialization,
      COALESCE(cu.session_version, 0) AS session_version,
      cu.is_active,
      cu.clinic_id,
      c.slug   AS clinic_slug,
      c.status AS clinic_status,
      COALESCE(c.plan, 'active') AS clinic_plan,
      c.trial_expires_at
    FROM clinic_users cu
    JOIN clinics c ON c.id = cu.clinic_id
    WHERE cu.email = ${email.toLowerCase()}
    LIMIT 1
  `

  const user = rows[0]
  if (!user) return { error: 'Invalid email or password' }

  const passwordMatch = await compare(password, user.password_hash)
  if (!passwordMatch) return { error: 'Invalid email or password' }

  if (!user.is_active)                  return { error: 'Your account has been disabled. Contact your admin.' }
  if (user.clinic_status === 'paused')  return { error: 'This clinic is currently paused. Contact support.' }
  if (user.clinic_status === 'deleted') return { error: 'Invalid email or password' }
  if (user.clinic_plan === 'suspended') return { error: 'Your clinic account has been suspended. Please contact support.' }
  if (user.clinic_plan === 'trial' && user.trial_expires_at && new Date(user.trial_expires_at) < new Date()) {
    return { error: 'Your trial has expired. Please upgrade to continue.' }
  }

  const session: Session = {
    userId:         user.id,
    email:          user.email,
    role:           user.role,
    fullName:       user.full_name,
    clinicId:       user.clinic_id,
    clinicSlug:     user.clinic_slug,
    specialization: user.specialization ?? null,
    sessionVersion: user.session_version,
  }

  await writeSessionCookies(session)

  const redirectMap: Record<string, string> = {
    doctor: '/doctor',
    receptionist: '/receptionist/patients',
    clinic_admin: '/clinic-admin',
  }
  redirect(redirectMap[user.role] ?? '/login')
}

export async function logout() {
  await clearSessionCookies()
  redirect('/login')
}
