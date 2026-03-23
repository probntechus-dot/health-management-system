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
