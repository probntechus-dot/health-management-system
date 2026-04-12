import { getSessionFromHeaders } from "@/lib/auth"
import { redirect } from "next/navigation"
import { fetchDashboardStats } from "@/lib/data/dashboard"
import { DoctorOverview } from "@/components/clinic/doctor-overview"

export default async function DoctorPage() {
  const session = await getSessionFromHeaders()
  if (!session) redirect("/login")
  const stats = await fetchDashboardStats(session.clinicSlug, [session.userId])

  return (
    <DoctorOverview
      doctorName={session.fullName}
      stats={stats}
    />
  )
}
