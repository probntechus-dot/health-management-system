"use server"

import { exec, execFile } from "child_process"
import { promisify } from "util"
import fs from "fs"
import { requireAdmin } from "./auth"

const execAsync = promisify(exec)
const execFileAsync = promisify(execFile)

// ── Config ───────────────────────────────────────────────────────────────────

const GITHUB_OWNER = "probntechus-dot"
const GITHUB_REPO = "doctor-management-system"
const GITHUB_BRANCH = "main"
const DEPLOY_SCRIPT = "/opt/doctor-management/scripts/deploy.sh"
const ENV_FILE_PATH = "/opt/doctor-management/.env.local"

// ── Types ────────────────────────────────────────────────────────────────────

export type CommitInfo = {
  sha: string
  shortSha: string
  message: string
  author: string
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

export type EnvEntry = { key: string; isSet: boolean; masked: string }

// ── Rate limiter ─────────────────────────────────────────────────────────────

let _deployCount = 0
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

// ── Production status ────────────────────────────────────────────────────────

export async function getDeployStatus(): Promise<
  CommitInfo | { error: string }
> {
  await requireAdmin()
  try {
    const { stdout: shaOut } = await execFileAsync(
      "git",
      ["rev-parse", "HEAD"],
      { timeout: 5000, cwd: process.cwd() }
    )
    const { stdout: logOut } = await execFileAsync(
      "git",
      ["log", "-1", "--format=%s\n%an\n%aI"],
      { timeout: 5000, cwd: process.cwd() }
    )
    const sha = shaOut.trim()
    const parts = logOut.trim().split("\n")
    return {
      sha,
      shortSha: sha.slice(0, 7),
      message: parts[0] ?? "",
      author: parts[1] ?? "",
      timestamp: parts[2] ?? "",
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Fetch latest commit from GitHub ──────────────────────────────────────────

export async function fetchLatestCommit(): Promise<
  CommitInfo | { error: string }
> {
  await requireAdmin()
  const token = process.env.GITHUB_TOKEN
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/${GITHUB_BRANCH}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      }
    )
    if (!res.ok)
      return { error: "Could not reach GitHub. Check GITHUB_TOKEN." }
    const data = await res.json()
    const sha = data.sha as string
    return {
      sha,
      shortSha: sha.slice(0, 7),
      message: (data.commit.message as string).split("\n")[0]!,
      author: data.commit.author.name as string,
      timestamp: data.commit.author.date as string,
    }
  } catch {
    return { error: "Could not reach GitHub. Check GITHUB_TOKEN." }
  }
}

// ── Run deploy script ────────────────────────────────────────────────────────

export async function runDeploy(): Promise<DeployResult | { error: string }> {
  await requireAdmin()
  if (!checkDeployRateLimit())
    return { error: "Rate limit exceeded. Try again in a minute." }

  const DEPLOY_TIMEOUT_MS = 10 * 60 * 1000
  const MAX_LOG_CHARS = 12_000
  const trimLogs = (value: string) => {
    const text = value.trim()
    if (text.length <= MAX_LOG_CHARS) return text
    return `… trimmed to last ${MAX_LOG_CHARS.toLocaleString()} chars …\n${text.slice(-MAX_LOG_CHARS)}`
  }

  return new Promise((resolve) => {
    execFile(
      "/bin/bash",
      [DEPLOY_SCRIPT],
      { timeout: DEPLOY_TIMEOUT_MS },
      (err, stdout, stderr) => {
        const cleanStdout = trimLogs(stdout)
        const cleanStderr = trimLogs(stderr)

        if (!err) {
          resolve({
            ok: true,
            summary: "Deploy finished successfully.",
            stdout: cleanStdout,
            stderr: cleanStderr,
            timedOut: false,
            exitCode: 0,
            signal: null,
          })
          return
        }

        const timedOut = err.killed || err.signal === "SIGTERM"
        const summary = timedOut
          ? "Deploy timed out in the admin panel before the script finished."
          : err.message || "Deploy failed."

        resolve({
          ok: false,
          summary,
          stdout: cleanStdout,
          stderr: cleanStderr,
          timedOut,
          exitCode: typeof err.code === "number" ? err.code : null,
          signal: err.signal ?? null,
        })
      }
    )
  })
}

// ── Quick restart ────────────────────────────────────────────────────────────

export async function restartApp(): Promise<
  { success: true } | { error: string }
> {
  await requireAdmin()
  try {
    await execAsync("pm2 restart doctor-clinic", { timeout: 15_000 })
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Restart failed" }
  }
}

// ── Env file — keys + status ─────────────────────────────────────────────────

function maskValue(val: string): string {
  if (val.length === 0) return ""
  if (val.length <= 4) return "••••"
  if (val.length <= 10) return val[0]! + "•••••"
  return val.slice(0, 3) + "•••••" + val.slice(-3)
}

export async function getEnvKeys(): Promise<
  { entries: EnvEntry[] } | { error: string }
> {
  await requireAdmin()
  try {
    if (!fs.existsSync(ENV_FILE_PATH)) return { entries: [] }
    const content = fs.readFileSync(ENV_FILE_PATH, "utf8")
    const entries: EnvEntry[] = []
    for (const line of content.split("\n")) {
      if (!line.trim() || line.startsWith("#")) continue
      const idx = line.indexOf("=")
      if (idx < 0) continue
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      if (!key) continue
      entries.push({ key, isSet: val.length > 0, masked: maskValue(val) })
    }
    return { entries }
  } catch {
    return { error: "Could not read env file. Check server permissions." }
  }
}

// ── Env file — atomic write ──────────────────────────────────────────────────

export async function saveEnvVars(
  updates: Array<{ key: string; value: string }>
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()

  for (const { key } of updates) {
    if (key.trim() && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key.trim())) {
      return {
        error: `Invalid env key: ${key}. Keys must start with a letter or underscore.`,
      }
    }
  }

  try {
    const existing: Record<string, string> = {}
    if (fs.existsSync(ENV_FILE_PATH)) {
      const raw = fs.readFileSync(ENV_FILE_PATH, "utf8")
      for (const line of raw.split("\n")) {
        if (!line.trim() || line.startsWith("#")) continue
        const idx = line.indexOf("=")
        if (idx < 0) continue
        existing[line.slice(0, idx).trim()] = line.slice(idx + 1)
      }
    }

    const merged: Record<string, string> = {}
    for (const { key, value } of updates) {
      const k = key.trim()
      if (!k) continue
      if (value === "" && k in existing) merged[k] = existing[k]!
      else if (value !== "") merged[k] = value
    }

    const lines = Object.entries(merged).map(([k, v]) => `${k}=${v}`)
    const content = lines.join("\n") + (lines.length > 0 ? "\n" : "")

    const tmpPath = `${ENV_FILE_PATH}.tmp.${Date.now()}`
    fs.writeFileSync(tmpPath, content, { mode: 0o600 })
    fs.renameSync(tmpPath, ENV_FILE_PATH)
    return { success: true }
  } catch {
    return { error: "Could not save env file. Check server permissions." }
  }
}
