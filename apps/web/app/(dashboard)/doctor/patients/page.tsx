import { getSessionFromHeaders } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DoctorPatientsClient } from "@/components/clinic/doctor-patients-client"

export default async function DoctorPatientsPage() {
  const session = await getSessionFromHeaders()
  if (!session) redirect("/login")

  return (
    <DoctorPatientsClient
      clinicSlug={session.clinicSlug}
    />
  )
}
