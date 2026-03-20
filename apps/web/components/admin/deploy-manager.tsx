"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  getDeployStatus,
  fetchLatestCommit,
  runDeploy,
  restartApp,
  getEnvKeys,
  saveEnvVars,
  type CommitInfo,
  type EnvEntry,
  type DeployResult,
} from "@/actions/admin/deploy"
import {
  Loader2Icon,
  DownloadIcon,
  UploadIcon,
  RotateCcwIcon,
  PlusIcon,
  XIcon,
  AlertTriangleIcon,
  CheckIcon,
} from "lucide-react"

type EnvRow = EnvEntry & { value: string; id: number; isNew: boolean }

export function DeployManager() {
  const [liveCommit, setLiveCommit] = useState<CommitInfo | null>(null)
  const [statusError, setStatusError] = useState("")
  const [statusLoading, setStatusLoading] = useState(true)

  const [fetchedCommit, setFetchedCommit] = useState<CommitInfo | null>(null)
  const [fetchError, setFetchError] = useState("")
  const [fetching, startFetch] = useTransition()

  const [showConfirm, setShowConfirm] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null)
  const [deployError, setDeployError] = useState("")

  const [envRows, setEnvRows] = useState<EnvRow[]>([])
  const [envLoaded, setEnvLoaded] = useState(false)
  const [envSaving, startEnvSave] = useTransition()
  const [envError, setEnvError] = useState("")
  const [envSaved, setEnvSaved] = useState(false)
  const [envDirty, setEnvDirty] = useState(false)
  const [nextId, setNextId] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<EnvRow | null>(null)

  const [restarting, setRestarting] = useState(false)
  const [restartResult, setRestartResult] = useState<"ok" | "error" | null>(
    null
  )

  useEffect(() => {
    let cancelled = false
    getDeployStatus().then((r) => {
      if (cancelled) return
      if ("error" in r) setStatusError(r.error)
      else setLiveCommit(r)
      setStatusLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const loadEnv = () =>
    getEnvKeys().then((r) => {
      if ("entries" in r) {
        setEnvRows(
          r.entries.map((e, i) => ({
            ...e,
            value: "",
            id: i,
            isNew: false,
          }))
        )
        setNextId(r.entries.length)
      }
      setEnvLoaded(true)
    })

  useEffect(() => {
    loadEnv()
  }, [])

  const handleFetch = () => {
    setFetchError("")
    setFetchedCommit(null)
    startFetch(async () => {
      const r = await fetchLatestCommit()
      if ("error" in r) setFetchError(r.error)
      else setFetchedCommit(r)
    })
  }

  const handleDeploy = async () => {
    setDeploying(true)
    setDeployError("")
    setDeployResult(null)
    const r = await runDeploy()
    setDeploying(false)
    setShowConfirm(false)
    if ("error" in r) {
      setDeployError(r.error)
      return
    }
    setDeployResult(r)
    if (r.ok) {
      setEnvDirty(false)
      getDeployStatus().then((s) => {
        if (!("error" in s)) setLiveCommit(s)
      })
    }
  }

  const handleRestart = async () => {
    setRestarting(true)
    setRestartResult(null)
    const r = await restartApp()
    setRestarting(false)
    setRestartResult("error" in r ? "error" : "ok")
    if (!("error" in r)) {
      setEnvDirty(false)
      setTimeout(() => setRestartResult(null), 4000)
    }
  }

  const handleEnvSave = () => {
    setEnvError("")
    setEnvSaved(false)
    startEnvSave(async () => {
      const r = await saveEnvVars(
        envRows.map(({ key, value }) => ({ key, value }))
      )
      if ("error" in r) {
        setEnvError(r.error)
      } else {
        setEnvSaved(true)
        setEnvDirty(true)
        setTimeout(() => setEnvSaved(false), 3000)
        loadEnv()
      }
    })
  }

  const addEnvRow = () => {
    setEnvRows((prev) => [
      ...prev,
      { key: "", value: "", id: nextId, isSet: false, masked: "", isNew: true },
    ])
    setNextId((n) => n + 1)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setEnvRows((prev) => prev.filter((r) => r.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const updateEnvRow = (id: number, field: "key" | "value", val: string) =>
    setEnvRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    )

  function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Production Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Production Status</CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : statusError ? (
            <Alert variant="destructive">
              <AlertDescription>{statusError}</AlertDescription>
            </Alert>
          ) : liveCommit ? (
            <CommitCard commit={liveCommit} label="Currently Live" timeAgo={timeAgo} />
          ) : null}
        </CardContent>
      </Card>

      {/* Deploy Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Deploy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleFetch}
              disabled={fetching}
            >
              {fetching ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <DownloadIcon />
              )}
              Fetch Latest
            </Button>
            {fetchError && (
              <span className="text-sm text-destructive">{fetchError}</span>
            )}
          </div>

          {fetchedCommit && (
            <>
              <CommitCard commit={fetchedCommit} label="Latest on GitHub" timeAgo={timeAgo} />
              <Button
                onClick={() => {
                  setDeployError("")
                  setDeployResult(null)
                  setShowConfirm(true)
                }}
                disabled={deploying}
              >
                <UploadIcon />
                Deploy {fetchedCommit.shortSha}
              </Button>
            </>
          )}

          {deployResult && <DeployOutputCard result={deployResult} />}

          {deployError && (
            <Alert variant="destructive">
              <AlertDescription>{deployError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Environment Variables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Values are write-only and never returned. Leave a value blank to
            keep the existing value. Removing a row deletes that variable.
          </p>

          {envDirty && (
            <Alert>
              <AlertTriangleIcon className="size-4" />
              <AlertDescription>
                <div className="flex items-center justify-between gap-4">
                  <span>
                    {restartResult === "ok"
                      ? "Restarted — new env vars are live."
                      : restartResult === "error"
                        ? "Restart failed — try Deploy instead."
                        : "Env vars saved but app still running with old values."}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestart}
                      disabled={restarting}
                    >
                      {restarting ? (
                        <Loader2Icon className="animate-spin" />
                      ) : (
                        <RotateCcwIcon />
                      )}
                      Quick Restart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeployError("")
                        setDeployResult(null)
                        setShowConfirm(true)
                      }}
                    >
                      Full Deploy
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!envLoaded ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              {envRows.length === 0 && (
                <p className="text-sm italic text-muted-foreground">
                  No variables yet.
                </p>
              )}

              <div className="space-y-2">
                {envRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
                  >
                    <Input
                      placeholder="KEY"
                      value={row.key}
                      onChange={(e) =>
                        updateEnvRow(row.id, "key", e.target.value)
                      }
                      className="font-mono text-sm"
                      readOnly={!row.isNew}
                    />
                    <Input
                      type="password"
                      placeholder={
                        row.isSet
                          ? row.masked || "leave blank to keep"
                          : "Enter value"
                      }
                      value={row.value}
                      onChange={(e) =>
                        updateEnvRow(row.id, "value", e.target.value)
                      }
                      autoComplete="new-password"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() =>
                        row.isNew
                          ? setEnvRows((p) =>
                              p.filter((r) => r.id !== row.id)
                            )
                          : setDeleteTarget(row)
                      }
                    >
                      <XIcon />
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addEnvRow}>
                <PlusIcon />
                Add Variable
              </Button>

              {envError && (
                <Alert variant="destructive">
                  <AlertDescription>{envError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button onClick={handleEnvSave} disabled={envSaving}>
                  {envSaved ? (
                    <CheckIcon />
                  ) : envSaving ? (
                    <Loader2Icon className="animate-spin" />
                  ) : null}
                  {envSaved
                    ? "Saved"
                    : envSaving
                      ? "Saving..."
                      : "Save Variables"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Deploy Confirm Dialog */}
      <Dialog
        open={showConfirm && !!fetchedCommit}
        onOpenChange={(open) => !deploying && setShowConfirm(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deploy</DialogTitle>
            <DialogDescription>
              Deploy{" "}
              <span className="font-mono font-semibold">
                {fetchedCommit?.shortSha}
              </span>{" "}
              to production? This will run fetch, reset, npm ci, db:migrate,
              build, restart, and release gate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={deploying}
            >
              Cancel
            </Button>
            <Button onClick={handleDeploy} disabled={deploying}>
              {deploying && <Loader2Icon className="animate-spin" />}
              {deploying ? "Deploying..." : "Deploy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Env Var Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Variable</DialogTitle>
            <DialogDescription>
              Remove{" "}
              <span className="font-mono font-semibold">
                {deleteTarget?.key}
              </span>{" "}
              from the env file? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Commit Card ──────────────────────────────────────────────────────────────

function CommitCard({
  commit,
  label,
  timeAgo,
}: {
  commit: CommitInfo
  label: string
  timeAgo: (ts: string) => string
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <Badge variant="secondary" className="font-mono">
          {commit.shortSha}
        </Badge>
        <span className="text-sm">{commit.message}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {commit.author} · {timeAgo(commit.timestamp)}
      </p>
    </div>
  )
}

// ── Deploy Output Card ───────────────────────────────────────────────────────

function DeployOutputCard({ result }: { result: DeployResult }) {
  return (
    <Alert variant={result.ok ? "default" : "destructive"}>
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-semibold">
            {result.ok
              ? "DEPLOYED"
              : result.timedOut
                ? "DEPLOY TIMED OUT"
                : "DEPLOY FAILED"}
          </p>
          <p className="text-sm">{result.summary}</p>
          <p className="text-xs text-muted-foreground">
            exit={result.exitCode ?? "n/a"}
            {result.signal ? ` · signal=${result.signal}` : ""}
          </p>
          {result.stdout && (
            <ScrollArea className="max-h-[200px]">
              <p className="mb-1 text-xs font-semibold">STDOUT</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                {result.stdout}
              </pre>
            </ScrollArea>
          )}
          {result.stderr && (
            <ScrollArea className="max-h-[200px]">
              <p className="mb-1 text-xs font-semibold">STDERR</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                {result.stderr}
              </pre>
            </ScrollArea>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
