import { requireAuth } from "@/lib/auth"
import { SettingsClient } from "@/components/clinic/settings-client"

export default async function SettingsPage() {
  const session = await requireAuth()

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
