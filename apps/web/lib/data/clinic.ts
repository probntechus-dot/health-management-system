import { cache } from 'react'
import { appPool } from '@/lib/db/index'

export type ClinicInfo = {
  phone: string | null
  address: string | null
  website: string | null
}

export type DoctorProfile = {
  credentials: string | null
}

/** Fetch clinic contact details (phone, address, website). Cached per request. */
export const getClinicInfo = cache(async (clinicSlug: string): Promise<ClinicInfo> => {
  try {
    const rows = await appPool<{ phone: string | null; address: string | null; website: string | null }[]>`
      SELECT phone, address, website FROM clinics WHERE slug = ${clinicSlug} LIMIT 1
    `
    return rows[0] ?? { phone: null, address: null, website: null }
  } catch {
    // Columns may not exist yet on older databases
    return { phone: null, address: null, website: null }
  }
})

export type AllocatedDoctor = {
  id: string
  full_name: string
  specialization: string | null
}

/** Get the doctor IDs a user is scoped to. Doctor → [self]. Receptionist → allocated doctors. */
export const getAllocatedDoctorIds = cache(async (
  userId: string,
  role: string,
  _clinicId: string,
): Promise<string[]> => {
  if (role === 'doctor') return [userId]
  if (role === 'receptionist') {
    const rows = await appPool<{ doctor_id: string }[]>`
      SELECT doctor_id FROM receptionist_doctors WHERE receptionist_id = ${userId}
    `
    return rows.map(r => r.doctor_id)
  }
  // clinic_admin should not access clinical data
  return []
})

/** Get the full doctor list a receptionist is allocated to. */
export const getAllocatedDoctors = cache(async (
  userId: string,
  role: string,
  _clinicId: string,
): Promise<AllocatedDoctor[]> => {
  if (role === 'doctor') {
    const rows = await appPool<AllocatedDoctor[]>`
      SELECT id, full_name, specialization FROM clinic_users WHERE id = ${userId}
    `
    return rows
  }
  if (role === 'receptionist') {
    const rows = await appPool<AllocatedDoctor[]>`
      SELECT cu.id, cu.full_name, cu.specialization
      FROM receptionist_doctors rd
      JOIN clinic_users cu ON cu.id = rd.doctor_id
      WHERE rd.receptionist_id = ${userId} AND cu.is_active = true
      ORDER BY cu.full_name
    `
    return rows
  }
  return []
})

/** Fetch doctor credentials (e.g., "MBBS, FCPS"). Cached per request. */
export const getDoctorProfile = cache(async (userId: string): Promise<DoctorProfile> => {
  try {
    const rows = await appPool<{ credentials: string | null }[]>`
      SELECT credentials FROM clinic_users WHERE id = ${userId} LIMIT 1
    `
    return rows[0] ?? { credentials: null }
  } catch {
    // Column may not exist yet on older databases
    return { credentials: null }
  }
})
