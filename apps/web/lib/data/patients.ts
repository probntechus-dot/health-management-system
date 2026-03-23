'use server'

// Data layer — owns all DB queries and row mapping for visits & patients.
// No auth, no FormData, no revalidation — those belong in actions/.

import { tenantSql } from '@/lib/db/tenant'
import { PAGE_SIZE } from '@/lib/constants'
import type { Visit, VisitStatus } from '@/lib/types'
import { logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/errors'

// ── Row mapping ─────────────────────────────────────────────────────────────

function mapVisitRow(row: Record<string, unknown>): Visit {
  return {
    id:               row.id               as string,
    patient_id:       row.patient_id       as string,
    doctor_id:        row.doctor_id        as string,
    token_number:     row.token_number     as number,
    token_label:      row.token_label      as string,
    reason_for_visit: row.reason_for_visit as string,
    priority:         row.priority         as string,
    status:           row.status           as VisitStatus,
    created_at:       row.created_at       as string,
    updated_at:       row.updated_at       as string,
    patient_mrn:      (row.patient_mrn     ?? 0)  as number,
    patient_name:     (row.patient_name    ?? '') as string,
    patient_age:      (row.patient_age     ?? 0)  as number,
    patient_gender:   (row.patient_gender  ?? '') as string,
    patient_contact:  (row.patient_contact ?? '') as string,
    patient_address:  (row.patient_address ?? '') as string,
  }
}

// ── Visits ──────────────────────────────────────────────────────────────────

export async function fetchVisits(clinicSlug: string, doctorIds: string[], offset = 0): Promise<Visit[]> {
  const sql = tenantSql(clinicSlug)
  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT
        v.id,
        v.patient_id,
        v.doctor_id,
        v.token_number,
        v.token_label,
        v.reason_for_visit,
        v.priority,
        v.status,
        v.created_at,
        v.updated_at,
        p.mrn            AS patient_mrn,
        p.full_name      AS patient_name,
        p.age            AS patient_age,
        p.gender         AS patient_gender,
        p.contact_number AS patient_contact,
        p.address        AS patient_address
      FROM visits v
      JOIN patients p ON p.id = v.patient_id
      WHERE v.doctor_id = ANY(${doctorIds})
      ORDER BY v.created_at ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `
    return rows.map(mapVisitRow)
  } catch (error) {
    logger.error('Error fetching visits', error)
    return []
  }
}

export async function insertVisit(
  clinicSlug: string,
  patientId: string,
  reasonForVisit: string,
  doctorId: string,
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const sql = tenantSql(clinicSlug)
  try {
    const rows = await sql<Record<string, unknown>[]>`
      WITH inserted AS (
        INSERT INTO visits (patient_id, doctor_id, reason_for_visit, status, priority)
        VALUES (${patientId}, ${doctorId}, ${reasonForVisit}, 'waiting', 'normal')
        RETURNING *
      )
      SELECT
        v.id,
        v.patient_id,
        v.doctor_id,
        v.token_number,
        v.token_label,
        v.reason_for_visit,
        v.priority,
        v.status,
        v.created_at,
        v.updated_at,
        p.mrn            AS patient_mrn,
        p.full_name      AS patient_name,
        p.age            AS patient_age,
        p.gender         AS patient_gender,
        p.contact_number AS patient_contact,
        p.address        AS patient_address
      FROM inserted v
      JOIN patients p ON p.id = v.patient_id
    `
    return { data: rows[0] ?? null, error: null }
  } catch (error: unknown) {
    logger.error('Error inserting visit', error)
    return { data: null, error: getErrorMessage(error, 'Failed to create visit') }
  }
}

export async function patchVisitStatus(
  clinicSlug: string,
  visitId: string,
  status: VisitStatus
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const sql = tenantSql(clinicSlug)
  try {
    const rows = await sql<Record<string, unknown>[]>`
      UPDATE visits SET status = ${status} WHERE id = ${visitId} RETURNING *
    `
    return { data: rows[0] ?? null, error: null }
  } catch {
    return { data: null, error: 'Failed to update visit status' }
  }
}

// ── Patients ────────────────────────────────────────────────────────────────

export async function findOrCreatePatient(
  clinicSlug: string,
  input: { full_name: string; age: number; gender: string; contact_number: string; address: string }
): Promise<{ patientId: string | null; error: string | null }> {
  const sql = tenantSql(clinicSlug)

  try {
    const rows = await sql<{ id: string }[]>`
      INSERT INTO patients (full_name, age, gender, contact_number, address)
      VALUES (${input.full_name}, ${input.age}, ${input.gender}, ${input.contact_number}, ${input.address || 'Not provided'})
      ON CONFLICT (contact_number) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        age       = EXCLUDED.age,
        gender    = EXCLUDED.gender,
        address   = EXCLUDED.address
      RETURNING id
    `
    return { patientId: rows[0]!.id, error: null }
  } catch (error: unknown) {
    logger.error('Error finding/creating patient', error)
    return { patientId: null, error: getErrorMessage(error, 'Failed to save patient record') }
  }
}
