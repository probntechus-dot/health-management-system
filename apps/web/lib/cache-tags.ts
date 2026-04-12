/**
 * Shared cache tag constants.
 *
 * Every `unstable_cache({ tags: [...] })` and every `updateTag()` /
 * `revalidateTag()` call MUST use these helpers so a tag string is
 * defined in exactly one place.  A typo here causes a compile-time
 * error instead of a silent cache-invalidation miss.
 */

export const CACHE_TAGS = {
  /** Dashboard stats — invalidated on visit / prescription mutations. */
  dashboard: (clinicSlug: string) => `dashboard:${clinicSlug}` as const,

  /** Clinic contact info (phone, address, website). */
  clinicInfo: (clinicSlug: string) => `clinic-info:${clinicSlug}` as const,

  /** Doctor credentials / profile data. */
  doctorProfile: (userId: string) => `doctor-profile:${userId}` as const,

  /** Receptionist → doctor allocation mapping. */
  allocations: (userId: string) => `allocations:${userId}` as const,
} as const
