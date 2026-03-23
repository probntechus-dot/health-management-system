// ── Patient (one row per unique person) ─────────────────────────────────────

export type Patient = {
  id: string
  mrn: number
  full_name: string
  age: number
  gender: string
  contact_number: string
  address: string
  created_at: string
  updated_at: string
}

// ── Visit (one row per appointment) ─────────────────────────────────────────

export type VisitStatus = 'waiting' | 'called' | 'checked' | 'cancelled'

/** Visit row with denormalized patient fields for display convenience. */
export type Visit = {
  id: string
  patient_id: string
  doctor_id: string
  token_number: number
  token_label: string
  reason_for_visit: string
  priority: string
  status: VisitStatus
  created_at: string
  updated_at: string
  // Denormalized from patients JOIN
  patient_mrn: number
  patient_name: string
  patient_age: number
  patient_gender: string
  patient_contact: string
  patient_address: string
}

export type NewVisitInput = {
  full_name: string
  age: number
  gender: string
  contact_number: string
  address: string
  reason_for_visit: string
}

// ── Medicine ────────────────────────────────────────────────────────────────

export type Medicine = {
  id: string
  name: string
  generic_name: string
  dosage_form: string
  strength: string
  category: string
}

export type PrescriptionMedicine = {
  name: string
  /** Canonical dosage form key (e.g. 'tablet', 'syrup'). Absent in legacy records. */
  dosage_form?: string
  /**
   * Full display name combining name + strength + form label.
   * e.g. "Augmentin 625mg (Tablet)"
   * Auto-computed on save; absent in legacy records (fall back to `name`).
   */
  display_name?: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

// ── Prescription ────────────────────────────────────────────────────────────

export type Prescription = {
  id: string
  visit_id: string
  diagnosis: string
  problem_list: string | null
  notes: string
  medicines: PrescriptionMedicine[]
  allergies: string | null
  follow_up: string | null
  suggested_tests: string[] | null
  created_at: string
}
