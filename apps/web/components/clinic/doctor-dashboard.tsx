"use client"

import { useState, useRef, Component, ErrorInfo, ReactNode } from "react"
import type { Visit, Prescription } from "@/lib/types"
import { visitsCache, getCachedPrescriptions } from "@/lib/cache"
import { PatientQueue } from "@/components/clinic/patient-queue"
import { PrescriptionModal } from "@/components/clinic/prescription-modal"
import { PrescriptionHistory } from "@/components/clinic/prescription-history"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  FileTextIcon,
  AlertCircleIcon,
} from "lucide-react"

// Error Boundary
interface ErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void
}
interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

class PrescriptionErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, errorMessage: "" }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[PrescriptionModal] Render error:",
      error,
      info.componentStack
    )
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardContent className="py-6">
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>
                <div>
                  <p className="font-semibold">Something went wrong</p>
                  <p className="text-sm mt-1">
                    The prescription pad encountered an error. Your data is
                    safe.
                  </p>
                  {this.state.errorMessage && (
                    <p className="text-xs font-mono mt-2 p-2 bg-muted rounded break-all">
                      {this.state.errorMessage}
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={this.handleReset}
                  >
                    Try again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

interface DoctorDashboardProps {
  clinicSlug: string
  doctorName?: string
  doctorSpecialty?: string
  doctorCredentials?: string
  clinicPhone?: string
  clinicAddress?: string
  clinicWebsite?: string
}

export function DoctorDashboard({
  clinicSlug,
  doctorName,
  doctorSpecialty,
  doctorCredentials,
  clinicPhone,
  clinicAddress,
  clinicWebsite,
}: DoctorDashboardProps) {
  const [modalVisit, setModalVisit] = useState<Visit | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [editRx, setEditRx] = useState<Prescription | null>(null)
  const [modalKey, setModalKey] = useState(0)
  const modalVersionRef = useRef(0)
  const savedRxMap = useRef(new Map<string, Prescription>())

  const handleSave = (_rx: Prescription) => {
    if (modalVisit) {
      visitsCache.patchStatus(modalVisit.id, "checked")
      setModalVisit({ ...modalVisit, status: "checked" })
      savedRxMap.current.set(modalVisit.id, _rx)
    }
    setEditRx(_rx)
  }

  const handleChecked = () => {
    if (modalVisit) visitsCache.patchStatus(modalVisit.id, "checked")
    setModalVisit(null)
    setShowHistory(false)
    setEditRx(null)
  }

  const handleSelectPatient = async (visit: Visit) => {
    const version = ++modalVersionRef.current
    setModalKey(version)
    setShowHistory(false)

    let rx: Prescription | null = null
    if (visit.status === "checked" && isToday(visit.created_at)) {
      const memorised = savedRxMap.current.get(visit.id)
      if (memorised) {
        rx = memorised
      } else {
        const prescriptions = await getCachedPrescriptions(
          clinicSlug,
          visit.patient_id
        )
        if (version !== modalVersionRef.current) return
        rx = prescriptions.length > 0 ? prescriptions[0]! : null
        if (rx) savedRxMap.current.set(visit.id, rx)
      }
    }

    setEditRx(rx)
    setModalVisit(visit)
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full min-h-0">
      {/* Left — Patient queue */}
      <div className="overflow-y-auto min-h-0 pb-8">
        <PatientQueue
          clinicSlug={clinicSlug}
          userRole="doctor"
          onPatientSelect={handleSelectPatient}
        />
      </div>

      {/* Right — Prescription area */}
      <div className="min-h-0 flex flex-col overflow-y-auto pb-8">
        {!modalVisit ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="mx-auto mb-4 size-20 rounded-2xl bg-muted flex items-center justify-center">
                  <FileTextIcon className="size-8 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold text-muted-foreground mb-2">
                  Select a Patient
                </p>
                <p className="text-sm text-muted-foreground">
                  Select a patient from the queue to open their prescription
                  pad.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : showHistory || !isToday(modalVisit.created_at) ? (
          <PrescriptionErrorBoundary
            onReset={() => {
              setModalVisit(null)
              setShowHistory(false)
            }}
          >
            <PrescriptionHistory
              key={`history-${modalVisit.id}`}
              clinicSlug={clinicSlug}
              visit={modalVisit}
              onClose={() => {
                if (showHistory && isToday(modalVisit.created_at)) {
                  setShowHistory(false)
                } else {
                  setModalVisit(null)
                  setShowHistory(false)
                }
              }}
            />
          </PrescriptionErrorBoundary>
        ) : (
          <PrescriptionErrorBoundary
            onReset={() => {
              setModalVisit(null)
              setEditRx(null)
            }}
          >
            <PrescriptionModal
              key={`rx-${modalVisit.id}-${modalKey}`}
              clinicSlug={clinicSlug}
              visit={modalVisit}
              onSave={handleSave}
              onChecked={handleChecked}
              onClose={() => {
                setModalVisit(null)
                setEditRx(null)
              }}
              onShowHistory={() => setShowHistory(true)}
              editPrescription={editRx ?? undefined}
              doctorName={doctorName}
              doctorSpecialty={doctorSpecialty}
              doctorCredentials={doctorCredentials}
              clinicPhone={clinicPhone}
              clinicAddress={clinicAddress}
              clinicWebsite={clinicWebsite}
            />
          </PrescriptionErrorBoundary>
        )}
      </div>
    </div>
  )
}
