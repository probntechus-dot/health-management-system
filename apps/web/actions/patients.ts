'use server'

import { headers } from 'next/headers'
import { requireAuth } from './auth'
import { revalidatePath } from 'next/cache'
import { updateTag } from 'next/cache'
import { fetchVisits, findOrCreatePatient, insertVisit, patchVisitStatus } from '@/lib/data/patients'
import { tenantSql } from '@/lib/db/tenant'
import { checkRateLimit } from '@/lib/rate-limit'
import { emitQueueEvent } from '@/lib/events'
import type { VisitStatus } from '@/lib/types'
import { normalizePhoneNumber } from '@/lib/utils'

export async function getAllVisits(offset = 0) {
  const session = await requireAuth()
  return fetchVisits(session.clinicSlug, offset)
}

export async function createVisit(formData: FormData) {
  const session = await requireAuth()

  // Rate limit: 10 registrations per minute per IP
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? headersList.get('x-real-ip')
    ?? 'unknown'
  const rl = checkRateLimit(`createVisit:${ip}`, 10, 60_000)
  if (!rl.allowed) {
    const waitSec = Math.ceil(rl.retryAfterMs / 1000)
    return { error: `Too many registrations. Please wait ${waitSec} seconds and try again.` }
  }

  const full_name        = formData.get('fullName') as string
  const age              = parseInt(formData.get('age') as string)
  const gender           = formData.get('gender') as string
  const contact_number   = formData.get('contact') as string
  const address          = formData.get('address') as string
  const reason_for_visit = formData.get('reasonForVisit') as string

  if (!full_name || !age || !gender || !contact_number || !reason_for_visit) {
    return { error: 'All required fields must be filled' }
  }

  if (age < 1 || age > 150) {
    return { error: 'Age must be between 1 and 150' }
  }

  const normalizedContact = normalizePhoneNumber(contact_number)
  if (!normalizedContact) {
    return { error: 'Contact number must be a valid Pakistan number (11 digits starting with 03, or 12 digits starting with 92)' }
  }

  // Block duplicate same-day visit for the same contact number
  const sql = tenantSql(session.clinicSlug)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const existing = await sql<{ id: string; token_label: string; status: string }[]>`
    SELECT v.id, v.token_label, v.status
    FROM visits v
    JOIN patients p ON p.id = v.patient_id
    WHERE p.contact_number = ${normalizedContact}
      AND v.status != 'cancelled'
      AND v.created_at >= ${todayStart.toISOString()}
    LIMIT 1
  `

  if (existing.length > 0) {
    const e = existing[0]!
    return { error: `This patient already has a token today (${e.token_label}). Status: ${e.status}. Use the existing record instead.` }
  }

  // Find or create the patient record
  const patientResult = await findOrCreatePatient(session.clinicSlug, {
    full_name,
    age,
    gender,
    contact_number: normalizedContact,
    address,
  })
  if (patientResult.error) return { error: patientResult.error }

  // Create the visit
  const visitResult = await insertVisit(session.clinicSlug, patientResult.patientId!, reason_for_visit)
  if (visitResult.error) return { error: visitResult.error }

  revalidatePath('/receptionist')
  revalidatePath('/doctor')
  updateTag(`dashboard:${session.clinicSlug}`)
  emitQueueEvent(session.clinicSlug, { type: 'visit_added' })

  return { success: true, visit: visitResult.data }
}

export async function findPatientsByContact(contact: string) {
  const session = await requireAuth()
  const sanitized = contact.replace(/[%_]/g, '').replace(/\D/g, '')
  if (!sanitized) return []

  // Rate limit: 30 lookups per minute per user (keyed by userId, not clinicSlug,
  // so multiple receptionists at the same clinic have independent counters)
  const rl = checkRateLimit(`findPatientsByContact:${session.userId}`, 30, 60_000)
  if (!rl.allowed) return []

  const sql = tenantSql(session.clinicSlug)
  const rows = await sql<{ full_name: string; age: number; gender: string; address: string; contact_number: string }[]>`
    SELECT full_name, age, gender, address, contact_number
    FROM patients
    WHERE contact_number ILIKE ${'%' + sanitized + '%'}
    ORDER BY updated_at DESC
    LIMIT 5
  `
  return rows
}

export async function updateVisitStatus(visitId: string, status: VisitStatus) {
  const session = await requireAuth()

  const result = await patchVisitStatus(session.clinicSlug, visitId, status)
  if (result.error) return { error: result.error }

  revalidatePath('/receptionist')
  revalidatePath('/doctor')
  updateTag(`dashboard:${session.clinicSlug}`)
  emitQueueEvent(session.clinicSlug, { type: 'status_changed', visitId, status })

  return { success: true, visit: result.data }
}
