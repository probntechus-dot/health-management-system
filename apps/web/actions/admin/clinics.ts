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
  phone: string | null
  address: string | null
  website: string | null
  max_doctors: number
  max_receptionists: number
  status: "active" | "paused" | "deleted"
  plan: "active" | "trial" | "suspended"
  trial_expires_at: string | null
  payment_notes: string | null
  created_at: string
  user_count: number
  doctor_count: number
  receptionist_count: number
}

export type AddClinicInput = {
  name: string
  slug: string
  maxDoctors?: number
  maxReceptionists?: number
  adminFullName: string
  adminEmail: string
  adminPassword: string
  plan?: "active" | "trial"
}

export type ClinicUserRow = {
  id: string
  full_name: string
  email: string
  role: "doctor" | "receptionist" | "clinic_admin"
  specialization: string | null
  credentials: string | null
  is_active: boolean
  display_password: string | null
}

// ── DB migration (run manually via admin panel button) ───────────────────────
// After running, move executed statements to platform-schema.sql and remove from here.

export async function runClinicsMigration() {
  await requireAdmin()

  // ── notifications table ────────────────────────────────────────────────────
  await adminPool`
    CREATE TABLE IF NOT EXISTS notifications (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_id  UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
      title      TEXT        NOT NULL,
      message    TEXT        NOT NULL,
      type       TEXT        NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent')),
      is_read    BOOLEAN     NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await adminPool`CREATE INDEX IF NOT EXISTS idx_notifications_clinic_id ON notifications(clinic_id)`
  await adminPool`CREATE INDEX IF NOT EXISTS idx_notifications_created   ON notifications(created_at DESC)`
  await adminPool.unsafe(`GRANT SELECT, UPDATE ON notifications TO clinic_app`)

  // ── columns added after initial schema ─────────────────────────────────────
  await adminPool`
    ALTER TABLE clinics
      ADD COLUMN IF NOT EXISTS plan             TEXT        NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS payment_notes    TEXT
  `
  await adminPool`
    ALTER TABLE clinic_users
      ADD COLUMN IF NOT EXISTS specialization    TEXT,
      ADD COLUMN IF NOT EXISTS session_version   INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS display_password  TEXT
  `
  await adminPool.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON clinic_users TO clinic_app`)
  await adminPool.unsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON receptionist_doctors TO clinic_app`)

  return { success: true }
}

// ── Invalidate all sessions for a clinic ─────────────────────────────────────

export async function invalidateClinicSessions(
  clinicId: string
): Promise<void> {
  await adminPool`
    UPDATE clinic_users SET session_version = session_version + 1
    WHERE clinic_id = ${clinicId}
  `
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function sendNotification(
  clinicId: string,
  title: string,
  message: string,
  type: "info" | "warning" | "urgent" = "info"
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  if (!title.trim() || !message.trim()) return { error: "Title and message are required" }
  try {
    await adminPool`
      INSERT INTO notifications (clinic_id, title, message, type)
      VALUES (${clinicId}, ${title.trim()}, ${message.trim()}, ${type})
    `
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

export async function sendNotificationToAll(
  title: string,
  message: string,
  type: "info" | "warning" | "urgent" = "info"
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  if (!title.trim() || !message.trim()) return { error: "Title and message are required" }
  try {
    await adminPool`
      INSERT INTO notifications (clinic_id, title, message, type)
      SELECT id, ${title.trim()}, ${message.trim()}, ${type}
      FROM clinics WHERE status != 'deleted'
    `
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

export async function forceLogoutClinic(
  clinicId: string
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    await invalidateClinicSessions(clinicId)
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

// ── Clinic CRUD ──────────────────────────────────────────────────────────────

export async function listClinics(): Promise<ClinicRow[]> {
  await requireAdmin()
  const rows = await adminPool<ClinicRow[]>`
    SELECT
      c.id,
      c.slug,
      c.name,
      c.phone,
      c.address,
      c.website,
      c.max_doctors,
      c.max_receptionists,
      c.status,
      COALESCE(c.plan, 'active')  AS plan,
      c.trial_expires_at::TEXT    AS trial_expires_at,
      c.payment_notes,
      c.created_at::TEXT          AS created_at,
      COUNT(cu.id)::INT                                                                    AS user_count,
      COUNT(cu.id) FILTER (WHERE cu.role = 'doctor' AND cu.is_active = true)::INT          AS doctor_count,
      COUNT(cu.id) FILTER (WHERE cu.role = 'receptionist' AND cu.is_active = true)::INT    AS receptionist_count
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

  const { name, slug, adminFullName, adminEmail, adminPassword, maxDoctors = 5, maxReceptionists = 5, plan = "active" } = input

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
    const trialExpiresAt = plan === "trial" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null

    const clinic = await adminPool<{ id: string }[]>`
      INSERT INTO clinics (slug, name, status, max_doctors, max_receptionists, plan, trial_expires_at)
      VALUES (${slug}, ${name}, 'active', ${maxDoctors}, ${maxReceptionists}, ${plan}, ${trialExpiresAt})
      RETURNING id
    `
    const clinicId = clinic[0]!.id

    await adminPool`
      INSERT INTO clinic_users (clinic_id, email, password_hash, role, full_name, display_password)
      VALUES (${clinicId}, ${adminEmail}, ${adminHash}, 'clinic_admin', ${adminFullName}, ${adminPassword})
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
    await invalidateClinicSessions(id)
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

// ── Update clinic details ────────────────────────────────────────────────────

export async function updateClinic(
  id: string,
  data: {
    name?: string
    phone?: string
    address?: string
    website?: string
    maxDoctors?: number
    maxReceptionists?: number
    plan?: "active" | "trial" | "suspended"
    trialExpiresAt?: string | null
    paymentNotes?: string | null
  }
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  if (data.name !== undefined && !data.name.trim()) {
    return { error: "Clinic name cannot be empty" }
  }
  if (data.maxDoctors !== undefined && (data.maxDoctors < 1 || data.maxDoctors > 100)) {
    return { error: "Max doctors must be between 1 and 100" }
  }
  if (data.maxReceptionists !== undefined && (data.maxReceptionists < 1 || data.maxReceptionists > 100)) {
    return { error: "Max receptionists must be between 1 and 100" }
  }

  try {
    // Check if plan is changing to suspended — need to force logout
    let planChangedToSuspended = false
    if (data.plan === "suspended") {
      const [current] = await adminPool<{ plan: string }[]>`SELECT plan FROM clinics WHERE id = ${id}`
      if (current && current.plan !== "suspended") planChangedToSuspended = true
    }

    await adminPool`
      UPDATE clinics SET
        name              = COALESCE(${data.name?.trim() || null}, name),
        phone             = CASE WHEN ${data.phone !== undefined} THEN ${data.phone?.trim() || null} ELSE phone END,
        address           = CASE WHEN ${data.address !== undefined} THEN ${data.address?.trim() || null} ELSE address END,
        website           = CASE WHEN ${data.website !== undefined} THEN ${data.website?.trim() || null} ELSE website END,
        max_doctors       = COALESCE(${data.maxDoctors ?? null}, max_doctors),
        max_receptionists = COALESCE(${data.maxReceptionists ?? null}, max_receptionists),
        plan              = COALESCE(${data.plan ?? null}, plan),
        trial_expires_at  = CASE WHEN ${data.trialExpiresAt !== undefined} THEN ${data.trialExpiresAt ? new Date(data.trialExpiresAt) : null} ELSE trial_expires_at END,
        payment_notes     = CASE WHEN ${data.paymentNotes !== undefined} THEN ${data.paymentNotes || null} ELSE payment_notes END
      WHERE id = ${id}
    `

    if (planChangedToSuspended) {
      await invalidateClinicSessions(id)
    }

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
    SELECT id, full_name, email, role, specialization, credentials, is_active, display_password
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
  data: {
    fullName?: string
    email?: string
    specialization?: string
    credentials?: string
    newPassword?: string
  }
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  if (data.newPassword && data.newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }
  if (data.email) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(data.email)) return { error: "Invalid email address" }
    const existing = await adminPool<{ id: string }[]>`
      SELECT id FROM clinic_users WHERE email = ${data.email.toLowerCase()} AND id != ${userId} LIMIT 1
    `
    if (existing.length > 0) return { error: "This email is already in use" }
  }

  let passwordHash: string | null = null
  if (data.newPassword) {
    passwordHash = await hash(data.newPassword, 12)
  }

  try {
    await adminPool`
      UPDATE clinic_users SET
        full_name        = COALESCE(${data.fullName || null}, full_name),
        email            = COALESCE(${data.email ? data.email.toLowerCase() : null}, email),
        specialization   = CASE WHEN ${data.specialization !== undefined} THEN ${data.specialization?.trim() || null} ELSE specialization END,
        credentials      = CASE WHEN ${data.credentials !== undefined} THEN ${data.credentials?.trim() || null} ELSE credentials END,
        password_hash    = COALESCE(${passwordHash}, password_hash),
        display_password = COALESCE(${data.newPassword || null}, display_password),
        session_version  = CASE WHEN ${passwordHash !== null} THEN session_version + 1 ELSE session_version END
      WHERE id = ${userId}
    `
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}

// ── Add user to a clinic (platform admin) ────────────────────────────────────

export async function addClinicUser(
  clinicId: string,
  data: {
    fullName: string
    email: string
    password: string
    role: "doctor" | "receptionist"
    specialization?: string
    credentials?: string
  }
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  if (!["doctor", "receptionist"].includes(data.role)) return { error: "Invalid role" }
  if (!data.fullName.trim() || data.fullName.length < 2) return { error: "Name must be at least 2 characters" }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(data.email)) return { error: "Invalid email address" }
  if (data.password.length < 8) return { error: "Password must be at least 8 characters" }

  // Check limits
  const [clinic] = await adminPool<{ max_doctors: number; max_receptionists: number }[]>`
    SELECT max_doctors, max_receptionists FROM clinics WHERE id = ${clinicId}
  `
  if (!clinic) return { error: "Clinic not found" }

  const counts = await adminPool<{ role: string; count: string }[]>`
    SELECT role, COUNT(*)::text AS count
    FROM clinic_users
    WHERE clinic_id = ${clinicId} AND is_active = true AND role IN ('doctor', 'receptionist')
    GROUP BY role
  `
  const countMap: Record<string, number> = {}
  for (const r of counts) countMap[r.role] = parseInt(r.count)

  if (data.role === "doctor" && (countMap["doctor"] ?? 0) >= clinic.max_doctors) {
    return { error: `Doctor limit reached (${clinic.max_doctors}). Increase the limit first.` }
  }
  if (data.role === "receptionist" && (countMap["receptionist"] ?? 0) >= clinic.max_receptionists) {
    return { error: `Receptionist limit reached (${clinic.max_receptionists}). Increase the limit first.` }
  }

  // Check email uniqueness
  const existing = await adminPool<{ id: string }[]>`
    SELECT id FROM clinic_users WHERE email = ${data.email.toLowerCase()} LIMIT 1
  `
  if (existing.length > 0) return { error: "This email is already in use" }

  const passwordHash = await hash(data.password, 12)

  try {
    await adminPool`
      INSERT INTO clinic_users (clinic_id, email, password_hash, role, full_name, specialization, credentials, display_password)
      VALUES (
        ${clinicId},
        ${data.email.toLowerCase()},
        ${passwordHash},
        ${data.role},
        ${data.fullName.trim()},
        ${data.specialization?.trim() || null},
        ${data.credentials?.trim() || null},
        ${data.password}
      )
    `
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error, "Failed to add user") }
  }
}

// ── Toggle clinic user active/inactive (platform admin) ─────────────────────

export async function toggleClinicUserActive(
  userId: string,
  isActive: boolean
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  const [user] = await adminPool<{ id: string; role: string }[]>`
    SELECT id, role FROM clinic_users WHERE id = ${userId}
  `
  if (!user) return { error: "User not found" }
  if (user.role === "clinic_admin") return { error: "Cannot modify clinic admin status from here" }

  try {
    await adminPool`UPDATE clinic_users SET is_active = ${isActive} WHERE id = ${userId}`
    if (!isActive) {
      await adminPool`UPDATE clinic_users SET session_version = session_version + 1 WHERE id = ${userId}`
    }
    return { success: true }
  } catch (error) {
    return { error: getErrorMessage(error) }
  }
}
