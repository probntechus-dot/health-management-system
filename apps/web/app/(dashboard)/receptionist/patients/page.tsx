import { getSessionFromHeaders } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAllocatedDoctors } from "@/lib/data/clinic"
import { ReceptionistClient } from "@/components/clinic/receptionist-client"

export default async function ReceptionistPatientsPage() {
  const session = await getSessionFromHeaders()
  if (!session) redirect("/login")
  const doctors = await getAllocatedDoctors(session.userId, session.role, session.clinicId)

  return (
    <ReceptionistClient
      clinicSlug={session.clinicSlug}
      allocatedDoctors={doctors}
    />
  )
}
