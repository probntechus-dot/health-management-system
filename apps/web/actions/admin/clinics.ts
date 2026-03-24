"use server"

import { hash } from "bcryptjs"
import { adminPool } from "@/lib/db/index"
import { createClinicSchema, dropClinicSchema } from "@/lib/db/provision"
import { deleteClinicEmitter } from "@/lib/events"
import { getErrorMessage } from "@/lib/errors"
import { requireAdmin } from "./auth"

// ── Types ────────────────────────────────────────────────────────────────────

export type ClinicRow = {
  id: string
  slug: string
  name: string
  status: "active" | "paused" | "deleted"
  plan: "active" | "trial" | "suspended"
  trial_expires_at: string | null
  payment_notes: string | null
  created_at: string
  user_count: number
}

export type AddClinicInput = {
  name: string
  slug: string
  maxDoctors?: number
  maxReceptionists?: number
  adminFullName: string
  adminEmail: string
  adminPassword: string
}

export type ClinicUserRow = {
  id: string
  full_name: string
  email: string
  role: "doctor" | "receptionist" | "clinic_admin"
  specialization: string | null
  credentials: string | null
  is_active: boolean
}

// ── DB migration (idempotent) ────────────────────────────────────────────────

export async function runClinicsMigration() {
  await requireAdmin()
  await adminPool`
    ALTER TABLE clinics
      ADD COLUMN IF NOT EXISTS plan             TEXT        NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS payment_notes    TEXT
  `
  await adminPool`
    ALTER TABLE clinic_users
      ADD COLUMN IF NOT EXISTS specialization    TEXT,
      ADD COLUMN IF NOT EXISTS session_version   INTEGER NOT NULL DEFAULT 0
  `
  // Ensure clinic_app has the required DML permissions on platform tables
  await adminPool.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON clinic_users TO clinic_app`)
  await adminPool.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON receptionist_doctors TO clinic_app`)
}

// ── Clinic CRUD ──────────────────────────────────────────────────────────────

export async function listClinics(): Promise<ClinicRow[]> {
  await requireAdmin()
  const rows = await adminPool<ClinicRow[]>`
    SELECT
      c.id,
      c.slug,
      c.name,
      c.status,
      COALESCE(c.plan, 'active')  AS plan,
      c.trial_expires_at::TEXT    AS trial_expires_at,
      c.payment_notes,
      c.created_at::TEXT          AS created_at,
      COUNT(cu.id)::INT           AS user_count
    FROM clinics c
    LEFT JOIN clinic_users cu ON cu.clinic_id = c.id
    WHERE c.status != 'deleted'
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `
  return rows
}

export async function addClinic(input: AddClinicInput) {
  await requireAdmin()

  const { name, slug, adminFullName, adminEmail, adminPassword, maxDoctors = 5, maxReceptionists = 5 } = input

  if (!/^[a-z0-9_]+$/.test(slug))
    return { error: "Slug must be lowercase letters, numbers, and underscores only" }
  if (slug.length > 50)
    return { error: "Slug must be 50 characters or fewer" }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(adminEmail))
    return { error: "Admin email is not a valid email address" }
  if (adminPassword.length < 8)
    return { error: "Admin password must be at least 8 characters" }

  const existing = await adminPool<{ id: string }[]>`
    SELECT id FROM clinics WHERE slug = ${slug} LIMIT 1
  `
  if (existing.length > 0) return { error: `Slug ${slug} is already taken` }

  const adminHash = await hash(adminPassword, 12)

  try {
    const clinic = await adminPool<{ id: string }[]>`
      INSERT INTO clinics (slug, name, status, max_doctors, max_receptionists)
      VALUES (${slug}, ${name}, 'active', ${maxDoctors}, ${maxReceptionists})
      RETURNING id
    `
    const clinicId = clinic[0]!.id

    await adminPool`
      INSERT INTO clinic_users (clinic_id, email, password_hash, role, full_name)
      VALUES (${clinicId}, ${adminEmail}, ${adminHash}, 'clinic_admin', ${adminFullName})
    `
    await createClinicSchema(slug, adminPool)

    return { success: true }
  } catch (error) {
    try {
      await adminPool`DELETE FROM clinics WHERE slug = ${slug}`
    } catch {
      /* best effort */
    }
    return { error: getErrorMessage(error, 'Failed to create clinic') }
  }
}

export async function pauseClinic(
  id: string
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    await adminPool`UPDATE clinics SET status = 'paused' WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

export async function resumeClinic(
  id: string
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    await adminPool`UPDATE clinics SET status = 'active' WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

export async function deleteClinic(id: string) {
  await requireAdmin()
  const rows = await adminPool<{ slug: string }[]>`
    SELECT slug FROM clinics WHERE id = ${id} LIMIT 1
  `
  if (rows.length === 0) return { error: "Clinic not found" }
  const { slug } = rows[0]!
  try {
    // Drop the tenant schema first — if this fails the clinic row is still
    // intact and the operation can be retried.  Reversing the order would
    // leave an orphaned schema when the DROP fails.
    await dropClinicSchema(slug, adminPool)
    await adminPool`DELETE FROM clinics WHERE id = ${id}`
    deleteClinicEmitter(slug)
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error, 'Failed to delete clinic') }
  }
}

// ── Clinic plan management ───────────────────────────────────────────────────

export async function setClinicPlan(
  id: string,
  plan: "active" | "trial" | "suspended",
  trialExpiresAt: string | null,
  paymentNotes: string | null
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    await adminPool`
      UPDATE clinics
      SET plan             = ${plan},
          trial_expires_at = ${trialExpiresAt ? new Date(trialExpiresAt) : null},
          payment_notes    = ${paymentNotes ?? null}
      WHERE id = ${id}
    `
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

// ── Clinic users management ──────────────────────────────────────────────────

export async function listClinicUsers(
  clinicId: string
): Promise<ClinicUserRow[]> {
  await requireAdmin()
  const rows = await adminPool<ClinicUserRow[]>`
    SELECT id, full_name, email, role, specialization, credentials, is_active
    FROM clinic_users
    WHERE clinic_id = ${clinicId}
    ORDER BY
      CASE role WHEN 'clinic_admin' THEN 0 WHEN 'doctor' THEN 1 WHEN 'receptionist' THEN 2 END,
      full_name
  `
  return rows
}

export async function updateClinicUser(
  userId: string,
  data: { fullName?: string; newPassword?: string }
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  // Validate all inputs before any writes to prevent partial-apply
  if (data.newPassword && data.newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  try {
    if (data.fullName) {
      await adminPool`UPDATE clinic_users SET full_name = ${data.fullName} WHERE id = ${userId}`
    }
    if (data.newPassword) {
      const passwordHash = await hash(data.newPassword, 12)
      await adminPool`UPDATE clinic_users SET password_hash = ${passwordHash} WHERE id = ${userId}`
    }
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}
