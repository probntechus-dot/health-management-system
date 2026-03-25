import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { Toaster } from "@workspace/ui/components/sonner"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { NotificationBell } from "@/components/notification-bell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DashboardBreadcrumb />
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
