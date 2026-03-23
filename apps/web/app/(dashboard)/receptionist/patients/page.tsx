import { requireRole } from "@/lib/auth"
import { getAllocatedDoctors } from "@/lib/data/clinic"
import { ReceptionistClient } from "@/components/clinic/receptionist-client"

export default async function ReceptionistPatientsPage() {
  const session = await requireRole(["receptionist"])
  const doctors = await getAllocatedDoctors(session.userId, session.role, session.clinicId)

  return (
    <ReceptionistClient
      clinicSlug={session.clinicSlug}
      allocatedDoctors={doctors}
    />
  )
}
