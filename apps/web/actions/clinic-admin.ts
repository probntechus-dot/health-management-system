'use server'

import { hash } from 'bcryptjs'
import { appPool } from '@/lib/db/index'
import { requireRole } from '@/lib/auth'

// ── Types ────────────────────────────────────────────────────────────────────

export type ClinicUserRow = {
  id: string
  full_name: string
  email: string
  role: 'doctor' | 'receptionist' | 'clinic_admin'
  specialization: string | null
  credentials: string | null
  is_active: boolean
  allocated_doctor_ids: string[]
}

export type ClinicLimits = {
  max_doctors: number
  max_receptionists: number
  doctor_count: number
  receptionist_count: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireClinicAdmin() {
  return requireRole(['clinic_admin'])
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function getClinicUsers(): Promise<ClinicUserRow[]> {
  const session = await requireClinicAdmin()

  const users = await appPool<{
    id: string
    full_name: string
    email: string
    role: string
    specialization: string | null
    credentials: string | null
    is_active: boolean
  }[]>`
    SELECT id, full_name, email, role, specialization, credentials, is_active
    FROM clinic_users
    WHERE clinic_id = ${session.clinicId}
    ORDER BY
      CASE role WHEN 'clinic_admin' THEN 0 WHEN 'doctor' THEN 1 WHEN 'receptionist' THEN 2 END,
      full_name
  `

  // Fetch allocations for receptionists
  const receptionistIds = users.filter(u => u.role === 'receptionist').map(u => u.id)
  let allocations: { receptionist_id: string; doctor_id: string }[] = []
  if (receptionistIds.length > 0) {
    allocations = await appPool<{ receptionist_id: string; doctor_id: string }[]>`
      SELECT receptionist_id, doctor_id FROM receptionist_doctors
      WHERE receptionist_id = ANY(${receptionistIds})
    `
  }

  return users.map(u => ({
    ...u,
    role: u.role as ClinicUserRow['role'],
    allocated_doctor_ids: allocations
      .filter(a => a.receptionist_id === u.id)
      .map(a => a.doctor_id),
  }))
}

export async function getClinicLimits(): Promise<ClinicLimits> {
  const session = await requireClinicAdmin()

  const [limits] = await appPool<{ max_doctors: number; max_receptionists: number }[]>`
    SELECT max_doctors, max_receptionists FROM clinics WHERE id = ${session.clinicId}
  `

  const counts = await appPool<{ role: string; count: string }[]>`
    SELECT role, COUNT(*)::text AS count
    FROM clinic_users
    WHERE clinic_id = ${session.clinicId} AND is_active = true AND role IN ('doctor', 'receptionist')
    GROUP BY role
  `

  const countMap: Record<string, number> = {}
  for (const r of counts) countMap[r.role] = parseInt(r.count)

  return {
    max_doctors: limits?.max_doctors ?? 5,
    max_receptionists: limits?.max_receptionists ?? 5,
    doctor_count: countMap['doctor'] ?? 0,
    receptionist_count: countMap['receptionist'] ?? 0,
  }
}

// ── Create ───────────────────────────────────────────────────────────────────

export async function addUser(data: {
  fullName: string
  email: string
  password: string
  role: 'doctor' | 'receptionist'
  specialization?: string
  credentials?: string
  allocatedDoctorIds?: string[]
}): Promise<{ success: true } | { error: string }> {
  const session = await requireClinicAdmin()

  // Validate
  if (!data.fullName.trim() || data.fullName.length < 2) return { error: 'Name must be at least 2 characters' }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(data.email)) return { error: 'Invalid email address' }
  if (data.password.length < 8) return { error: 'Password must be at least 8 characters' }

  // Check limits
  const limits = await getClinicLimits()
  if (data.role === 'doctor' && limits.doctor_count >= limits.max_doctors) {
    return { error: `Doctor limit reached (${limits.max_doctors}). Contact support to increase.` }
  }
  if (data.role === 'receptionist' && limits.receptionist_count >= limits.max_receptionists) {
    return { error: `Receptionist limit reached (${limits.max_receptionists}). Contact support to increase.` }
  }

  // Check email uniqueness
  const existing = await appPool<{ id: string }[]>`
    SELECT id FROM clinic_users WHERE email = ${data.email.toLowerCase()} LIMIT 1
  `
  if (existing.length > 0) return { error: 'This email is already in use' }

  const passwordHash = await hash(data.password, 12)

  try {
    const rows = await appPool<{ id: string }[]>`
      INSERT INTO clinic_users (clinic_id, email, password_hash, role, full_name, specialization, credentials)
      VALUES (
        ${session.clinicId},
        ${data.email.toLowerCase()},
        ${passwordHash},
        ${data.role},
        ${data.fullName.trim()},
        ${data.specialization?.trim() || null},
        ${data.credentials?.trim() || null}
      )
      RETURNING id
    `

    // Set receptionist allocations
    if (data.role === 'receptionist' && data.allocatedDoctorIds?.length) {
      const userId = rows[0]!.id
      for (const doctorId of data.allocatedDoctorIds) {
        await appPool`
          INSERT INTO receptionist_doctors (receptionist_id, doctor_id)
          VALUES (${userId}, ${doctorId})
          ON CONFLICT DO NOTHING
        `
      }
    }

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { error: `Failed to add user: ${msg}` }
  }
}

// ── Update ───────────────────────────────────────────────────────────────────

export async function updateUser(
  userId: string,
  data: {
    fullName?: string
    email?: string
    specialization?: string
    credentials?: string
    newPassword?: string
  }
): Promise<{ success: true } | { error: string }> {
  const session = await requireClinicAdmin()

  // Verify user belongs to this clinic
  const [user] = await appPool<{ clinic_id: string }[]>`
    SELECT clinic_id FROM clinic_users WHERE id = ${userId}
  `
  if (!user || user.clinic_id !== session.clinicId) return { error: 'User not found' }

  try {
    if (data.fullName?.trim()) {
      await appPool`UPDATE clinic_users SET full_name = ${data.fullName.trim()} WHERE id = ${userId}`
    }
    if (data.email) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(data.email)) return { error: 'Invalid email' }
      await appPool`UPDATE clinic_users SET email = ${data.email.toLowerCase()} WHERE id = ${userId}`
    }
    if (data.specialization !== undefined) {
      await appPool`UPDATE clinic_users SET specialization = ${data.specialization.trim() || null} WHERE id = ${userId}`
    }
    if (data.credentials !== undefined) {
      await appPool`UPDATE clinic_users SET credentials = ${data.credentials.trim() || null} WHERE id = ${userId}`
    }
    if (data.newPassword) {
      if (data.newPassword.length < 8) return { error: 'Password must be at least 8 characters' }
      const passwordHash = await hash(data.newPassword, 12)
      await appPool`UPDATE clinic_users SET password_hash = ${passwordHash} WHERE id = ${userId}`
    }
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function setReceptionistDoctors(
  receptionistId: string,
  doctorIds: string[]
): Promise<{ success: true } | { error: string }> {
  const session = await requireClinicAdmin()

  // Verify receptionist belongs to this clinic
  const [user] = await appPool<{ clinic_id: string; role: string }[]>`
    SELECT clinic_id, role FROM clinic_users WHERE id = ${receptionistId}
  `
  if (!user || user.clinic_id !== session.clinicId || user.role !== 'receptionist') {
    return { error: 'Receptionist not found' }
  }

  try {
    // Clear existing and re-insert
    await appPool`DELETE FROM receptionist_doctors WHERE receptionist_id = ${receptionistId}`
    for (const doctorId of doctorIds) {
      await appPool`
        INSERT INTO receptionist_doctors (receptionist_id, doctor_id)
        VALUES (${receptionistId}, ${doctorId})
        ON CONFLICT DO NOTHING
      `
    }
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

// ── Deactivate / Activate ────────────────────────────────────────────────────

export async function toggleUserActive(
  userId: string,
  isActive: boolean
): Promise<{ success: true } | { error: string }> {
  const session = await requireClinicAdmin()

  // Can't deactivate yourself
  if (userId === session.userId) return { error: 'Cannot deactivate your own account' }

  const [user] = await appPool<{ clinic_id: string }[]>`
    SELECT clinic_id FROM clinic_users WHERE id = ${userId}
  `
  if (!user || user.clinic_id !== session.clinicId) return { error: 'User not found' }

  try {
    await appPool`UPDATE clinic_users SET is_active = ${isActive} WHERE id = ${userId}`
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}
