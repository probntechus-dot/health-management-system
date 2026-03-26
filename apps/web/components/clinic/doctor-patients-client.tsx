"use client"

import { PatientQueue } from "@/components/clinic/patient-queue"
import type { Visit } from "@/lib/types"

export function DoctorPatientsClient({
  clinicSlug,
  initialVisits,
}: {
  clinicSlug: string
  initialVisits?: Visit[]
}) {
  return (
    <div className="max-w-5xl">
      <PatientQueue clinicSlug={clinicSlug} userRole="doctor" initialVisits={initialVisits} />
    </div>
  )
}
