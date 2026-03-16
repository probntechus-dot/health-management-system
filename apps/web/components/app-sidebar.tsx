"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
} from "@workspace/ui/components/avatar"
import {
  StethoscopeIcon,
  UsersIcon,
  SettingsIcon,
  UserPlusIcon,
  LayoutDashboardIcon,
  BuildingIcon,
  DatabaseIcon,
  UploadIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
} from "lucide-react"
import { logout } from "@/actions/auth"

type NavItem = {
  title: string
  url: string
  icon: React.ReactNode
}

const NAV_CONFIG: Record<string, { label: string; items: NavItem[] }> = {
  doctor: {
    label: "Doctor",
    items: [
      { title: "Dashboard", url: "/doctor", icon: <StethoscopeIcon /> },
      { title: "Patient Queue", url: "/doctor/patients", icon: <UsersIcon /> },
      { title: "Settings", url: "/settings", icon: <SettingsIcon /> },
    ],
  },
  receptionist: {
    label: "Receptionist",
    items: [
      { title: "Patients", url: "/receptionist/patients", icon: <UserPlusIcon /> },
      { title: "Settings", url: "/settings", icon: <SettingsIcon /> },
    ],
  },
  admin: {
    label: "Admin",
    items: [
      { title: "Overview", url: "/admin?tab=overview", icon: <LayoutDashboardIcon /> },
      { title: "Clinics", url: "/admin?tab=clinics", icon: <BuildingIcon /> },
      { title: "SQL", url: "/admin?tab=sql", icon: <DatabaseIcon /> },
      { title: "Deploy", url: "/admin?tab=deploy", icon: <UploadIcon /> },
    ],
  },
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    fullName: string
    email: string
    role: string
    specialization?: string | null
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const nav = NAV_CONFIG[user.role] ?? NAV_CONFIG["receptionist"]!


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <StethoscopeIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">Clinic Management</span>
                  <span className="truncate text-xs capitalize">{user.role}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{nav.label}</SidebarGroupLabel>
          <SidebarMenu>
            {nav.items.map((item) => {
              const isActive =
                pathname === item.url ||
                (item.url !== "/" && pathname.startsWith(item.url.split("?")[0]!))

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-medium">{user.fullName}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-start text-sm leading-tight">
                      <span className="truncate font-medium">{user.fullName}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <SettingsIcon />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                  }}
                >
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
