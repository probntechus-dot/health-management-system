import { requireRole } from "@/lib/auth"
import { ClinicAdminClient } from "@/components/clinic/clinic-admin-client"

export default async function ClinicAdminPage() {
  await requireRole(["clinic_admin"])
  return <ClinicAdminClient />
}
