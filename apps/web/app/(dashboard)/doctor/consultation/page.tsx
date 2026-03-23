import { requireRole } from "@/lib/auth"
import { DoctorDashboard } from "@/components/clinic/doctor-dashboard"

export default async function ConsultationPage() {
  const session = await requireRole(["doctor"])

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <DoctorDashboard
        clinicSlug={session.clinicSlug}
        doctorName={session.fullName}
        doctorSpecialty={session.specialization ?? undefined}
      />
    </div>
  )
}
