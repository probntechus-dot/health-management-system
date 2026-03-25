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
  setClinicPlan,
  listClinicUsers,
  updateClinicUser,
  toggleClinicUserActive,
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

// ── Main Component ───────────────────────────────────────────────────────────

export function ClinicsManager() {
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editClinic, setEditClinic] = useState<ClinicRow | null>(null)
  const [usersClinic, setUsersClinic] = useState<ClinicRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClinicRow | null>(null)
  const [search, setSearch] = useState("")

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
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <PlusIcon />
          Add Clinic
        </Button>
      </div>

      <AddClinicDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onSuccess={load}
      />

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

      <Card>
        {loading ? (
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading...
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Name</TableHead>
                <TableHead className="w-[12%]">Slug</TableHead>
                <TableHead className="w-[10%]">Status</TableHead>
                <TableHead className="w-[15%]">Plan</TableHead>
                <TableHead className="w-[6%]">Users</TableHead>
                <TableHead className="w-[12%]">Created</TableHead>
                <TableHead className="w-[23%] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((clinic) => (
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
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant={
                          clinic.plan === "active"
                            ? "default"
                            : clinic.plan === "trial"
                              ? "secondary"
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
                  <TableCell>{clinic.user_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(clinic.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="overflow-visible">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditClinic(clinic)}
                        title="Edit Plan"
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setUsersClinic(clinic)}
                        title="Users"
                      >
                        <UsersIcon />
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

function AddClinicDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
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
        setNewName("")
        setNewSlug("")
        setAdminName("")
        setAdminEmail("")
        setAdminPw("")
        setMaxDoctors("5")
        setMaxReceptionists("5")
        setPlan("active")
        toast.success("Clinic created successfully")
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Clinic</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleAdd}
          className="max-h-[70vh] space-y-3 overflow-y-auto"
        >
          <div className="space-y-1.5">
            <Label>Clinic Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="My Clinic"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Slug{" "}
              <span className="text-xs text-muted-foreground">
                (lowercase, underscores only)
              </span>
            </Label>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              required
              placeholder="my_clinic"
              pattern="^[a-z][a-z0-9_]*$"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial (30 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="pt-2 text-xs font-semibold text-muted-foreground">
            Clinic Admin Account
          </p>
          <Input
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            required
            placeholder="Admin full name"
          />
          <Input
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
            type="email"
            placeholder="Admin email"
          />
          <PasswordInput
            value={adminPw}
            onChange={(e) => setAdminPw(e.target.value)}
            required
            placeholder="Password (min 8)"
            minLength={8}
          />
          <p className="pt-2 text-xs font-semibold text-muted-foreground">
            User Limits
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Max Doctors</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={maxDoctors}
                onChange={(e) => setMaxDoctors(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Receptionists</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={maxReceptionists}
                onChange={(e) => setMaxReceptionists(e.target.value)}
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
  )
}

// ── Edit Clinic Plan Dialog ──────────────────────────────────────────────────

function EditClinicDialog({
  clinic,
  onOpenChange,
  onSuccess,
}: {
  clinic: ClinicRow
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [plan, setPlan] = useState(clinic.plan)
  const [trialExpires, setTrialExpires] = useState(
    clinic.trial_expires_at ?? ""
  )
  const [paymentNotes, setPaymentNotes] = useState(
    clinic.payment_notes ?? ""
  )
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  // Auto-set 30-day trial when switching to trial plan
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
      const result = await setClinicPlan(
        clinic.id,
        plan,
        trialExpires || null,
        paymentNotes || null
      )
      if ("error" in result) {
        setError(result.error)
      } else {
        onOpenChange(false)
        toast.success("Plan updated")
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Plan — {clinic.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={(v) => handlePlanChange(v as typeof plan)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
              <Input
                type="date"
                value={trialExpires}
                onChange={(e) => setTrialExpires(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Payment Notes</Label>
            <Textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Optional payment notes..."
              rows={3}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
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

function ClinicUsersDialog({
  clinic,
  onOpenChange,
}: {
  clinic: ClinicRow
  onOpenChange: (open: boolean) => void
}) {
  const [users, setUsers] = useState<ClinicUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<ClinicUserRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const reload = () => listClinicUsers(clinic.id).then(setUsers)

  useEffect(() => {
    listClinicUsers(clinic.id).then((data) => {
      setUsers(data)
      setLoading(false)
    })
  }, [clinic.id])

  const handleToggle = async (user: ClinicUserRow) => {
    setTogglingId(user.id)
    const result = await toggleClinicUserActive(user.id, !user.is_active)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success(user.is_active ? "User deactivated" : "User activated")
    }
    await reload()
    setTogglingId(null)
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Users — {clinic.name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-4 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
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
                    <TableCell className="font-medium">{user.full_name}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditUser(user)}
                          title="Edit"
                        >
                          <PencilIcon />
                        </Button>
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
          </div>
        )}

        {editUser && (
          <EditUserInline
            user={editUser}
            onDone={() => {
              setEditUser(null)
              reload()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditUserInline({
  user,
  onDone,
}: {
  user: ClinicUserRow
  onDone: () => void
}) {
  const [fullName, setFullName] = useState(user.full_name)
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    setError("")
    startTransition(async () => {
      const result = await updateClinicUser(user.id, {
        fullName: fullName !== user.full_name ? fullName : undefined,
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
      <div className="space-y-1.5">
        <Label>Full Name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>New Password</Label>
        <PasswordInput
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave blank to keep current"
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2Icon className="animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  )
}

// ── Delete Clinic Dialog ─────────────────────────────────────────────────────

function DeleteClinicDialog({
  clinic,
  onOpenChange,
  onSuccess,
}: {
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
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
