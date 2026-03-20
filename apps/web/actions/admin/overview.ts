"use server"

import os from "os"
import { exec } from "child_process"
import { promisify } from "util"
import { unstable_cache } from "next/cache"
import { adminPool } from "@/lib/db/index"
import { requireAdmin } from "./auth"

const execAsync = promisify(exec)

// ── Types ────────────────────────────────────────────────────────────────────

export type SystemStats = {
  memory: { total: number; used: number }
  cpu: { loadAvg1m: number; cores: number }
  disk: { total: number; used: number }
  db: { connections: number; sizeBytes: number }
  uptime: number
}

export type OverviewCounts = {
  total: number
  active: number
  trial: number
  suspended: number
  paused: number
}

// ── System stats (cached 30s) ────────────────────────────────────────────────

const _fetchSystemStats = unstable_cache(
  async (): Promise<SystemStats> => {
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const loadAvg = os.loadavg()[0]!
    const cores = os.cpus().length
    const uptime = os.uptime()

    let diskTotal = 0,
      diskUsed = 0
    try {
      const { stdout } = await execAsync("df -k / | tail -1", {
        timeout: 3000,
      })
      const parts = stdout.trim().split(/\s+/)
      diskTotal = parseInt(parts[1]!) * 1024
      diskUsed = parseInt(parts[2]!) * 1024
    } catch {
      /* non-critical */
    }

    const [dbStats] = await adminPool<
      { connections: number; db_size: string }[]
    >`
      SELECT
        (SELECT count(*)::int FROM pg_stat_activity WHERE state = 'active') AS connections,
        pg_database_size(current_database())::text                          AS db_size
    `

    return {
      memory: { total: totalMem, used: totalMem - freeMem },
      cpu: { loadAvg1m: loadAvg, cores },
      disk: { total: diskTotal, used: diskUsed },
      db: {
        connections: dbStats!.connections,
        sizeBytes: parseInt(dbStats!.db_size),
      },
      uptime,
    }
  },
  ["admin-system-stats"],
  { revalidate: 30 }
)

export async function getSystemStats(): Promise<SystemStats> {
  await requireAdmin()
  return _fetchSystemStats()
}

// ── Overview counts (cached 30s) ─────────────────────────────────────────────

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
  ["admin-overview-counts"],
  { revalidate: 30, tags: ["admin-overview"] }
)

export async function getOverviewCounts(): Promise<OverviewCounts> {
  await requireAdmin()
  return _fetchOverviewCounts()
}
