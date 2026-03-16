"use client"

import { PatientQueue } from "@/components/clinic/patient-queue"

export function DoctorPatientsClient({
  clinicSlug,
}: {
  clinicSlug: string
}) {
  return (
    <div className="max-w-5xl">
      <PatientQueue clinicSlug={clinicSlug} userRole="doctor" />
    </div>
  )
}
