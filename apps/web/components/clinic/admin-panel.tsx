"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  adminLogout,
  getOverviewCounts,
  listClinics,
  addClinic,
  pauseClinic,
  resumeClinic,
  deleteClinic,
  runAdminSql,
  getSystemStats,
  type AddClinicInput,
} from "@/actions/admin"
import {
  Loader2Icon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  Trash2Icon,
  LogOutIcon,
  AlertCircleIcon,
} from "lucide-react"

type Clinic = {
  id: string
  slug: string
  name: string
  status: string
  created_at: string
}

type OverviewData = {
  total: number
  active: number
  trial: number
  paused?: number
}

export function AdminPanel() {
  const router = useRouter()

  const handleLogout = async () => {
    await adminLogout()
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOutIcon />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clinics">Clinics</TabsTrigger>
          <TabsTrigger value="sql">SQL</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="clinics" className="mt-4">
          <ClinicsTab />
        </TabsContent>
        <TabsContent value="sql" className="mt-4">
          <SqlTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    getOverviewCounts().then(setData).catch(() => {})
    getSystemStats().then(setStats).catch(() => {})
  }, [])

  if (!data)
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    )

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: "Total Clinics", value: data.total },
        { label: "Active", value: data.active },
        { label: "Trial", value: data.trial },
      ].map((item) => (
        <Card key={item.label}>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.value}</p>
          </CardContent>
        </Card>
      ))}

      {stats && (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-sm">System Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">
              {JSON.stringify(stats, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ClinicsTab() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [drName, setDrName] = useState("")
  const [drEmail, setDrEmail] = useState("")
  const [drPw, setDrPw] = useState("")
  const [recName, setRecName] = useState("")
  const [recEmail, setRecEmail] = useState("")
  const [recPw, setRecPw] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const load = () => {
    listClinics()
      .then((data) => {
        setClinics(data as Clinic[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = await addClinic({
        name: newName,
        slug: newSlug,
        doctorFullName: drName,
        doctorEmail: drEmail,
        doctorPassword: drPw,
        receptionistFullName: recName,
        receptionistEmail: recEmail,
        receptionistPassword: recPw,
      })
      if ("error" in result) {
        setError(result.error as string)
      } else {
        setShowAdd(false)
        setNewName(""); setNewSlug("")
        setDrName(""); setDrEmail(""); setDrPw("")
        setRecName(""); setRecEmail(""); setRecPw("")
        load()
      }
    })
  }

  const handleAction = (clinicId: string, action: "pause" | "resume" | "delete") => {
    startTransition(async () => {
      if (action === "pause") await pauseClinic(clinicId)
      else if (action === "resume") await resumeClinic(clinicId)
      else if (action === "delete") {
        if (!window.confirm("Delete this clinic? This cannot be undone.")) return
        await deleteClinic(clinicId)
      }
      load()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <PlusIcon />
          Add Clinic
        </Button>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Clinic</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label>Clinic Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="My Clinic" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug <span className="text-xs text-muted-foreground">(lowercase, underscores only)</span></Label>
              <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required placeholder="my_clinic" pattern="^[a-z][a-z0-9_]*$" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground pt-2">Doctor Account</p>
            <div className="grid grid-cols-2 gap-2">
              <Input value={drName} onChange={(e) => setDrName(e.target.value)} required placeholder="Full name" />
              <Input value={drEmail} onChange={(e) => setDrEmail(e.target.value)} required type="email" placeholder="Email" />
            </div>
            <Input value={drPw} onChange={(e) => setDrPw(e.target.value)} required type="password" placeholder="Password (min 8)" minLength={8} />
            <p className="text-xs font-semibold text-muted-foreground pt-2">Receptionist Account</p>
            <div className="grid grid-cols-2 gap-2">
              <Input value={recName} onChange={(e) => setRecName(e.target.value)} required placeholder="Full name" />
              <Input value={recEmail} onChange={(e) => setRecEmail(e.target.value)} required type="email" placeholder="Email" />
            </div>
            <Input value={recPw} onChange={(e) => setRecPw(e.target.value)} required type="password" placeholder="Password (min 8)" minLength={8} />
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2Icon className="animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        {loading ? (
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading...
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinics.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium">{clinic.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {clinic.slug}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        clinic.status === "active"
                          ? "default"
                          : clinic.status === "paused"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {clinic.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(clinic.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      {clinic.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleAction(clinic.id, "pause")}
                          title="Pause"
                        >
                          <PauseIcon />
                        </Button>
                      )}
                      {clinic.status === "paused" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleAction(clinic.id, "resume")}
                          title="Resume"
                        >
                          <PlayIcon />
                        </Button>
                      )}
                      {clinic.status !== "deleted" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleAction(clinic.id, "delete")}
                          title="Delete"
                          className="text-destructive"
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

function SqlTab() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<{
    rows?: Record<string, unknown>[]
    error?: string
    rowCount?: number
  } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRun = () => {
    if (!query.trim()) return
    startTransition(async () => {
      const res = await runAdminSql(query)
      setResult(res as typeof result)
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SQL Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={6}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM clinics LIMIT 10;"
            className="font-mono text-sm"
          />
          <Button onClick={handleRun} disabled={isPending || !query.trim()}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Run Query
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="py-4">
            {result.error ? (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : result.rows && result.rows.length > 0 ? (
              <ScrollArea className="max-h-[400px]">
                <div className="text-xs text-muted-foreground mb-2">
                  {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(result.rows[0]!).map((col) => (
                        <TableHead key={col} className="text-xs">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows.map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((val, j) => (
                          <TableCell key={j} className="text-xs font-mono">
                            {val === null
                              ? "NULL"
                              : typeof val === "object"
                                ? JSON.stringify(val)
                                : String(val)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                Query executed. {result.rowCount ?? 0} rows affected.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
