import { cache } from 'react'
import { appPool } from '@/lib/db/index'

export type ClinicInfo = {
  phone: string | null
  address: string | null
  website: string | null
}

export type DoctorProfile = {
  credentials: string | null
  prescription_template_id: string | null
}

/** Fetch clinic contact details. Deduplicated within a single request via React cache(). */
export const getClinicInfo = cache(
  async (clinicSlug: string): Promise<ClinicInfo> => {
    try {
      const rows = await appPool<{ phone: string | null; address: string | null; website: string | null }[]>`
        SELECT phone, address, website FROM clinics WHERE slug = ${clinicSlug} LIMIT 1
      `
      return rows[0] ?? { phone: null, address: null, website: null }
    } catch {
      return { phone: null, address: null, website: null }
    }
  }
)

export type AllocatedDoctor = {
  id: string
  full_name: string
  specialization: string | null
}

/** Get the doctor IDs a user is scoped to. Doctor → [self]. Receptionist → allocated doctors. */
export const getAllocatedDoctorIds = cache(
  async (userId: string, role: string, _clinicId: string): Promise<string[]> => {
    if (role === 'doctor') return [userId]
    if (role === 'receptionist') {
      const rows = await appPool<{ doctor_id: string }[]>`
        SELECT doctor_id FROM receptionist_doctors WHERE receptionist_id = ${userId}
      `
      return rows.map(r => r.doctor_id)
    }
    return []
  }
)

/** Get the full doctor list a receptionist is allocated to. */
export const getAllocatedDoctors = cache(
  async (userId: string, role: string, _clinicId: string): Promise<AllocatedDoctor[]> => {
    if (role === 'doctor') {
      return appPool<AllocatedDoctor[]>`
        SELECT id, full_name, specialization FROM clinic_users WHERE id = ${userId}
      `
    }
    if (role === 'receptionist') {
      return appPool<AllocatedDoctor[]>`
        SELECT cu.id, cu.full_name, cu.specialization
        FROM receptionist_doctors rd
        JOIN clinic_users cu ON cu.id = rd.doctor_id
        WHERE rd.receptionist_id = ${userId} AND cu.is_active = true
        ORDER BY cu.full_name
      `
    }
    return []
  }
)

/** Fetch doctor credentials (e.g., "MBBS, FCPS"). Deduplicated within a single request via React cache(). */
export const getDoctorProfile = cache(
  async (userId: string): Promise<DoctorProfile> => {
    try {
      const rows = await appPool<{ credentials: string | null; prescription_template_id: string | null }[]>`
        SELECT credentials, prescription_template_id FROM clinic_users WHERE id = ${userId} LIMIT 1
      `
      return rows[0] ?? { credentials: null, prescription_template_id: null }
    } catch {
      return { credentials: null, prescription_template_id: null }
    }
  }
)
