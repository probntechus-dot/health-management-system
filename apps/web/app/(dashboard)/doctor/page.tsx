import { requireRole } from "@/actions/auth"
import { fetchDashboardStats } from "@/lib/data/dashboard"
import { DoctorOverview } from "@/components/clinic/doctor-overview"

export default async function DoctorPage() {
  const session = await requireRole(["doctor"])
  const stats = await fetchDashboardStats(session.clinicSlug)

  return (
    <DoctorOverview
      doctorName={session.fullName}
      stats={stats}
    />
  )
}
