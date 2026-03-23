"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"

const BREADCRUMB_MAP: Record<string, string> = {
  "/doctor": "Dashboard",
  "/doctor/consultation": "Consultation",
  "/receptionist/patients": "Patients",
  "/clinic-admin": "Manage Users",
  "/settings": "Settings",
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const title = BREADCRUMB_MAP[pathname] ?? "Dashboard"

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
