// In-memory client-side cache — lives for the duration of the browser session.
// Three independent caches with explicit contracts:
//   visitsCache         — shared across all PatientQueue instances; invalidated on new visit
//   medicinesCache      — loaded once per clinic, invalidated on clinic switch
//   prescriptionsCache  — per-patient per-clinic, invalidated after a prescription is saved
//
// All three caches are keyed by clinicSlug to prevent cross-tenant data leakage
// when a user switches between clinic sessions in the same browser tab.

import { getMedicines, getPrescriptionsByPatient } from '@/actions/prescriptions'
import type { Medicine, Prescription, Visit } from '@/lib/types'

// ── Patient contact search result shape ──────────────────────────────────────

export type PatientMatch = {
  full_name: string
  age: number | null
  gender: string | null
  address: string | null
  contact_number: string
}

// ── Visits ────────────────────────────────────────────────────────────────────
// Shared across every PatientQueue instance (doctor view + doctor/patients page).
// Navigation between pages remounts the component but the module-level store
// survives — so the second mount reads from memory, no DB round-trip.
// The slug of the clinic whose data is currently cached is recorded so that
// a session switch in the same tab automatically discards stale data.

let visitsData: Visit[] | null = null
let visitsClinicSlug: string | null = null

export const visitsCache = {
  get(clinicSlug: string): Visit[] | null {
    if (visitsClinicSlug !== clinicSlug) return null
    return visitsData
  },

  set(clinicSlug: string, visits: Visit[]) {
    visitsClinicSlug = clinicSlug
    visitsData = visits
  },

  append(clinicSlug: string, visits: Visit[]) {
    if (visitsClinicSlug !== clinicSlug) {
      visitsClinicSlug = clinicSlug
      visitsData = visits
      return
    }
    if (!visitsData) { visitsData = visits; return }
    visitsData = [...visitsData, ...visits]
  },

  patchStatus(visitId: string, status: Visit['status']) {
    if (!visitsData) return
    visitsData = visitsData.map(v => v.id === visitId ? { ...v, status } : v)
  },

  invalidate() {
    visitsData = null
    visitsClinicSlug = null
  },

  searchByContact(clinicSlug: string, query: string): PatientMatch[] {
    if (!visitsData || visitsClinicSlug !== clinicSlug || query.length < 3) return []
    const q = query.toLowerCase()
    const seen = new Set<string>()
    const results: PatientMatch[] = []
    for (let i = visitsData.length - 1; i >= 0 && results.length < 5; i--) {
      const v = visitsData[i]!
      if (v.status === 'cancelled') continue
      if (!v.patient_contact?.toLowerCase().includes(q)) continue
      const key = `${v.patient_name}|${v.patient_contact}`
      if (seen.has(key)) continue
      seen.add(key)
      results.push({
        full_name: v.patient_name, age: v.patient_age, gender: v.patient_gender,
        address: v.patient_address, contact_number: v.patient_contact,
      })
    }
    return results
  },
}

// ── Medicines ────────────────────────────────────────────────────────────────
// Loaded once per clinic. If the active clinic changes, the cached data is
// discarded and a fresh fetch is made for the new clinic.

let medicinesData: Medicine[] | null = null
let medicinesClinicSlug: string | null = null
let medicinesPromise: Promise<Medicine[]> | null = null

export async function getCachedMedicines(clinicSlug: string): Promise<Medicine[]> {
  // Stale check: clinic changed since last load.
  if (medicinesClinicSlug !== clinicSlug) {
    medicinesData = null
    medicinesClinicSlug = null
    medicinesPromise = null
  }

  if (medicinesData) return medicinesData

  if (!medicinesPromise) {
    medicinesPromise = getMedicines().then(data => {
      medicinesData = data as Medicine[]
      medicinesClinicSlug = clinicSlug
      medicinesPromise = null
      return medicinesData
    }).catch(err => {
      // Clear the rejected promise so the next call retries instead of returning the same rejection
      medicinesPromise = null
      throw err
    })
  }

  return medicinesPromise
}

export async function searchCachedDrugs(clinicSlug: string, query: string): Promise<Medicine[]> {
  if (!query || query.trim().length < 2) return []
  const all = await getCachedMedicines(clinicSlug)
  const q = query.trim().toLowerCase()
  return all.filter(m =>
    m.name.toLowerCase().includes(q) ||
    m.generic_name?.toLowerCase().includes(q)
  ).slice(0, 8)
}

// ── Prescriptions ────────────────────────────────────────────────────────────
// Keyed by `${clinicSlug}:${patientId}` to prevent cross-clinic collisions
// and to discard entries from a previous clinic session automatically.

const MAX_PRESCRIPTION_CACHE_SIZE = 50
const prescriptionsMap = new Map<string, Prescription[]>()
const prescriptionsInFlight = new Map<string, Promise<Prescription[]>>()

function prescriptionKey(clinicSlug: string, patientId: string): string {
  return `${clinicSlug}:${patientId}`
}

export async function getCachedPrescriptions(clinicSlug: string, patientId: string): Promise<Prescription[]> {
  const key = prescriptionKey(clinicSlug, patientId)
  if (prescriptionsMap.has(key)) return prescriptionsMap.get(key)!

  if (!prescriptionsInFlight.has(key)) {
    const promise = getPrescriptionsByPatient(patientId).then(data => {
      // Evict oldest entry when cache is full (Map preserves insertion order)
      if (prescriptionsMap.size >= MAX_PRESCRIPTION_CACHE_SIZE) {
        const oldest = prescriptionsMap.keys().next().value
        if (oldest !== undefined) prescriptionsMap.delete(oldest)
      }
      prescriptionsMap.set(key, data as Prescription[])
      prescriptionsInFlight.delete(key)
      return prescriptionsMap.get(key)!
    })
    prescriptionsInFlight.set(key, promise)
  }

  return prescriptionsInFlight.get(key)!
}

export function invalidatePrescriptions(clinicSlug: string, patientId: string) {
  prescriptionsMap.delete(prescriptionKey(clinicSlug, patientId))
}
