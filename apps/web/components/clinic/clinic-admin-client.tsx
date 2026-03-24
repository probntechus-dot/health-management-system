"use client"

import { useState, useEffect, useTransition } from "react"
import {
  getClinicUsers,
  getClinicLimits,
  addUser,
  updateUser,
  toggleUserActive,
  setReceptionistDoctors,
} from "@/actions/clinic-admin"
import type { ClinicUserRow, ClinicLimits } from "@/actions/clinic-admin"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  UserPlusIcon,
  PencilIcon,
  UsersIcon,
  Loader2Icon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UserIcon,
  CheckIcon,
} from "lucide-react"

// ── Add User Dialog ──────────────────────────────────────────────────────────

function AddUserDialog({
  open,
  onOpenChange,
  doctors,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctors: ClinicUserRow[]
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [role, setRole] = useState<"doctor" | "receptionist">("doctor")
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      setError("")
      const result = await addUser({
        fullName: fd.get("fullName") as string,
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        role,
        specialization: fd.get("specialization") as string,
        credentials: fd.get("credentials") as string,
        allocatedDoctorIds: role === "receptionist" ? selectedDoctors : undefined,
      })
      if ("error" in result) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setError("")
        setRole("doctor")
        setSelectedDoctors([])
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "doctor" | "receptionist")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="receptionist">Receptionist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" required placeholder="e.g. Sarmad Aslam" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="user@clinic.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} placeholder="Min 8 characters" />
          </div>
          {role === "doctor" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" placeholder="e.g. General Physician" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credentials">Credentials</Label>
                <Input id="credentials" name="credentials" placeholder="e.g. MBBS, FCPS" />
              </div>
            </>
          )}
          {role === "receptionist" && doctors.length > 0 && (
            <div className="space-y-2">
              <Label>Allocate to Doctors</Label>
              <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {doctors.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDoctors.includes(d.id)}
                      onChange={(e) =>
                        setSelectedDoctors(
                          e.target.checked
                            ? [...selectedDoctors, d.id]
                            : selectedDoctors.filter((id) => id !== d.id)
                        )
                      }
                      className="rounded"
                    />
                    {d.full_name}
                    {d.specialization && (
                      <span className="text-muted-foreground text-xs">({d.specialization})</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              {isPending ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit User Dialog ─────────────────────────────────────────────────────────

function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: {
  user: ClinicUserRow
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      setError("")
      const result = await updateUser(user.id, {
        fullName: fd.get("fullName") as string,
        email: fd.get("email") as string,
        ...(user.role === "doctor" && {
          specialization: fd.get("specialization") as string,
          credentials: fd.get("credentials") as string,
        }),
        newPassword: (fd.get("newPassword") as string) || undefined,
      })
      if ("error" in result) {
        setError(result.error)
      } else {
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {user.full_name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editFullName">Full Name</Label>
            <Input id="editFullName" name="fullName" defaultValue={user.full_name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEmail">Email</Label>
            <Input id="editEmail" name="email" type="email" defaultValue={user.email} required />
          </div>
          {user.role === "doctor" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="editSpec">Specialization</Label>
                <Input id="editSpec" name="specialization" defaultValue={user.specialization ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCred">Credentials</Label>
                <Input id="editCred" name="credentials" defaultValue={user.credentials ?? ""} />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="editPw">New Password (leave blank to keep current)</Label>
            <Input id="editPw" name="newPassword" type="password" placeholder="Min 8 characters" />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Allocate Doctors Dialog ──────────────────────────────────────────────────

function AllocateDialog({
  receptionist,
  doctors,
  open,
  onOpenChange,
  onSuccess,
}: {
  receptionist: ClinicUserRow
  doctors: ClinicUserRow[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<string[]>(receptionist.allocated_doctor_ids)

  useEffect(() => {
    setSelected(receptionist.allocated_doctor_ids)
  }, [receptionist.allocated_doctor_ids])

  const [error, setError] = useState("")

  const handleSave = () => {
    startTransition(async () => {
      setError("")
      const result = await setReceptionistDoctors(receptionist.id, selected)
      if ("error" in result) {
        setError(result.error)
      } else {
        onOpenChange(false)
        onSuccess()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Allocate Doctors to {receptionist.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {doctors.map((d) => (
            <label key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(d.id)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, d.id]
                      : selected.filter((id) => id !== d.id)
                  )
                }
                className="rounded"
              />
              <div>
                <div className="text-sm font-medium">{d.full_name}</div>
                {d.specialization && (
                  <div className="text-xs text-muted-foreground">{d.specialization}</div>
                )}
              </div>
            </label>
          ))}
          {doctors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No doctors added yet.</p>
          )}
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Role Badge ───────────────────────────────────────────────────────────────

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

// ── Main Component ───────────────────────────────────────────────────────────

export function ClinicAdminClient() {
  const [users, setUsers] = useState<ClinicUserRow[]>([])
  const [limits, setLimits] = useState<ClinicLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState<ClinicUserRow | null>(null)
  const [allocateUser, setAllocateUser] = useState<ClinicUserRow | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadData = async () => {
    const [u, l] = await Promise.all([getClinicUsers(), getClinicLimits()])
    setUsers(u)
    setLimits(l)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const doctors = users.filter((u) => u.role === "doctor" && u.is_active)
  const canAddDoctor = limits ? limits.doctor_count < limits.max_doctors : false
  const canAddReceptionist = limits ? limits.receptionist_count < limits.max_receptionists : false

  const [toggleError, setToggleError] = useState("")

  const handleToggle = async (userId: string, isActive: boolean) => {
    setTogglingId(userId)
    setToggleError("")
    const result = await toggleUserActive(userId, isActive)
    if ("error" in result) {
      setToggleError(result.error)
    }
    await loadData()
    setTogglingId(null)
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add and manage doctors and receptionists for your clinic.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} disabled={!canAddDoctor && !canAddReceptionist}>
          <UserPlusIcon />
          Add User
        </Button>
      </div>

      {toggleError && (
        <Alert variant="destructive">
          <AlertDescription>{toggleError}</AlertDescription>
        </Alert>
      )}

      {/* Limits */}
      {limits && (
        <div className="grid grid-cols-2 gap-4">
          <Card size="sm">
            <CardHeader>
              <CardDescription>Doctors</CardDescription>
              <CardTitle>{limits.doctor_count} / {limits.max_doctors}</CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Receptionists</CardDescription>
              <CardTitle>{limits.receptionist_count} / {limits.max_receptionists}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-5" />
            Clinic Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="!overflow-visible !whitespace-normal">
                    <div className="font-medium">{user.full_name}</div>
                    {user.specialization && (
                      <div className="text-xs text-muted-foreground">{user.specialization}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell><RoleBadge role={user.role} /></TableCell>
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
                      {user.role !== "clinic_admin" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditUser(user)}
                            title="Edit"
                          >
                            <PencilIcon />
                          </Button>
                          {user.role === "receptionist" && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setAllocateUser(user)}
                              title="Allocate doctors"
                            >
                              <UsersIcon />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleToggle(user.id, !user.is_active)}
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
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddUserDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        doctors={doctors}
        onSuccess={loadData}
      />
      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(open) => !open && setEditUser(null)}
          onSuccess={loadData}
        />
      )}
      {allocateUser && (
        <AllocateDialog
          receptionist={allocateUser}
          doctors={doctors}
          open={!!allocateUser}
          onOpenChange={(open) => !open && setAllocateUser(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
