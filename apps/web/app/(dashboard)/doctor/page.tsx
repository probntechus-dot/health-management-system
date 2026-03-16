import { requireRole } from "@/actions/auth"
import { DoctorDashboard } from "@/components/clinic/doctor-dashboard"

export default async function DoctorPage() {
  const session = await requireRole(["doctor"])

  return (
    <DoctorDashboard
      clinicSlug={session.clinicSlug}
      doctorName={session.fullName}
      doctorSpecialty={session.specialization ?? undefined}
    />
  )
}
