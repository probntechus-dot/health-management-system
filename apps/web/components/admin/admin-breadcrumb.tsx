"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin": "Overview",
  "/admin/clinics": "Clinics",
  "/admin/sql": "SQL Console",
  "/admin/deploy": "Deploy",
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const title = BREADCRUMB_MAP[pathname] ?? "Admin"

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
