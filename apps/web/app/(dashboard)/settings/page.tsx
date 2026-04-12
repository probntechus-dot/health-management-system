import { getSessionFromHeaders } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/clinic/settings-client"

export default async function SettingsPage() {
  const session = await getSessionFromHeaders()
  if (!session) redirect("/login")

  return (
    <div className="max-w-2xl">
      <SettingsClient
        initialFullName={session.fullName}
        initialSpecialization={session.specialization ?? ""}
        email={session.email}
        role={session.role}
      />
    </div>
  )
}
