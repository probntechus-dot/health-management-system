"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  getOverviewCounts,
  getSystemStats,
  type SystemStats,
  type OverviewCounts,
} from "@/actions/admin/overview"
import {
  BuildingIcon,
  ActivityIcon,
  ClockIcon,
  PauseIcon,
  AlertTriangleIcon,
  CpuIcon,
  HardDriveIcon,
  DatabaseIcon,
  ServerIcon,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"

function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function fmtUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function pct(used: number, total: number): number {
  if (total === 0) return 0
  return Math.round((used / total) * 100)
}

export function OverviewDashboard() {
  const [counts, setCounts] = useState<OverviewCounts | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getOverviewCounts(), getSystemStats()]).then(([c, s]) => {
      setCounts(c)
      setStats(s)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    )
  }

  const memPct = stats ? pct(stats.memory.used, stats.memory.total) : 0
  const diskPct = stats ? pct(stats.disk.used, stats.disk.total) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <BuildingIcon className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Clinics</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{counts?.total ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{counts?.active ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Trial</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{counts?.trial ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Suspended</p>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {counts?.suspended ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <PauseIcon className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Paused</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{counts?.paused ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ServerIcon className="size-4" />
              RAM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{memPct}%</span>
              <Badge
                variant={
                  memPct > 85
                    ? "destructive"
                    : memPct > 65
                      ? "secondary"
                      : "default"
                }
              >
                {memPct > 85 ? "Critical" : memPct > 65 ? "Warning" : "OK"}
              </Badge>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${memPct > 85 ? "bg-destructive" : memPct > 65 ? "bg-yellow-500" : "bg-primary"}`}
                style={{ width: `${memPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats
                ? `${fmtBytes(stats.memory.used)} / ${fmtBytes(stats.memory.total)}`
                : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CpuIcon className="size-4" />
              CPU Load (1m)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {stats ? stats.cpu.loadAvg1m.toFixed(2) : "—"}
              </span>
              <Badge variant="secondary">
                {stats ? `${stats.cpu.cores} cores` : "—"}
              </Badge>
            </div>
            {stats && (
              <>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${stats.cpu.loadAvg1m > stats.cpu.cores ? "bg-destructive" : stats.cpu.loadAvg1m > stats.cpu.cores * 0.7 ? "bg-yellow-500" : "bg-primary"}`}
                    style={{
                      width: `${Math.min(Math.round((stats.cpu.loadAvg1m / stats.cpu.cores) * 100), 100)}%`,
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HardDriveIcon className="size-4" />
              Disk (/)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{diskPct}%</span>
              <Badge
                variant={
                  diskPct > 85
                    ? "destructive"
                    : diskPct > 65
                      ? "secondary"
                      : "default"
                }
              >
                {diskPct > 85
                  ? "Critical"
                  : diskPct > 65
                    ? "Warning"
                    : "OK"}
              </Badge>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${diskPct > 85 ? "bg-destructive" : diskPct > 65 ? "bg-yellow-500" : "bg-primary"}`}
                style={{ width: `${diskPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stats && stats.disk.total > 0
                ? `${fmtBytes(stats.disk.used)} / ${fmtBytes(stats.disk.total)}`
                : "unavailable"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DatabaseIcon className="size-4" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {stats?.db.connections ?? "—"}
              </span>
              <Badge variant="secondary">connections</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Size: {stats ? fmtBytes(stats.db.sizeBytes) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Uptime: {stats ? fmtUptime(stats.uptime) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
