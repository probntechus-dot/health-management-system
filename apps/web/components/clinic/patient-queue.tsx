"use client"

import { useState, useEffect, useRef, useTransition, useCallback } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { getAllVisits, updateVisitStatus, createVisit } from "@/actions/patients"
import { logger } from "@/lib/logger"
import { visitsCache } from "@/lib/cache"
import type { PatientMatch } from "@/lib/cache"
import { PAGE_SIZE } from "@/lib/constants"
import type { Visit, VisitStatus } from "@/lib/types"
import { formatMrn } from "@/lib/utils"
import { ContactLookup } from "@/components/clinic/contact-lookup"
import { useLatestRequest } from "@/hooks/use-latest-request"
import {
  Loader2Icon,
  Volume2Icon,
  XIcon,
  PlusIcon,
  PencilIcon,
  ClockIcon,
  RotateCcwIcon,
  AlertCircleIcon,
  CircleDotIcon,
  MegaphoneIcon,
  CircleCheckIcon,
  BanIcon,
  ChevronDownIcon,
} from "lucide-react"

type Prefill = {
  full_name: string
  age: number | null
  gender: string
  contact: string
  address: string
}

interface PatientQueueProps {
  clinicSlug: string
  userRole: "doctor" | "receptionist"
  onPatientSelect?: (visit: Visit) => void
  onReAdd?: (data: Prefill) => void
  refreshKey?: number
}

function groupVisitsByDate(
  visits: Visit[]
): { label: string; patients: Visit[] }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const map = new Map<string, Visit[]>()
  for (const v of visits) {
    const d = new Date(v.created_at)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(v)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, group]) => {
      const d = new Date(key)
      const diffDays = Math.round(
        (today.getTime() - d.getTime()) / 86400000
      )
      let label: string
      if (diffDays === 0) {
        label = "Today"
      } else {
        label = d.toLocaleDateString("en-PK", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      }
      return { label, patients: group }
    })
}

const STATUS_CONFIG: Record<string, {
  icon: typeof CircleDotIcon
  label: string
  dot: string
}> = {
  waiting:   { icon: CircleDotIcon,   label: "Waiting",   dot: "bg-amber-500" },
  called:    { icon: MegaphoneIcon,   label: "Called",     dot: "bg-blue-500" },
  checked:   { icon: CircleCheckIcon, label: "Checked",    dot: "bg-emerald-500" },
  cancelled: { icon: BanIcon,         label: "Cancelled",  dot: "bg-red-500" },
}

/** Transitions that need a confirmation dialog before executing. */
function getConfirmation(
  from: VisitStatus,
  to: VisitStatus,
  patientName: string,
  token: string,
): { title: string; description: string; action: string; destructive: boolean } | null {
  const name = patientName
  const tok = token.replace(/^T-/, "")

  if (to === "cancelled") {
    return {
      title: "Cancel Visit",
      description: `Cancel the appointment for ${name} (Token ${tok})? The patient will be removed from the active queue.`,
      action: "Cancel Visit",
      destructive: true,
    }
  }
  if (from === "checked") {
    const targetLabel = STATUS_CONFIG[to]?.label ?? to
    return {
      title: "Revert Checked Patient",
      description: `${name} (Token ${tok}) has already been marked as checked. Move back to "${targetLabel}"?`,
      action: `Move to ${targetLabel}`,
      destructive: false,
    }
  }
  if (from === "cancelled") {
    const targetLabel = STATUS_CONFIG[to]?.label ?? to
    return {
      title: "Reopen Cancelled Visit",
      description: `Reopen the cancelled visit for ${name} (Token ${tok}) and set status to "${targetLabel}"?`,
      action: `Reopen as ${targetLabel}`,
      destructive: false,
    }
  }
  // Normal transitions (waiting↔called) — no confirmation needed
  return null
}

export function PatientQueue({
  clinicSlug,
  userRole,
  onPatientSelect,
  onReAdd,
  refreshKey,
}: PatientQueueProps) {
  const cached = visitsCache.get(clinicSlug)
  const [patients, setPatients] = useState<Visit[]>(cached ?? [])
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(cached === null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalPrefill, setModalPrefill] = useState<Prefill | undefined>()
  const [formError, setFormError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [modalContact, setModalContact] = useState("")
  const [updatingAction, setUpdatingAction] = useState<{
    visitId: string
    status: VisitStatus
  } | null>(null)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null)
  const [statusConfirm, setStatusConfirm] = useState<{
    visit: Visit
    to: VisitStatus
    title: string
    description: string
    action: string
    destructive: boolean
  } | null>(null)
  const [confirmPending, setConfirmPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [modalName, setModalName] = useState("")
  const [modalAge, setModalAge] = useState("")
  const [modalGender, setModalGender] = useState("")
  const [modalReason, setModalReason] = useState("")
  const fireLatest = useLatestRequest()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    offsetRef.current = 0
    setHasMore(true)
    if (visitsCache.get(clinicSlug) !== null && !refreshKey) {
      offsetRef.current = visitsCache.get(clinicSlug)!.length
      return
    }
    loadVisits()
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (modalPrefill) {
      setModalName(modalPrefill.full_name)
      setModalAge(modalPrefill.age != null ? String(modalPrefill.age) : "")
      setModalGender(modalPrefill.gender)
      setModalContact(modalPrefill.contact)
      setModalReason("")
    }
  }, [modalPrefill])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) loadMore()
      },
      { rootMargin: "100px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let isMounted = true
    const es = new EventSource("/api/queue/stream")

    es.onmessage = (event) => {
      if (!isMounted) return
      try {
        const payload = JSON.parse(event.data) as {
          type: string
          visitId?: string
          status?: VisitStatus
        }
        if (
          payload.type === "status_changed" &&
          payload.visitId &&
          payload.status
        ) {
          visitsCache.patchStatus(payload.visitId, payload.status)
          setPatients((prev) =>
            prev.map((v) =>
              v.id === payload.visitId
                ? { ...v, status: payload.status as VisitStatus }
                : v
            )
          )
        } else if (payload.type === "visit_added") {
          visitsCache.invalidate()
          loadVisits()
        }
      } catch (err) {
        logger.error("SSE parse error", err)
      }
    }

    es.onerror = () => {
      // EventSource auto-reconnects
    }

    return () => {
      isMounted = false
      es.close()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadVisits = async () => {
    try {
      const data = await getAllVisits(0)
      visitsCache.set(clinicSlug, data)
      setPatients(data)
      offsetRef.current = data.length
      setHasMore(data.length === PAGE_SIZE)
    } catch (error) {
      logger.error("Error loading visits", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setLoadMoreError(false)
    try {
      const data = await getAllVisits(offsetRef.current)
      visitsCache.append(clinicSlug, data)
      setPatients((prev) => [...prev, ...data])
      offsetRef.current += data.length
      setHasMore(data.length === PAGE_SIZE)
    } catch (error) {
      logger.error("Error loading more visits", error)
      setLoadMoreError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  const filteredPatients = patients.filter((visit) => {
    const matchesStatus =
      filterStatus === "all" || visit.status === filterStatus
    const matchesSearch =
      searchQuery === "" ||
      visit.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatMrn(visit.patient_mrn)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (visit.patient_contact || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const applyStatusChange = useCallback(
    (visitId: string, status: VisitStatus) => {
      const current = patients.find((v) => v.id === visitId)
      if (current?.status === status) return

      setUpdatingAction({ visitId, status })
      fireLatest(
        () => updateVisitStatus(visitId, status),
        (result) => {
          if (result.success) {
            setStatusDropdownOpen(null)
            requestAnimationFrame(() => {
              visitsCache.patchStatus(visitId, status)
              setPatients((prev) =>
                prev.map((v) => (v.id === visitId ? { ...v, status } : v))
              )
            })
          }
        },
        () => setUpdatingAction(null),
        () => {
          setStatusDropdownOpen(null)
          setActionError(
            "Failed to update patient status. Please try again."
          )
        }
      )
    },
    [patients, fireLatest]
  )

  const requestStatusChange = useCallback(
    (visitId: string, to: VisitStatus) => {
      const visit = patients.find((v) => v.id === visitId)
      if (!visit || visit.status === to) return

      const confirm = getConfirmation(visit.status, to, visit.patient_name, visit.token_label)
      if (confirm) {
        setStatusDropdownOpen(null)
        setStatusConfirm({ visit, to, ...confirm })
      } else {
        applyStatusChange(visitId, to)
      }
    },
    [patients, applyStatusChange]
  )

  const executeConfirmedChange = useCallback(() => {
    if (!statusConfirm) return
    setConfirmPending(true)
    fireLatest(
      () => updateVisitStatus(statusConfirm.visit.id, statusConfirm.to),
      (result) => {
        if (result.success) {
          visitsCache.patchStatus(statusConfirm.visit.id, statusConfirm.to)
          setPatients((prev) =>
            prev.map((v) =>
              v.id === statusConfirm.visit.id
                ? { ...v, status: statusConfirm.to }
                : v
            )
          )
        }
        setStatusConfirm(null)
        setConfirmPending(false)
      },
      () => setConfirmPending(false),
      () => setActionError("Failed to update status. Please try again.")
    )
  }, [statusConfirm, fireLatest])

  const handleReAdd = (visit: Visit) => {
    const data: Prefill = {
      full_name: visit.patient_name,
      age: visit.patient_age,
      gender: visit.patient_gender,
      contact: visit.patient_contact,
      address: visit.patient_address,
    }
    if (userRole === "doctor") {
      setModalPrefill(data)
      setShowAddModal(true)
    } else {
      onReAdd?.(data)
    }
  }

  const handleModalSelect = (m: PatientMatch) => {
    setModalName(m.full_name)
    setModalAge(String(m.age ?? ""))
    setModalGender(m.gender ?? "")
    setModalContact(m.contact_number)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setFormError("")
    setModalPrefill(undefined)
    setModalContact("")
    setModalName("")
    setModalAge("")
    setModalGender("")
    setModalReason("")
  }

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("contact", modalContact)
    formData.append("fullName", modalName)
    formData.append("age", modalAge)
    formData.append("gender", modalGender)
    formData.append("reasonForVisit", modalReason)
    formData.append("address", modalPrefill?.address || "Not provided")
    startTransition(async () => {
      setFormError("")
      const result = await createVisit(formData)
      if (result?.error) {
        setFormError(result.error)
      } else {
        closeModal()
        await loadVisits()
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {userRole === "doctor" ? "Patient Queue" : "Live Queue"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {actionError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{actionError}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setActionError(null)}
            >
              <XIcon className="size-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Add Patient Dialog (doctor only) */}
      <Dialog open={showAddModal} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPatient} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Contact</Label>
              <ContactLookup
                clinicSlug={clinicSlug}
                contact={modalContact}
                setContact={setModalContact}
                onSelect={handleModalSelect}
                skipInitialSearch={!!modalPrefill}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input
                required
                value={modalName}
                onChange={(e) => setModalName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Age</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={modalAge}
                  onChange={(e) => setModalAge(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select
                  value={modalGender}
                  onValueChange={setModalGender}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason for visit</Label>
              <Input
                required
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
              />
            </div>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2Icon className="animate-spin" />}
                {isPending ? "Registering..." : "Assign Token & Register"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation */}
      <AlertDialog
        open={!!statusConfirm}
        onOpenChange={(open) => {
          if (!open && !confirmPending) setStatusConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusConfirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusConfirm?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmPending}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmedChange}
              disabled={confirmPending}
              variant={statusConfirm?.destructive ? "destructive" : "default"}
            >
              {confirmPending && <Loader2Icon className="animate-spin" />}
              {confirmPending ? "Updating..." : statusConfirm?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>
              {userRole === "doctor" ? "Patient Queue" : "Live Queue"}
            </CardTitle>
            {userRole === "doctor" && (
              <Button
                size="sm"
                onClick={() => {
                  setModalPrefill(undefined)
                  setModalContact("")
                  setShowAddModal(true)
                }}
              >
                <PlusIcon />
                Add Patient
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-center">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Filter</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="called">Called</SelectItem>
                  <SelectItem value="checked">Checked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <Input
                placeholder="Search name, MRN or contact"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      {filteredPatients.length > 0 ? (
        groupVisitsByDate(filteredPatients).map(
          ({ label, patients: group }) => (
            <div key={label} className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-4">
                {label}
              </span>
              <div className="border rounded-lg overflow-hidden">
              <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[8%]">Token</TableHead>
                      <TableHead className="w-[20%]">Patient</TableHead>
                      <TableHead className="w-[6%]">Age</TableHead>
                      <TableHead className="w-[15%]">Contact</TableHead>
                      <TableHead className="w-[25%]">Reason</TableHead>
                      <TableHead className="w-[12%]">Status</TableHead>
                      <TableHead className="w-[14%] text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.map((visit) => (
                      <TableRow key={visit.id} className="group">
                        <TableCell className="overflow-visible whitespace-normal">
                          <div className="font-semibold text-primary leading-tight">
                            {visit.token_label.replace(/^T-/, "")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatMrn(visit.patient_mrn)}
                          </div>
                        </TableCell>
                        <TableCell
                          className={
                            visit.status === "cancelled"
                              ? "text-muted-foreground line-through"
                              : "font-medium"
                          }
                        >
                          {visit.patient_name}
                        </TableCell>
                        <TableCell>{visit.patient_age ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {visit.patient_contact || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {visit.reason_for_visit || "-"}
                        </TableCell>
                        <TableCell className="overflow-visible">
                          {userRole === "doctor" && label === "Today" ? (
                            <DropdownMenu
                              open={statusDropdownOpen === visit.id}
                              onOpenChange={(open) =>
                                !updatingAction && setStatusDropdownOpen(open ? visit.id : null)
                              }
                            >
                              <DropdownMenuTrigger asChild>
                                <button className="inline-flex items-center gap-1.5 focus:outline-none group">
                                  <span className={`size-2 rounded-full ${STATUS_CONFIG[visit.status]?.dot}`} />
                                  <span className="text-sm font-medium capitalize">{visit.status}</span>
                                  <ChevronDownIcon className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start" className="w-44">
                                <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal">
                                  Change status
                                </DropdownMenuLabel>
                                {(["waiting", "called", "checked"] as VisitStatus[])
                                  .filter((s) => s !== visit.status)
                                  .map((s) => {
                                    const cfg = STATUS_CONFIG[s]!
                                    const Icon = cfg.icon
                                    const isLoading =
                                      updatingAction?.visitId === visit.id &&
                                      updatingAction.status === s
                                    return (
                                      <DropdownMenuItem
                                        key={s}
                                        disabled={updatingAction !== null}
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          requestStatusChange(visit.id, s)
                                        }}
                                        className="gap-2"
                                      >
                                        {isLoading ? (
                                          <Loader2Icon className="size-4 animate-spin" />
                                        ) : (
                                          <Icon className="size-4" />
                                        )}
                                        {cfg.label}
                                      </DropdownMenuItem>
                                    )
                                  })}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  disabled={updatingAction !== null || visit.status === "cancelled"}
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    setStatusDropdownOpen(null)
                                    requestStatusChange(visit.id, "cancelled")
                                  }}
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  {updatingAction?.visitId === visit.id &&
                                  updatingAction.status === "cancelled" ? (
                                    <Loader2Icon className="size-4 animate-spin" />
                                  ) : (
                                    <BanIcon className="size-4" />
                                  )}
                                  Cancel Visit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`size-2 rounded-full ${STATUS_CONFIG[visit.status]?.dot ?? "bg-muted-foreground"}`} />
                              <span className="text-sm capitalize">{visit.status}</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="overflow-visible">
                          <div className="flex gap-1 items-center justify-end">
                            {userRole === "doctor" ? (
                              visit.status === "cancelled" ? null : label ===
                                "Today" ? (
                                <Button
                                  variant="default"
                                  size="icon-sm"
                                  onClick={() => onPatientSelect?.(visit)}
                                  title={
                                    visit.status === "checked"
                                      ? "Edit prescription"
                                      : "Open prescription"
                                  }
                                >
                                  {visit.status === "checked" ? (
                                    <PencilIcon />
                                  ) : (
                                    <PlusIcon />
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="icon-sm"
                                  onClick={() => onPatientSelect?.(visit)}
                                  title="View history"
                                >
                                  <ClockIcon />
                                </Button>
                              )
                            ) : label === "Today" && visit.status !== "checked" ? (
                              <>
                                <Button
                                  variant="secondary"
                                  size="icon-sm"
                                  onClick={() =>
                                    requestStatusChange(visit.id, "called")
                                  }
                                  disabled={
                                    updatingAction?.visitId === visit.id
                                  }
                                  title="Call patient"
                                >
                                  {updatingAction?.visitId === visit.id &&
                                  updatingAction.status === "called" ? (
                                    <Loader2Icon className="animate-spin" />
                                  ) : (
                                    <Volume2Icon />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    requestStatusChange(visit.id, "cancelled")
                                  }
                                  disabled={
                                    updatingAction?.visitId === visit.id
                                  }
                                  title="Cancel appointment"
                                >
                                  <XIcon />
                                </Button>
                              </>
                            ) : null}
                            {label !== "Today" && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleReAdd(visit)}
                                title="Re-register this patient"
                                className="opacity-0 group-hover:opacity-100"
                              >
                                <RotateCcwIcon />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )
        )
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No patients yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {loadMoreError && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load more patients.</span>
            <Button variant="link" size="sm" onClick={loadMore}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
