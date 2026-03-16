import { requireRole } from "@/actions/auth"
import { DoctorPatientsClient } from "@/components/clinic/doctor-patients-client"

export default async function DoctorPatientsPage() {
  const session = await requireRole(["doctor"])

  return <DoctorPatientsClient clinicSlug={session.clinicSlug} />
}
