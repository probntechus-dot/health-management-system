"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@workspace/ui/components/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  listClinics,
  addClinic,
  pauseClinic,
  resumeClinic,
  deleteClinic,
  updateClinic,
  listClinicUsers,
  updateClinicUser,
  addClinicUser,
  toggleClinicUserActive,
  sendNotification,
  sendNotificationToAll,
  forceLogoutClinic,
  runClinicsMigration,
  type ClinicRow,
  type ClinicUserRow,
} from "@/actions/admin/clinics"
import {
  Loader2Icon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  Trash2Icon,
  PencilIcon,
  UsersIcon,
  SearchIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserIcon,
  CheckIcon,
  ClockIcon,
  UserPlusIcon,
  BellIcon,
  LogOutIcon,
  DatabaseIcon,
  SendIcon,
} from "lucide-react"

// ── Password Input (InputGroup-based) ─────────────────────────────────────────

function PasswordInput({ value, onChange, ...props }: React.ComponentProps<"input"> & { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [visible, setVisible] = useState(false)
  return (
    <InputGroup>
      <InputGroupInput {...props} value={value} onChange={onChange} type={visible ? "text" : "password"} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

// ── Password Cell (table display) ─────────────────────────────────────────────

function PasswordCell({ password }: { password: string | null }) {
  const [visible, setVisible] = useState(false)
  if (!password) return <span className="text-muted-foreground text-xs">—</span>
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs">
        {visible ? password : "••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
      </Button>
    </div>
  )
}

// ── Role Badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "clinic_admin":
      return <Badge variant="default" className="gap-1"><ShieldCheckIcon className="size-3" />Admin</Badge>
    case "doctor":
      return <Badge variant="secondary" className="gap-1"><StethoscopeIcon className="size-3" />Doctor</Badge>
    case "receptionist":
      return <Badge variant="outline" className="gap-1"><UserIcon className="size-3" />Receptionist</Badge>
    default:
      return <Badge variant="outline">{role}</Badge>
  }
}

// ── Trial Days Badge ──────────────────────────────────────────────────────────

function TrialBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return null
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) {
    return <Badge variant="destructive" className="gap-1 text-xs"><ClockIcon className="size-3" />Expired</Badge>
  }
  if (days === 0) {
    return <Badge variant="destructive" className="gap-1 text-xs"><ClockIcon className="size-3" />Expires today</Badge>
  }
  return (
    <Badge
      variant={days <= 7 ? "destructive" : "secondary"}
      className="gap-1 text-xs"
    >
      <ClockIcon className="size-3" />
      {days}d left
    </Badge>
  )
}

// ── Capacity Badge ────────────────────────────────────────────────────────────

function CapacityBadge({ count, max, label }: { count: number; max: number; label: string }) {
  const atLimit = count >= max
  return (
    <span className={`text-xs ${atLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
      {label}: {count}/{max}
    </span>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function ClinicsManager() {
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editClinic, setEditClinic] = useState<ClinicRow | null>(null)
  const [usersClinic, setUsersClinic] = useState<ClinicRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClinicRow | null>(null)
  const [notifyClinic, setNotifyClinic] = useState<ClinicRow | null>(null)
  const [showNotifyAll, setShowNotifyAll] = useState(false)
  const [forceLogoutTarget, setForceLogoutTarget] = useState<ClinicRow | null>(null)
  const [search, setSearch] = useState("")
  const [migrating, setMigrating] = useState(false)
  const [usersCache, setUsersCache] = useState<Record<string, ClinicUserRow[]>>({})

  const load = () => {
    listClinics()
      .then((data) => {
        setClinics(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return clinics
    const q = search.toLowerCase()
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    )
  }, [clinics, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-64">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search clinics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setMigrating(true)
              try {
                await runClinicsMigration()
                toast.success("Migrations complete")
              } catch {
                toast.error("Migration failed")
              } finally {
                setMigrating(false)
              }
            }}
            disabled={migrating}
            title="Run pending DB migrations"
          >
            {migrating ? <Loader2Icon className="animate-spin" /> : <DatabaseIcon />}
            Run Migrations
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowNotifyAll(true)}>
            <SendIcon />
            Notify All
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <PlusIcon />
            Add Clinic
          </Button>
        </div>
      </div>

      <AddClinicDialog open={showAdd} onOpenChange={setShowAdd} onSuccess={load} />
      {editClinic && (
        <EditClinicDialog
          clinic={editClinic}
          onOpenChange={(open) => !open && setEditClinic(null)}
          onSuccess={load}
        />
      )}
      {usersClinic && (
        <ClinicUsersDialog
          clinic={usersClinic}
          cachedUsers={usersCache[usersClinic.id]}
          onUsersLoaded={(id, data) => setUsersCache(prev => ({ ...prev, [id]: data }))}
          onOpenChange={(open) => !open && setUsersClinic(null)}
        />
      )}
      {deleteTarget && (
        <DeleteClinicDialog
          clinic={deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onSuccess={load}
        />
      )}
      {notifyClinic && (
        <SendNotificationDialog
          clinic={notifyClinic}
          onOpenChange={(open) => !open && setNotifyClinic(null)}
        />
      )}
      {showNotifyAll && (
        <SendNotificationDialog
          onOpenChange={(open) => !open && setShowNotifyAll(false)}
        />
      )}

      <AlertDialog
        open={!!forceLogoutTarget}
        onOpenChange={(open) => !open && setForceLogoutTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force logout — {forceLogoutTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately invalidate all active sessions for every user in{" "}
              <span className="font-semibold">{forceLogoutTarget?.name}</span>. They will be
              logged out on their next request. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!forceLogoutTarget) return
                const result = await forceLogoutClinic(forceLogoutTarget.id)
                if ("error" in result) toast.error(result.error)
                else toast.success(`All sessions for ${forceLogoutTarget.name} invalidated`)
                setForceLogoutTarget(null)
              }}
            >
              Force Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <TableHead>Plan</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((clinic) => (
                <TableRow key={clinic.id}>
                  <TableCell className="font-medium">{clinic.name}</TableCell>
                  <TableCell className="font-mono text-xs">{clinic.slug}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        clinic.status === "active" ? "default"
                          : clinic.status === "paused" ? "secondary"
                          : "destructive"
                      }
                    >
                      {clinic.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant={
                          clinic.plan === "active" ? "default"
                            : clinic.plan === "trial" ? "secondary"
                            : "destructive"
                        }
                      >
                        {clinic.plan}
                      </Badge>
                      {clinic.plan === "trial" && (
                        <TrialBadge expiresAt={clinic.trial_expires_at} />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <CapacityBadge count={clinic.doctor_count} max={clinic.max_doctors} label="Dr" />
                      <CapacityBadge count={clinic.receptionist_count} max={clinic.max_receptionists} label="Rec" />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(clinic.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="overflow-visible">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditClinic(clinic)} title="Edit Clinic">
                        <PencilIcon />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setUsersClinic(clinic)} title="Users">
                        <UsersIcon />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setNotifyClinic(clinic)} title="Send Notification">
                        <BellIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Force Logout All Users"
                        onClick={() => setForceLogoutTarget(clinic)}
                      >
                        <LogOutIcon />
                      </Button>
                      {clinic.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={async () => {
                            const result = await pauseClinic(clinic.id)
                            if ("error" in result) toast.error(result.error)
                            else { toast.success("Clinic paused"); load() }
                          }}
                          title="Pause"
                        >
                          <PauseIcon />
                        </Button>
                      )}
                      {clinic.status === "paused" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={async () => {
                            const result = await resumeClinic(clinic.id)
                            if ("error" in result) toast.error(result.error)
                            else { toast.success("Clinic resumed"); load() }
                          }}
                          title="Resume"
                        >
                          <PlayIcon />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(clinic)}
                        title="Delete"
                        className="text-destructive"
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {search ? "No clinics match your search." : "No clinics found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

// ── Add Clinic Dialog ────────────────────────────────────────────────────────

function AddClinicDialog({ open, onOpenChange, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [newName, setNewName] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPw, setAdminPw] = useState("")
  const [maxDoctors, setMaxDoctors] = useState("5")
  const [maxReceptionists, setMaxReceptionists] = useState("5")
  const [plan, setPlan] = useState<"active" | "trial">("active")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = await addClinic({
        name: newName,
        slug: newSlug,
        adminFullName: adminName,
        adminEmail: adminEmail,
        adminPassword: adminPw,
        maxDoctors: parseInt(maxDoctors) || 5,
        maxReceptionists: parseInt(maxReceptionists) || 5,
        plan,
      })
      if ("error" in result) {
        setError(result.error as string)
      } else {
        onOpenChange(false)
        setNewName(""); setNewSlug(""); setAdminName(""); setAdminEmail(""); setAdminPw("")
        setMaxDoctors("5"); setMaxReceptionists("5"); setPlan("active")
        toast.success("Clinic created successfully")
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Clinic</DialogTitle></DialogHeader>
        <form onSubmit={handleAdd} className="max-h-[70vh] space-y-3 overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Clinic Name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="My Clinic" />
          </div>
          <div className="space-y-1.5">
            <Label>Slug <span className="text-xs text-muted-foreground">(lowercase, underscores only)</span></Label>
            <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required placeholder="my_clinic" pattern="^[a-z][a-z0-9_]*$" />
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial (30 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="pt-2 text-xs font-semibold text-muted-foreground">Clinic Admin Account</p>
          <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} required placeholder="Admin full name" />
          <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required type="email" placeholder="Admin email" />
          <PasswordInput value={adminPw} onChange={(e) => setAdminPw(e.target.value)} required placeholder="Password (min 8)" minLength={8} />
          <p className="pt-2 text-xs font-semibold text-muted-foreground">User Limits</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Max Doctors</Label>
              <Input type="number" min="1" max="100" value={maxDoctors} onChange={(e) => setMaxDoctors(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Receptionists</Label>
              <Input type="number" min="1" max="100" value={maxReceptionists} onChange={(e) => setMaxReceptionists(e.target.value)} />
            </div>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Clinic Dialog (full edit: details + plan + limits + contact) ─────────

function EditClinicDialog({ clinic, onOpenChange, onSuccess }: {
  clinic: ClinicRow
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(clinic.name)
  const [phone, setPhone] = useState(clinic.phone ?? "")
  const [address, setAddress] = useState(clinic.address ?? "")
  const [website, setWebsite] = useState(clinic.website ?? "")
  const [maxDoctors, setMaxDoctors] = useState(String(clinic.max_doctors))
  const [maxReceptionists, setMaxReceptionists] = useState(String(clinic.max_receptionists))
  const [plan, setPlan] = useState(clinic.plan)
  const [trialExpires, setTrialExpires] = useState(clinic.trial_expires_at ?? "")
  const [paymentNotes, setPaymentNotes] = useState(clinic.payment_notes ?? "")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handlePlanChange = (newPlan: typeof plan) => {
    setPlan(newPlan)
    if (newPlan === "trial" && !trialExpires) {
      const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      setTrialExpires(d.toISOString().split("T")[0]!)
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = await updateClinic(clinic.id, {
        name,
        phone,
        address,
        website,
        maxDoctors: parseInt(maxDoctors) || clinic.max_doctors,
        maxReceptionists: parseInt(maxReceptionists) || clinic.max_receptionists,
        plan,
        trialExpiresAt: trialExpires || null,
        paymentNotes: paymentNotes || null,
      })
      if ("error" in result) {
        setError(result.error)
      } else {
        onOpenChange(false)
        toast.success("Clinic updated")
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Clinic — {clinic.slug}</DialogTitle></DialogHeader>
        <form onSubmit={handleSave} className="max-h-[70vh] space-y-3 overflow-y-auto">
          <div className="space-y-1.5">
            <Label>Clinic Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Optional" />
          </div>
          <p className="pt-2 text-xs font-semibold text-muted-foreground">User Limits</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Max Doctors</Label>
              <Input type="number" min="1" max="100" value={maxDoctors} onChange={(e) => setMaxDoctors(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Receptionists</Label>
              <Input type="number" min="1" max="100" value={maxReceptionists} onChange={(e) => setMaxReceptionists(e.target.value)} />
            </div>
          </div>
          <p className="pt-2 text-xs font-semibold text-muted-foreground">Plan & Billing</p>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={(v) => handlePlanChange(v as typeof plan)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {plan === "trial" && (
            <div className="space-y-1.5">
              <Label>Trial Expires At</Label>
              <Input type="date" value={trialExpires} onChange={(e) => setTrialExpires(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Payment Notes</Label>
            <Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Optional payment notes..." rows={2} />
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Clinic Users Dialog ──────────────────────────────────────────────────────

function ClinicUsersDialog({ clinic, cachedUsers, onUsersLoaded, onOpenChange }: {
  clinic: ClinicRow
  cachedUsers: ClinicUserRow[] | undefined
  onUsersLoaded: (clinicId: string, data: ClinicUserRow[]) => void
  onOpenChange: (open: boolean) => void
}) {
  const [users, setUsers] = useState<ClinicUserRow[]>(cachedUsers ?? [])
  const [loading, setLoading] = useState(!cachedUsers)
  const [editUser, setEditUser] = useState<ClinicUserRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<ClinicUserRow | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)

  const reload = () =>
    listClinicUsers(clinic.id)
      .then((data) => { setUsers(data); onUsersLoaded(clinic.id, data) })
      .catch(() => toast.error("Failed to reload users"))

  useEffect(() => {
    if (cachedUsers) return
    listClinicUsers(clinic.id).then((data) => {
      setUsers(data)
      onUsersLoaded(clinic.id, data)
      setLoading(false)
    })
  }, [clinic.id])

  const handleToggle = (user: ClinicUserRow) => {
    if (user.is_active) {
      setDeactivateTarget(user)
      return
    }
    executeToggle(user.id, true)
  }

  const executeToggle = async (userId: string, isActive: boolean) => {
    setTogglingId(userId)
    const result = await toggleClinicUserActive(userId, isActive)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success(isActive ? "User activated" : "User deactivated")
    }
    await reload()
    setTogglingId(null)
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl min-w-fit">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Users — {clinic.name}</DialogTitle>
            <Button size="sm" onClick={() => setShowAddUser(true)}>
              <UserPlusIcon />
              Add User
            </Button>
          </div>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-4 text-center text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>{user.full_name}</div>
                      {user.specialization && <div className="text-xs text-muted-foreground">{user.specialization}</div>}
                    </TableCell>
                    <TableCell className="text-xs">{user.email}</TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell><PasswordCell password={user.display_password} /></TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200">
                          <CheckIcon className="size-3" />Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditUser(user)} title="Edit">
                          <PencilIcon />
                        </Button>
                        {user.role !== "clinic_admin" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleToggle(user)}
                            disabled={togglingId === user.id}
                            title={user.is_active ? "Deactivate" : "Activate"}
                          >
                            {togglingId === user.id ? (
                              <Loader2Icon className="animate-spin" />
                            ) : user.is_active ? (
                              <span className="text-destructive text-xs font-medium">Off</span>
                            ) : (
                              <span className="text-emerald-600 text-xs font-medium">On</span>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {editUser && (
            <EditUserInline
              user={editUser}
              onDone={() => { setEditUser(null); reload() }}
            />
          )}

          {showAddUser && (
            <AddUserInline
              clinicId={clinic.id}
              onDone={() => { setShowAddUser(false); reload() }}
            />
          )}
        </div>
      </DialogContent>

      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke their access and invalidate all sessions.
              You can reactivate them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deactivateTarget) {
                  executeToggle(deactivateTarget.id, false)
                  setDeactivateTarget(null)
                }
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}

// ── Add User Inline (platform admin adds user to a clinic) ───────────────────

function AddUserInline({ clinicId, onDone }: { clinicId: string; onDone: () => void }) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"doctor" | "receptionist">("doctor")
  const [specialization, setSpecialization] = useState("")
  const [credentials, setCredentials] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = await addClinicUser(clinicId, {
        fullName,
        email,
        password,
        role,
        specialization: specialization || undefined,
        credentials: credentials || undefined,
      })
      if ("error" in result) {
        setError(result.error)
      } else {
        toast.success("User added")
        onDone()
      }
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Add User to Clinic</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Dr. Ahmad" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="receptionist">Receptionist</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="user@clinic.com" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Password</Label>
        <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 8 characters" minLength={8} />
      </div>
      {role === "doctor" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Specialization</Label>
            <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. General Physician" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Credentials</Label>
            <Input value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="e.g. MBBS, FCPS" />
          </div>
        </div>
      )}
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Add User
        </Button>
      </div>
    </form>
  )
}

// ── Edit User Inline (expanded: name, email, specialization, credentials, password) ──

function EditUserInline({ user, onDone }: { user: ClinicUserRow; onDone: () => void }) {
  const [fullName, setFullName] = useState(user.full_name)
  const [email, setEmail] = useState(user.email)
  const [specialization, setSpecialization] = useState(user.specialization ?? "")
  const [credentials, setCredentials] = useState(user.credentials ?? "")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    setError("")
    startTransition(async () => {
      const result = await updateClinicUser(user.id, {
        fullName: fullName !== user.full_name ? fullName : undefined,
        email: email !== user.email ? email : undefined,
        specialization,
        credentials,
        newPassword: newPassword || undefined,
      })
      if ("error" in result) {
        setError(result.error)
      } else {
        toast.success("User updated")
        onDone()
      }
    })
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Edit {user.full_name}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
      </div>
      {user.role === "doctor" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Specialization</Label>
            <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Credentials</Label>
            <Input value={credentials} onChange={(e) => setCredentials(e.target.value)} />
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">New Password</Label>
        <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  )
}

// ── Send Notification Dialog ─────────────────────────────────────────────────

function SendNotificationDialog({
  clinic,
  onOpenChange,
}: {
  clinic?: ClinicRow
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [type, setType] = useState<"info" | "warning" | "urgent">("info")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      const result = clinic
        ? await sendNotification(clinic.id, title, message, type)
        : await sendNotificationToAll(title, message, type)
      if ("error" in result) {
        setError(result.error)
      } else {
        onOpenChange(false)
        toast.success(clinic ? `Notification sent to ${clinic.name}` : "Notification sent to all clinics")
      }
    })
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {clinic ? `Notify — ${clinic.name}` : "Notify All Clinics"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="System update" />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Enter notification message..." rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Clinic Dialog ─────────────────────────────────────────────────────

function DeleteClinicDialog({ clinic, onOpenChange, onSuccess }: {
  clinic: ClinicRow
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const handleDelete = () => {
    startTransition(async () => {
      setError("")
      const result = await deleteClinic(clinic.id)
      if (result && "error" in result && result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        toast.success("Clinic deleted")
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Clinic</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{clinic.name}</span>? This will drop
            the clinic schema and all data. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
