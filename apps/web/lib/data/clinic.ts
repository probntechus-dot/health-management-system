import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { appPool } from '@/lib/db/index'
import { CACHE_TAGS } from '@/lib/cache-tags'

export type ClinicInfo = {
  phone: string | null
  address: string | null
  website: string | null
}

export type DoctorProfile = {
  credentials: string | null
  prescription_template_id: string | null
}

// ── Cross-request persistent cache tags ──────────────────────────────────────
// Tag format keeps invalidation scoped: clinic info is per-slug,
// doctor profile is per-user. Call revalidateTag(tag) in the mutation
// action to bust the cache without a full redeploy.

/** Fetch clinic contact details. Cached across requests; invalidated by tag. */
export const getClinicInfo = cache(
  (clinicSlug: string): Promise<ClinicInfo> =>
    unstable_cache(
      async () => {
        try {
          const rows = await appPool<{ phone: string | null; address: string | null; website: string | null }[]>`
            SELECT phone, address, website FROM clinics WHERE slug = ${clinicSlug} LIMIT 1
          `
          return rows[0] ?? { phone: null, address: null, website: null }
        } catch {
          return { phone: null, address: null, website: null }
        }
      },
      [`clinic-info:${clinicSlug}`],
      { tags: [CACHE_TAGS.clinicInfo(clinicSlug)], revalidate: 3600 }
    )()
)

export type AllocatedDoctor = {
  id: string
  full_name: string
  specialization: string | null
}

/** Get the doctor IDs a user is scoped to. Doctor → [self]. Receptionist → allocated doctors. */
export const getAllocatedDoctorIds = cache(
  (userId: string, role: string, _clinicId: string): Promise<string[]> => {
    if (role === 'doctor') return Promise.resolve([userId])
    if (role === 'receptionist') {
      return unstable_cache(
        async () => {
          const rows = await appPool<{ doctor_id: string }[]>`
            SELECT doctor_id FROM receptionist_doctors WHERE receptionist_id = ${userId}
          `
          return rows.map(r => r.doctor_id)
        },
        [`allocated-doctor-ids:${userId}`],
        { tags: [CACHE_TAGS.allocations(userId)], revalidate: 600 }
      )()
    }
    return Promise.resolve([])
  }
)

/** Get the full doctor list a receptionist is allocated to. */
export const getAllocatedDoctors = cache(
  (userId: string, role: string, _clinicId: string): Promise<AllocatedDoctor[]> => {
    if (role === 'doctor') {
      return unstable_cache(
        async () => {
          const rows = await appPool<AllocatedDoctor[]>`
            SELECT id, full_name, specialization FROM clinic_users WHERE id = ${userId}
          `
          return rows
        },
        [`allocated-doctors:${userId}:doctor`],
        { tags: [CACHE_TAGS.doctorProfile(userId)], revalidate: 3600 }
      )()
    }
    if (role === 'receptionist') {
      return unstable_cache(
        async () => {
          const rows = await appPool<AllocatedDoctor[]>`
            SELECT cu.id, cu.full_name, cu.specialization
            FROM receptionist_doctors rd
            JOIN clinic_users cu ON cu.id = rd.doctor_id
            WHERE rd.receptionist_id = ${userId} AND cu.is_active = true
            ORDER BY cu.full_name
          `
          return rows
        },
        [`allocated-doctors:${userId}:receptionist`],
        { tags: [CACHE_TAGS.allocations(userId)], revalidate: 600 }
      )()
    }
    return Promise.resolve([])
  }
)

/** Fetch doctor credentials (e.g., "MBBS, FCPS"). Cached across requests; invalidated by tag. */
export const getDoctorProfile = cache(
  (userId: string): Promise<DoctorProfile> =>
    unstable_cache(
      async () => {
        try {
          const rows = await appPool<{ credentials: string | null; prescription_template_id: string | null }[]>`
            SELECT credentials, prescription_template_id FROM clinic_users WHERE id = ${userId} LIMIT 1
          `
          return rows[0] ?? { credentials: null, prescription_template_id: null }
        } catch {
          return { credentials: null, prescription_template_id: null }
        }
      },
      [`doctor-profile:${userId}`],
      { tags: [CACHE_TAGS.doctorProfile(userId)], revalidate: 3600 }
    )()
)
