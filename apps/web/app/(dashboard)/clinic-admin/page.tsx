import { getSessionFromHeaders } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ClinicAdminClient } from "@/components/clinic/clinic-admin-client"

export default async function ClinicAdminPage() {
  const session = await getSessionFromHeaders()
  if (!session) redirect("/login")
  return <ClinicAdminClient />
}
