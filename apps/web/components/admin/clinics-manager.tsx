"use client"

import { useState, useEffect, useTransition } from "react"
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
  listClinics,
  addClinic,
  pauseClinic,
  resumeClinic,
  deleteClinic,
  setClinicPlan,
  listClinicUsers,
  updateClinicUser,
  type ClinicRow,
  type AddClinicInput,
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
} from "lucide-react"

export function ClinicsManager() {
  const [clinics, setClinics] = useState<ClinicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editClinic, setEditClinic] = useState<ClinicRow | null>(null)
  const [usersClinic, setUsersClinic] = useState<ClinicRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClinicRow | null>(null)

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
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
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{clinic.user_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(clinic.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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
                            await pauseClinic(clinic.id)
                            load()
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
                            await resumeClinic(clinic.id)
                            load()
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
  const [drName, setDrName] = useState("")
  const [drEmail, setDrEmail] = useState("")
  const [drPw, setDrPw] = useState("")
  const [recName, setRecName] = useState("")
  const [recEmail, setRecEmail] = useState("")
  const [recPw, setRecPw] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

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
        onOpenChange(false)
        setNewName("")
        setNewSlug("")
        setDrName("")
        setDrEmail("")
        setDrPw("")
        setRecName("")
        setRecEmail("")
        setRecPw("")
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
          <p className="pt-2 text-xs font-semibold text-muted-foreground">
            Doctor Account
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={drName}
              onChange={(e) => setDrName(e.target.value)}
              required
              placeholder="Full name"
            />
            <Input
              value={drEmail}
              onChange={(e) => setDrEmail(e.target.value)}
              required
              type="email"
              placeholder="Email"
            />
          </div>
          <Input
            value={drPw}
            onChange={(e) => setDrPw(e.target.value)}
            required
            type="password"
            placeholder="Password (min 8)"
            minLength={8}
          />
          <p className="pt-2 text-xs font-semibold text-muted-foreground">
            Receptionist Account
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={recName}
              onChange={(e) => setRecName(e.target.value)}
              required
              placeholder="Full name"
            />
            <Input
              value={recEmail}
              onChange={(e) => setRecEmail(e.target.value)}
              required
              type="email"
              placeholder="Email"
            />
          </div>
          <Input
            value={recPw}
            onChange={(e) => setRecPw(e.target.value)}
            required
            type="password"
            placeholder="Password (min 8)"
            minLength={8}
          />
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
            <Select value={plan} onValueChange={(v) => setPlan(v as typeof plan)}>
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

  useEffect(() => {
    listClinicUsers(clinic.id).then((data) => {
      setUsers(data)
      setLoading(false)
    })
  }, [clinic.id])

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Users — {clinic.name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-4 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell className="text-xs">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditUser(user)}
                    >
                      <PencilIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {editUser && (
          <EditUserInline
            user={editUser}
            onDone={() => {
              setEditUser(null)
              listClinicUsers(clinic.id).then(setUsers)
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
        <Input
          type="password"
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

  const handleDelete = () => {
    startTransition(async () => {
      await deleteClinic(clinic.id)
      onOpenChange(false)
      onSuccess()
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
