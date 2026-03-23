import { requireRole } from "@/lib/auth"
import { getClinicInfo, getDoctorProfile } from "@/lib/data/clinic"
import { DoctorDashboard } from "@/components/clinic/doctor-dashboard"

export default async function ConsultationPage() {
  const session = await requireRole(["doctor"])
  const [clinic, doctor] = await Promise.all([
    getClinicInfo(session.clinicSlug),
    getDoctorProfile(session.userId),
  ])

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <DoctorDashboard
        clinicSlug={session.clinicSlug}
        doctorId={session.userId}
        doctorName={session.fullName}
        doctorSpecialty={session.specialization ?? undefined}
        doctorCredentials={doctor.credentials ?? undefined}
        clinicPhone={clinic.phone ?? undefined}
        clinicAddress={clinic.address ?? undefined}
        clinicWebsite={clinic.website ?? undefined}
      />
    </div>
  )
}
