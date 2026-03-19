"use client"

import { useState, useEffect, useRef, useTransition, useCallback } from "react"
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

function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "waiting":
      return "outline"
    case "called":
      return "secondary"
    case "checked":
      return "default"
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
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
  const [cancelConfirm, setCancelConfirm] = useState<Visit | null>(null)
  const [cancelPending, setCancelPending] = useState(false)
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

  const handleStatusChange = useCallback(
    (visitId: string, status: "called" | "cancelled") => {
      if (status === "cancelled") {
        const visit = patients.find((v) => v.id === visitId)
        if (visit) setCancelConfirm(visit)
        return
      }
      applyStatusChange(visitId, status)
    },
    [patients, applyStatusChange]
  )

  const confirmCancel = useCallback(() => {
    if (!cancelConfirm) return
    setCancelPending(true)
    fireLatest(
      () => updateVisitStatus(cancelConfirm.id, "cancelled"),
      (result) => {
        if (result.success) {
          visitsCache.patchStatus(cancelConfirm.id, "cancelled")
          setPatients((prev) =>
            prev.map((v) =>
              v.id === cancelConfirm.id
                ? { ...v, status: "cancelled" as VisitStatus }
                : v
            )
          )
        }
        setCancelConfirm(null)
        setCancelPending(false)
      },
      () => setCancelPending(false),
      () => setActionError("Failed to cancel patient. Please try again.")
    )
  }, [cancelConfirm, fireLatest])

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

      {/* Cancel Confirmation */}
      <AlertDialog
        open={!!cancelConfirm}
        onOpenChange={(open) => {
          if (!open && !cancelPending) setCancelConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the appointment for{" "}
              <strong>{cancelConfirm?.patient_name}</strong> (Token{" "}
              {cancelConfirm?.token_label.replace(/^T-/, "")})?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelPending}>
              No, keep
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancelPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelPending && <Loader2Icon className="animate-spin" />}
              {cancelPending ? "Cancelling..." : "Yes, cancel"}
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
                      <TableHead className="w-[80px]">Token</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="w-[60px]">Age</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="text-right w-[100px]">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.map((visit) => (
                      <TableRow key={visit.id} className="group">
                        <TableCell>
                          <span className="font-semibold text-primary">
                            {visit.token_label.replace(/^T-/, "")}
                          </span>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
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
                        <TableCell>
                          {userRole === "doctor" && label === "Today" ? (
                            <DropdownMenu
                              open={statusDropdownOpen === visit.id}
                              onOpenChange={(open) =>
                                !updatingAction && setStatusDropdownOpen(open ? visit.id : null)
                              }
                            >
                              <DropdownMenuTrigger asChild>
                                <button className="focus:outline-none">
                                  <Badge variant={getStatusVariant(visit.status)} className="cursor-pointer hover:opacity-80">
                                    {visit.status}
                                  </Badge>
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {(["waiting", "called", "checked", "cancelled"] as VisitStatus[])
                                  .filter((s) => s !== visit.status)
                                  .map((s) => {
                                    const isLoading =
                                      updatingAction?.visitId === visit.id &&
                                      updatingAction.status === s
                                    return (
                                      <DropdownMenuItem
                                        key={s}
                                        disabled={updatingAction !== null}
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          if (s === "cancelled") {
                                            setStatusDropdownOpen(null)
                                            handleStatusChange(visit.id, "cancelled")
                                          } else {
                                            applyStatusChange(visit.id, s)
                                          }
                                        }}
                                      >
                                        <Badge variant={getStatusVariant(s)} className="gap-1">
                                          {isLoading && (
                                            <Loader2Icon className="size-3 animate-spin" />
                                          )}
                                          {s}
                                        </Badge>
                                      </DropdownMenuItem>
                                    )
                                  })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge variant={getStatusVariant(visit.status)}>
                              {visit.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
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
                            ) : label === "Today" ? (
                              <>
                                <Button
                                  variant="secondary"
                                  size="icon-sm"
                                  onClick={() =>
                                    handleStatusChange(visit.id, "called")
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
                                    handleStatusChange(
                                      visit.id,
                                      "cancelled"
                                    )
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
