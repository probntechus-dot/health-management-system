import { checkAdminAuth } from "@/actions/admin/auth"
import { redirect } from "next/navigation"
import { AdminLoginForm } from "@/components/admin/admin-login-form"

export default async function AdminLoginPage() {
  const isAdmin = await checkAdminAuth()

  if (isAdmin) {
    redirect("/admin")
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AdminLoginForm />
      </div>
    </div>
  )
}
