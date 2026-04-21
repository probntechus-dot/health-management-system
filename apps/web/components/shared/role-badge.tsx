"use client"

import { Badge } from "@workspace/ui/components/badge"
import { ShieldCheckIcon, StethoscopeIcon, UserIcon } from "lucide-react"

export function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "clinic_admin":
      return <Badge variant="default" className="gap-1"><ShieldCheckIcon className="size-3" />Admin</Badge>
    case "doctor":
      return <Badge variant="secondary" className="gap-1"><StethoscopeIcon className="size-3" />Doctor</Badge>
    case "receptionist":
      return <Badge variant="outline" className="gap-1"><UserIcon className="size-3" />Receptionist</Badge>
    default:
      return <Badge variant="outline">{role}</Badge>
  }
}
