import { cookies } from "next/headers"
import { checkAdminAuth } from "@/actions/admin/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb"
import { Toaster } from "@workspace/ui/components/sonner"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, cookieStore] = await Promise.all([checkAdminAuth(), cookies()])

  if (!isAdmin) {
    redirect("/admin/login")
  }

  const sidebarCookie = cookieStore.get("sidebar_state")
  const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : false

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AdminBreadcrumb />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
