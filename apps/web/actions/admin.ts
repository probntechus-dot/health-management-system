'use server'

import { cookies } from 'next/headers'
import { hash } from 'bcryptjs'
import { unstable_cache } from 'next/cache'
import { adminPool } from '@/lib/db/index'
import { createClinicSchema, dropClinicSchema } from '@/lib/db/provision'
import { deleteClinicEmitter } from '@/lib/events'
import os from 'os'
import { exec, execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync     = promisify(exec)
const execFileAsync = promisify(execFile)
const ADMIN_COOKIE = 'admin_session'

// ── Admin auth ────────────────────────────────────────────────────────────────

export async function adminLogin(secret: string) {
  const expected = process.env.ADMIN_SECRET
  if (!expected || secret !== expected) {
    return { error: 'Invalid secret' }
  }
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, '1', {
    httpOnly: true,
    path:     '/admin',
    maxAge:   60 * 60 * 24,
  })
  return { success: true }
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_COOKIE)?.value === '1'
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE)
  return { success: true }
}

async function requireAdmin() {
  const ok = await checkAdminAuth()
  if (!ok) throw new Error('Unauthorized')
}

// ── DB migration (idempotent) ─────────────────────────────────────────────────

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
      ADD COLUMN IF NOT EXISTS specialization TEXT
  `
}

// ── Clinic CRUD ───────────────────────────────────────────────────────────────

export type ClinicRow = {
  id:               string
  slug:             string
  name:             string
  status:           'active' | 'paused' | 'deleted'
  plan:             'active' | 'trial' | 'suspended'
  trial_expires_at: string | null
  payment_notes:    string | null
  created_at:       string
  user_count:       number
}

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

export type AddClinicInput = {
  name:                 string
  slug:                 string
  doctorFullName:       string
  doctorEmail:          string
  doctorPassword:       string
  receptionistFullName: string
  receptionistEmail:    string
  receptionistPassword: string
}

export async function addClinic(input: AddClinicInput) {
  await requireAdmin()

  const { name, slug, doctorFullName, doctorEmail, doctorPassword, receptionistFullName, receptionistEmail, receptionistPassword } = input

  if (!/^[a-z0-9_]+$/.test(slug)) return { error: 'Slug must be lowercase letters, numbers, and underscores only' }
  if (slug.length > 50)            return { error: 'Slug must be 50 characters or fewer' }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(doctorEmail))       return { error: 'Doctor email is not a valid email address' }
  if (!emailRe.test(receptionistEmail)) return { error: 'Receptionist email is not a valid email address' }
  if (doctorPassword.length < 8)        return { error: 'Doctor password must be at least 8 characters' }
  if (receptionistPassword.length < 8)  return { error: 'Receptionist password must be at least 8 characters' }

  const existing = await adminPool<{ id: string }[]>`SELECT id FROM clinics WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) return { error: `Slug ${slug} is already taken` }

  const doctorHash       = await hash(doctorPassword,       12)
  const receptionistHash = await hash(receptionistPassword, 12)

  try {
    const clinic = await adminPool<{ id: string }[]>`
      INSERT INTO clinics (slug, name, status) VALUES (${slug}, ${name}, 'active') RETURNING id
    `
    const clinicId = clinic[0]!.id

    await adminPool`
      INSERT INTO clinic_users (clinic_id, email, password_hash, role, full_name)
      VALUES
        (${clinicId}, ${doctorEmail},       ${doctorHash},       'doctor',       ${doctorFullName}),
        (${clinicId}, ${receptionistEmail}, ${receptionistHash}, 'receptionist', ${receptionistFullName})
    `
    await createClinicSchema(slug, adminPool)

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    try { await adminPool`DELETE FROM clinics WHERE slug = ${slug}` } catch { /* best effort */ }
    return { error: `Failed to create clinic: ${msg}` }
  }
}

export async function pauseClinic(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    await adminPool`UPDATE clinics SET status = 'paused' WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function resumeClinic(id: string): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    await adminPool`UPDATE clinics SET status = 'active' WHERE id = ${id}`
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export async function deleteClinic(id: string) {
  await requireAdmin()
  const rows = await adminPool<{ slug: string }[]>`SELECT slug FROM clinics WHERE id = ${id} LIMIT 1`
  if (rows.length === 0) return { error: 'Clinic not found' }
  const { slug } = rows[0]!
  try {
    await adminPool`DELETE FROM clinics WHERE id = ${id}`
    await dropClinicSchema(slug, adminPool)
    deleteClinicEmitter(slug)
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { error: `Failed to delete clinic: ${msg}` }
  }
}

// ── Clinic plan management ────────────────────────────────────────────────────

export async function setClinicPlan(
  id: string,
  plan: 'active' | 'trial' | 'suspended',
  trialExpiresAt: string | null,
  paymentNotes: string | null,
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
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

// ── Clinic users management ───────────────────────────────────────────────────

export type ClinicUserRow = {
  id:        string
  full_name: string
  email:     string
  role:      'doctor' | 'receptionist'
  is_active: boolean
}

export async function listClinicUsers(clinicId: string): Promise<ClinicUserRow[]> {
  await requireAdmin()
  const rows = await adminPool<ClinicUserRow[]>`
    SELECT id, full_name, email, role, is_active
    FROM clinic_users
    WHERE clinic_id = ${clinicId}
    ORDER BY role DESC
  `
  return rows
}

export async function updateClinicUser(
  userId: string,
  data: { fullName?: string; newPassword?: string },
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    if (data.fullName) {
      await adminPool`UPDATE clinic_users SET full_name = ${data.fullName} WHERE id = ${userId}`
    }
    if (data.newPassword) {
      if (data.newPassword.length < 8) return { error: 'Password must be at least 8 characters' }
      const passwordHash = await hash(data.newPassword, 12)
      await adminPool`UPDATE clinic_users SET password_hash = ${passwordHash} WHERE id = ${userId}`
    }
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

// ── System stats (cached 30s, async disk) ────────────────────────────────────

export type SystemStats = {
  memory:  { total: number; used: number }
  cpu:     { loadAvg1m: number; cores: number }
  disk:    { total: number; used: number }
  db:      { connections: number; sizeBytes: number }
  uptime:  number
}

const _fetchSystemStats = unstable_cache(
  async (): Promise<SystemStats> => {
    const totalMem = os.totalmem()
    const freeMem  = os.freemem()
    const loadAvg  = os.loadavg()[0]!
    const cores    = os.cpus().length
    const uptime   = os.uptime()

    let diskTotal = 0, diskUsed = 0
    try {
      const { stdout } = await execAsync('df -k / | tail -1', { timeout: 3000 })
      const parts = stdout.trim().split(/\s+/)
      diskTotal   = parseInt(parts[1]!) * 1024
      diskUsed    = parseInt(parts[2]!) * 1024
    } catch { /* non-critical — disk card will show unavailable */ }

    const [dbStats] = await adminPool<{ connections: number; db_size: string }[]>`
      SELECT
        (SELECT count(*)::int FROM pg_stat_activity WHERE state = 'active') AS connections,
        pg_database_size(current_database())::text                          AS db_size
    `

    return {
      memory: { total: totalMem, used: totalMem - freeMem },
      cpu:    { loadAvg1m: loadAvg, cores },
      disk:   { total: diskTotal, used: diskUsed },
      db:     { connections: dbStats!.connections, sizeBytes: parseInt(dbStats!.db_size) },
      uptime,
    }
  },
  ['admin-system-stats'],
  { revalidate: 30 },
)

export async function getSystemStats(): Promise<SystemStats> {
  await requireAdmin()
  return _fetchSystemStats()
}

// ── Overview counts (cached 30s, tag-invalidated on mutations) ────────────────

export type OverviewCounts = {
  total:     number
  active:    number
  trial:     number
  suspended: number
  paused:    number
}

const _fetchOverviewCounts = unstable_cache(
  async (): Promise<OverviewCounts> => {
    const [row] = await adminPool<OverviewCounts[]>`
      SELECT
        COUNT(*)::INT                                                                          AS total,
        COUNT(*) FILTER (WHERE status = 'active' AND COALESCE(plan,'active') = 'active')::INT AS active,
        COUNT(*) FILTER (WHERE COALESCE(plan,'active') = 'trial')::INT                        AS trial,
        COUNT(*) FILTER (WHERE COALESCE(plan,'active') = 'suspended')::INT                    AS suspended,
        COUNT(*) FILTER (WHERE status = 'paused')::INT                                        AS paused
      FROM clinics
      WHERE status != 'deleted'
    `
    return row!
  },
  ['admin-overview-counts'],
  { revalidate: 30, tags: ['admin-overview'] },
)

export async function getOverviewCounts(): Promise<OverviewCounts> {
  await requireAdmin()
  return _fetchOverviewCounts()
}

// ── SQL runner ────────────────────────────────────────────────────────────────

const SQL_ROW_CAP = 500

export type SqlResult =
  | { columns: string[]; rows: string[][]; rowCount: number; command: string; capped: boolean }
  | { error: string }

export async function runAdminSql(query: string): Promise<SqlResult> {
  await requireAdmin()

  query = query.trim()
  if (!query) return { error: 'Query is empty' }

  try {
    const result = await adminPool.unsafe(query)
    const columns: string[] = result.columns?.map((c: { name: string }) => c.name) ?? []
    const allRows = Array.from(result)
    const capped   = allRows.length > SQL_ROW_CAP
    const rows     = allRows
      .slice(0, SQL_ROW_CAP)
      .map(row => columns.map(col => {
        const v = (row as Record<string, unknown>)[col]
        return v === null ? 'NULL' : v === undefined ? '' : String(v)
      }))

    return {
      columns,
      rows,
      rowCount: result.count ?? allRows.length,
      command:  result.command ?? '',
      capped,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Deploy config ─────────────────────────────────────────────────────────────

const GITHUB_OWNER  = 'probntechus-dot'
const GITHUB_REPO   = 'doctor-management-system'
const GITHUB_BRANCH = 'main'
const DEPLOY_SCRIPT = '/opt/doctor-management/scripts/deploy.sh'
const ENV_FILE_PATH = '/opt/doctor-management/.env.local'

// ── Deploy types ──────────────────────────────────────────────────────────────

export type CommitInfo = {
  sha:       string
  shortSha:  string
  message:   string
  author:    string
  timestamp: string
}

export type DeployResult = {
  ok: boolean
  summary: string
  stdout: string
  stderr: string
  timedOut: boolean
  exitCode: number | null
  signal: NodeJS.Signals | null
}

// ── Rate limiter (deploy action only) ────────────────────────────────────────

let _deployCount       = 0
let _deployWindowStart = 0

function checkDeployRateLimit(): boolean {
  const now = Date.now()
  if (now - _deployWindowStart > 60_000) {
    _deployCount = 0
    _deployWindowStart = now
  }
  if (_deployCount >= 5) return false
  _deployCount++
  return true
}

// ── Production status ─────────────────────────────────────────────────────────

export async function getDeployStatus(): Promise<CommitInfo | { error: string }> {
  await requireAdmin()
  try {
    const { stdout: shaOut } = await execFileAsync('git', ['rev-parse', 'HEAD'], { timeout: 5000, cwd: process.cwd() })
    const { stdout: logOut } = await execFileAsync('git', ['log', '-1', '--format=%s\n%an\n%aI'], { timeout: 5000, cwd: process.cwd() })
    const sha   = shaOut.trim()
    const parts = logOut.trim().split('\n')
    return {
      sha,
      shortSha:  sha.slice(0, 7),
      message:   parts[0] ?? '',
      author:    parts[1] ?? '',
      timestamp: parts[2] ?? '',
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Fetch latest commit from GitHub (called only on user click) ──────────────

export async function fetchLatestCommit(): Promise<CommitInfo | { error: string }> {
  await requireAdmin()
  const token = process.env.GITHUB_TOKEN
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
      }
    )
    if (!res.ok) return { error: 'Could not reach GitHub. Check GITHUB_TOKEN.' }
    const data    = await res.json()
    const sha     = data.sha as string
    return {
      sha,
      shortSha:  sha.slice(0, 7),
      message:   (data.commit.message as string).split('\n')[0]!,
      author:    data.commit.author.name as string,
      timestamp: data.commit.author.date as string,
    }
  } catch {
    return { error: 'Could not reach GitHub. Check GITHUB_TOKEN.' }
  }
}

// ── Run deploy script ─────────────────────────────────────────────────────────

export async function runDeploy(): Promise<DeployResult | { error: string }> {
  await requireAdmin()
  if (!checkDeployRateLimit()) return { error: 'Rate limit exceeded. Try again in a minute.' }

  const DEPLOY_TIMEOUT_MS = 10 * 60 * 1000
  const MAX_LOG_CHARS = 12_000
  const trimLogs = (value: string) => {
    const text = value.trim()
    if (text.length <= MAX_LOG_CHARS) return text
    return `… trimmed to last ${MAX_LOG_CHARS.toLocaleString()} chars …\n${text.slice(-MAX_LOG_CHARS)}`
  }

  return new Promise(resolve => {
    execFile('/bin/bash', [DEPLOY_SCRIPT], { timeout: DEPLOY_TIMEOUT_MS }, (err, stdout, stderr) => {
      const cleanStdout = trimLogs(stdout)
      const cleanStderr = trimLogs(stderr)

      if (!err) {
        resolve({
          ok: true,
          summary: 'Deploy finished successfully.',
          stdout: cleanStdout,
          stderr: cleanStderr,
          timedOut: false,
          exitCode: 0,
          signal: null,
        })
        return
      }

      const timedOut = err.killed || err.signal === 'SIGTERM'
      const summary = timedOut
        ? 'Deploy timed out in the admin panel before the script finished.'
        : err.message || 'Deploy failed.'

      resolve({
        ok: false,
        summary,
        stdout: cleanStdout,
        stderr: cleanStderr,
        timedOut,
        exitCode: typeof err.code === 'number' ? err.code : null,
        signal: err.signal ?? null,
      })
    })
  })
}

// ── Quick restart (PM2 only, no build) ────────────────────────────────────────

export async function restartApp(): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  try {
    await execAsync('pm2 restart doctor-clinic', { timeout: 15_000 })
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Restart failed' }
  }
}

// ── Env file — keys + status (values never returned) ─────────────────────────

export type EnvEntry = { key: string; isSet: boolean; masked: string }

function maskValue(val: string): string {
  if (val.length === 0) return ''
  if (val.length <= 4)  return '••••'
  if (val.length <= 10) return val[0]! + '•••••'
  return val.slice(0, 3) + '•••••' + val.slice(-3)
}

export async function getEnvKeys(): Promise<{ entries: EnvEntry[] } | { error: string }> {
  await requireAdmin()
  try {
    if (!fs.existsSync(ENV_FILE_PATH)) return { entries: [] }
    const content = fs.readFileSync(ENV_FILE_PATH, 'utf8')
    const entries: EnvEntry[] = []
    for (const line of content.split('\n')) {
      if (!line.trim() || line.startsWith('#')) continue
      const idx = line.indexOf('=')
      if (idx < 0) continue
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      if (!key) continue
      entries.push({ key, isSet: val.length > 0, masked: maskValue(val) })
    }
    return { entries }
  } catch {
    return { error: 'Could not read env file. Check server permissions.' }
  }
}

// ── Env file — atomic write (values never returned anywhere) ─────────────────

export async function saveEnvVars(
  updates: Array<{ key: string; value: string }>,
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  // Validate keys
  for (const { key } of updates) {
    if (key.trim() && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key.trim())) {
      return { error: `Invalid env key: ${key}. Keys must start with a letter or underscore.` }
    }
  }

  try {
    // Read existing values so blank submissions preserve the current value
    const existing: Record<string, string> = {}
    if (fs.existsSync(ENV_FILE_PATH)) {
      const raw = fs.readFileSync(ENV_FILE_PATH, 'utf8')
      for (const line of raw.split('\n')) {
        if (!line.trim() || line.startsWith('#')) continue
        const idx = line.indexOf('=')
        if (idx < 0) continue
        existing[line.slice(0, idx).trim()] = line.slice(idx + 1)
      }
    }

    // Build merged map: blank value → keep existing; non-blank → override; missing row → deleted
    const merged: Record<string, string> = {}
    for (const { key, value } of updates) {
      const k = key.trim()
      if (!k) continue
      if (value === '' && k in existing) merged[k] = existing[k]!
      else if (value !== '')            merged[k] = value
      // new key with blank value → skip (don't add to file)
    }

    const lines   = Object.entries(merged).map(([k, v]) => `${k}=${v}`)
    const content = lines.join('\n') + (lines.length > 0 ? '\n' : '')

    const tmpPath = `${ENV_FILE_PATH}.tmp.${Date.now()}`
    fs.writeFileSync(tmpPath, content, { mode: 0o600 })
    fs.renameSync(tmpPath, ENV_FILE_PATH)
    return { success: true }
  } catch {
    return { error: 'Could not save env file. Check server permissions.' }
  }
}
