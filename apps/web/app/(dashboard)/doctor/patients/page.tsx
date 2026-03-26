import { requireRole } from "@/lib/auth"
import { fetchVisits } from "@/lib/data/patients"
import { DoctorPatientsClient } from "@/components/clinic/doctor-patients-client"

export default async function DoctorPatientsPage() {
  const session = await requireRole(["doctor"])
  const initialVisits = await fetchVisits(session.clinicSlug, [session.userId], 0)

  return (
    <DoctorPatientsClient
      clinicSlug={session.clinicSlug}
      initialVisits={initialVisits}
    />
  )
}
