import { checkAdminAuth } from "@/actions/admin"
import { redirect } from "next/navigation"
import { AdminPanel } from "@/components/clinic/admin-panel"

export default async function AdminPage() {
  const isAdmin = await checkAdminAuth()

  if (!isAdmin) {
    return <AdminLoginGate />
  }

  return <AdminPanel />
}

function AdminLoginGate() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <AdminLoginForm />
    </div>
  )
}

import { AdminLoginForm } from "@/components/clinic/admin-login-form"
