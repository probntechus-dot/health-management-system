'use server'

import { requireAuth, requireRole } from './auth'
import { updateVisitStatus } from './patients'
import { revalidatePath } from 'next/cache'
import { tenantSql } from '@/lib/db/tenant'
import { logger } from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'

export async function getMedicines() {
  const session = await requireAuth()
  const sql = tenantSql(session.clinicSlug)

  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT id, name, generic_name, dosage_form, strength, category
      FROM medicines
      WHERE is_active = true
      ORDER BY name
      LIMIT 1000
    `
    return rows
  } catch (error) {
    logger.error('Error fetching medicines', error)
    return []
  }
}

export async function createPrescription(formData: FormData) {
  const session = await requireRole(['doctor'])
  const sql = tenantSql(session.clinicSlug)

  const visitId            = formData.get('visitId')         as string
  const diagnosis          = formData.get('diagnosis')       as string
  const problemList        = formData.get('problemList')     as string
  const notes              = formData.get('notes')           as string
  const allergies          = formData.get('allergies')       as string
  const followUp           = formData.get('followUp')        as string
  const medicinesRaw       = formData.get('medicines')       as string
  const suggestedTestsRaw  = formData.get('suggestedTests')  as string

  if (!visitId || !diagnosis) {
    return { error: 'Visit and diagnosis are required' }
  }

  let medicines = []
  try {
    medicines = medicinesRaw ? JSON.parse(medicinesRaw) : []
  } catch {
    return { error: 'Invalid medicines data' }
  }

  let suggestedTests: string[] = []
  try {
    suggestedTests = suggestedTestsRaw ? JSON.parse(suggestedTestsRaw) : []
  } catch (e) {
    logger.error('Invalid suggestedTests JSON', e)
    return { error: 'Invalid suggested tests data' }
  }

  try {
    const rows = await sql<Record<string, unknown>[]>`
      INSERT INTO prescriptions (visit_id, medicines, diagnosis, problem_list, allergies, notes, follow_up, suggested_tests)
      VALUES (
        ${visitId},
        ${JSON.stringify(medicines)},
        ${diagnosis},
        ${problemList || null},
        ${allergies || null},
        ${notes || ''},
        ${followUp || null},
        ${suggestedTests.length > 0 ? JSON.stringify(suggestedTests) : null}
      )
      RETURNING *
    `

    await updateVisitStatus(visitId, 'checked')
    revalidatePath('/doctor')

    return { success: true, prescription: rows[0] }
  } catch (error) {
    logger.error('Error creating prescription', error)
    const msg = error instanceof Error ? error.message : String(error)
    return { error: `DB error: ${msg}` }
  }
}

export async function updatePrescription(prescriptionId: string, formData: FormData) {
  const session = await requireRole(['doctor'])
  const sql = tenantSql(session.clinicSlug)

  const diagnosis          = formData.get('diagnosis')       as string
  const problemList        = formData.get('problemList')     as string
  const notes              = formData.get('notes')           as string
  const allergies          = formData.get('allergies')       as string
  const followUp           = formData.get('followUp')        as string
  const medicinesRaw       = formData.get('medicines')       as string
  const suggestedTestsRaw  = formData.get('suggestedTests')  as string

  if (!diagnosis) {
    return { error: 'Diagnosis is required' }
  }

  let medicines = []
  try {
    medicines = medicinesRaw ? JSON.parse(medicinesRaw) : []
  } catch {
    return { error: 'Invalid medicines data' }
  }

  let suggestedTests: string[] = []
  try {
    suggestedTests = suggestedTestsRaw ? JSON.parse(suggestedTestsRaw) : []
  } catch (e) {
    logger.error('Invalid suggestedTests JSON', e)
    return { error: 'Invalid suggested tests data' }
  }

  try {
    const rows = await sql<Record<string, unknown>[]>`
      UPDATE prescriptions SET
        medicines       = ${JSON.stringify(medicines)},
        diagnosis       = ${diagnosis},
        problem_list    = ${problemList || null},
        allergies       = ${allergies || null},
        notes           = ${notes || ''},
        follow_up       = ${followUp || null},
        suggested_tests = ${suggestedTests.length > 0 ? JSON.stringify(suggestedTests) : null}
      WHERE id = ${prescriptionId}
      RETURNING *
    `

    if (rows.length === 0) {
      return { error: 'Prescription not found or already deleted.' }
    }

    revalidatePath('/doctor')
    return { success: true, prescription: rows[0] }
  } catch (error) {
    logger.error('Error updating prescription', error)
    const msg = error instanceof Error ? error.message : String(error)
    return { error: `DB error: ${msg}` }
  }
}

export async function getPrescriptionsByPatient(patientId: string) {
  const session = await requireRole(['doctor'])
  const sql = tenantSql(session.clinicSlug)

  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT pr.*
      FROM prescriptions pr
      JOIN visits v ON v.id = pr.visit_id
      WHERE v.patient_id = ${patientId}
      ORDER BY pr.created_at DESC
      LIMIT 100
    `
    return rows
  } catch (error) {
    logger.error('Error fetching patient prescriptions', error)
    return []
  }
}

function escapeSqlWildcards(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
}

export async function searchDrugs(query: string) {
  const session = await requireAuth()
  if (!query || query.trim().length < 2) return []

  // Rate limit: 60 searches per minute per user (debounced on client, but guard server too)
  const rl = checkRateLimit(`searchDrugs:${session.userId}`, 60, 60_000)
  if (!rl.allowed) return []

  const sql = tenantSql(session.clinicSlug)

  const escaped = escapeSqlWildcards(query.trim())

  try {
    const rows = await sql<Record<string, unknown>[]>`
      SELECT id, name, generic_name, dosage_form, strength
      FROM medicines
      WHERE is_active = true
        AND name ILIKE ${'%' + escaped + '%'}
      LIMIT 8
    `
    return rows
  } catch {
    return []
  }
}
