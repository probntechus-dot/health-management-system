import { requireRole } from "@/actions/auth"
import { ReceptionistClient } from "@/components/clinic/receptionist-client"

export default async function ReceptionistPatientsPage() {
  const session = await requireRole(["receptionist"])

  return <ReceptionistClient clinicSlug={session.clinicSlug} />
}
