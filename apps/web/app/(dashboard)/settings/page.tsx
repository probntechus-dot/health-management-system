import { getSessionFromHeaders } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/clinic/settings-client"
import { getDoctorProfile } from "@/lib/data/clinic"

export default async function SettingsPage() {
  const session = await getSessionFromHeaders()
  if (!session) redirect("/login")

  const doctorProfile = session.role === "doctor"
    ? await getDoctorProfile(session.userId)
    : null

  return (
    <div className="max-w-2xl">
      <SettingsClient
        initialFullName={session.fullName}
        initialSpecialization={session.specialization ?? ""}
        email={session.email}
        role={session.role}
        initialTemplateId={doctorProfile?.prescription_template_id ?? "classic"}
      />
    </div>
  )
}
