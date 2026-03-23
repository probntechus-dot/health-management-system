"use client"

import { useState, useEffect } from "react"
import type { Visit, Prescription } from "@/lib/types"
import { getCachedPrescriptions } from "@/lib/cache"
import { PrescriptionDownloadButton } from "@/components/clinic/prescription-pdf"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"
import {
  XIcon,
  CalendarIcon,
  DownloadIcon,
  FileTextIcon,
} from "lucide-react"

interface PrescriptionHistoryProps {
  clinicSlug: string
  visit: Visit
  onClose: () => void
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatMedicineDetails(m: {
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
}): string {
  return [
    m.dosage,
    m.frequency,
    m.duration ? `${m.duration} days` : "",
    m.instructions,
  ]
    .filter(Boolean)
    .join(" · ")
}

function PrescriptionCard({
  visit,
  prescription,
  index,
}: {
  visit: Visit
  prescription: Prescription
  index: number
}) {
  const date = formatDate(prescription.created_at)
  const meds = Array.isArray(prescription.medicines)
    ? prescription.medicines
    : []
  const downloadMedicines = meds.map((m, i) => ({
    id: String(i),
    name: m.name,
    dosage: m.dosage || "",
    frequency: m.frequency || "",
    duration: m.duration || "",
    instructions: m.instructions || "",
  }))

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              {prescription.diagnosis || "Untitled"}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visit #{index} · {meds.length} medicine
              {meds.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="gap-1">
              <CalendarIcon className="size-3" />
              {date}
            </Badge>
            <PrescriptionDownloadButton
              visit={visit}
              diagnosis={prescription.diagnosis}
              problemList={prescription.problem_list || ""}
              medicines={downloadMedicines}
              notes={prescription.notes || ""}
              allergies={prescription.allergies || ""}
              followUpDate={prescription.follow_up || ""}
              suggestedTests={
                Array.isArray(prescription.suggested_tests)
                  ? (prescription.suggested_tests as string[])
                  : undefined
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-md text-xs font-medium hover:bg-accent transition-colors"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Medicines */}
        {meds.length > 0 && (
          <div className="rounded-lg bg-muted p-3">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">
              Medicines
            </span>
            <div className="flex flex-col gap-2">
              {meds.map((m, i) => {
                const details = formatMedicineDetails(m)
                return (
                  <div key={i} className="flex gap-3 items-baseline">
                    <span className="text-xs text-muted-foreground font-medium w-5 shrink-0 text-right tabular-nums">
                      {i + 1}.
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold">
                        {m.name}
                      </span>
                      {details && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {details}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Allergies */}
        {prescription.allergies && (
          <div className="rounded-lg bg-muted p-3">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">
              Allergies
            </span>
            <p className="text-sm font-medium text-destructive">
              {prescription.allergies}
            </p>
          </div>
        )}

        {/* Notes */}
        {prescription.notes && (
          <div className="rounded-lg bg-muted p-3">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">
              Notes
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {prescription.notes}
            </p>
          </div>
        )}

        {/* Suggested Tests */}
        {Array.isArray(prescription.suggested_tests) &&
          prescription.suggested_tests.length > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">
                Suggested Tests
              </span>
              <div className="flex flex-wrap gap-1.5 mt-0.5">
                {(prescription.suggested_tests as string[]).map((test) => (
                  <Badge key={test} variant="secondary">
                    {test}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* Follow-up */}
        {prescription.follow_up && (
          <div className="rounded-lg bg-muted p-3">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 block">
              Follow-up
            </span>
            <div className="flex items-center gap-2">
              <CalendarIcon className="size-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {typeof prescription.follow_up === "string"
                  ? prescription.follow_up.split("-").reverse().join("/")
                  : new Date(prescription.follow_up).toLocaleDateString("en-GB")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function PrescriptionHistory({
  clinicSlug,
  visit,
  onClose,
}: PrescriptionHistoryProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getCachedPrescriptions(clinicSlug, visit.patient_id)
      .then((data) => {
        if (active) {
          setPrescriptions(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [visit.patient_id, clinicSlug])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{visit.patient_name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {visit.patient_contact || "—"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right text-xs text-muted-foreground leading-relaxed">
                <span>
                  {visit.patient_age} yrs · {visit.patient_gender}
                </span>
                <br />
                <span>
                  {loading
                    ? "Loading…"
                    : `${prescriptions.length} prescription${prescriptions.length !== 1 ? "s" : ""}`}
                </span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <XIcon />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ) : prescriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mx-auto mb-3 size-14 rounded-xl bg-muted flex items-center justify-center">
                <FileTextIcon className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                No prescriptions yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                History will appear here after the first visit.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {prescriptions.map((rx, i) => (
            <PrescriptionCard
              key={rx.id}
              visit={visit}
              prescription={rx}
              index={i + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
