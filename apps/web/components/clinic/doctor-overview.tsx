"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  CalendarIcon,
  UsersIcon,
  UserCheckIcon,
  XCircleIcon,
  ClockIcon,
  StethoscopeIcon,
  FileTextIcon,
  PlusIcon,
  PhoneIcon,
  CalendarCheckIcon,
  PillIcon,
} from "lucide-react"
import type { DashboardStats } from "@/lib/data/dashboard"

interface DoctorOverviewProps {
  doctorName: string
  stats: DashboardStats
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string
  value: number
  icon: React.ReactNode
  description?: string
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type VisitFilter = "all" | "checked" | "waiting" | "cancelled"

const filterConfig: { key: VisitFilter; label: string; color: string }[] = [
  { key: "all", label: "All", color: "bg-primary" },
  { key: "checked", label: "Checked", color: "bg-emerald-500" },
  { key: "waiting", label: "Waiting", color: "bg-amber-500" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-500" },
]

export function DoctorOverview({ doctorName, stats }: DoctorOverviewProps) {
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("all")
  const barColor = filterConfig.find((f) => f.key === visitFilter)!.color
  const maxVisits = Math.max(...stats.weeklyVisits.map((d) => d[visitFilter]), 1)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, Dr. {doctorName.split(" ").slice(-1)[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your clinic today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Appointments"
          value={stats.todayAppointments}
          icon={<CalendarIcon className="size-5" />}
          description="Today"
        />
        <StatCard
          title="Waiting"
          value={stats.todayWaiting}
          icon={<UsersIcon className="size-5" />}
          description="In queue"
        />
        <StatCard
          title="Checked"
          value={stats.todayChecked}
          icon={<UserCheckIcon className="size-5" />}
          description="Completed"
        />
        <StatCard
          title="Cancelled"
          value={stats.todayCancelled}
          icon={<XCircleIcon className="size-5" />}
          description="Today"
        />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Left Column — 3/5 */}
        <div className="lg:col-span-3">
          {/* Weekly Visits Chart */}
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Weekly Visits</CardTitle>
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                  {filterConfig.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setVisitFilter(f.key)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        visitFilter === f.key
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex items-end justify-between gap-3 flex-1 min-h-32">
                {stats.weeklyVisits.map((d) => {
                  const value = d[visitFilter]
                  const pct = maxVisits > 0 ? (value / maxVisits) * 100 : 0
                  return (
                    <div
                      key={d.day}
                      className="flex-1 flex flex-col items-center h-full"
                    >
                      <div className="w-full flex-1 flex flex-col items-center justify-end gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {value}
                        </span>
                        <div
                          className={`w-full ${barColor} rounded-md transition-all duration-300`}
                          style={{ height: value === 0 ? "2px" : `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {d.day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column — 2/5: Quick Actions */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full h-auto py-4 justify-start gap-3" asChild>
                <Link href="/doctor/consultation">
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <PlusIcon className="size-4" />
                  </div>
                  <span className="text-sm font-medium">Add Patient to Queue</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-auto py-4 justify-start gap-3" asChild>
                <Link href="/doctor/patients">
                  <div className="size-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <PillIcon className="size-4" />
                  </div>
                  <span className="text-sm font-medium">View Patient Records</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full h-auto py-4 justify-start gap-3" asChild>
                <Link href="/settings">
                  <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <FileTextIcon className="size-4" />
                  </div>
                  <span className="text-sm font-medium">Clinic Settings</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Follow-ups Due Today */}
      {stats.todayFollowUps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarCheckIcon className="size-5 text-primary" />
              <CardTitle>Follow-ups Due Today</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {stats.todayFollowUps.map((fu) => (
                <div
                  key={fu.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {fu.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {fu.patient_name}
                      </p>
                      {fu.last_diagnosis && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {fu.last_diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <PhoneIcon className="size-3" />
                    <span className="text-xs">{fu.contact}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Patients — Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Patients</CardTitle>
            <Badge variant="outline">{stats.upcomingQueue.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {stats.upcomingQueue.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <StethoscopeIcon className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No patients waiting. Enjoy your break!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.upcomingQueue.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="size-10 rounded-full bg-primary/10 flex shrink-0 items-center justify-center text-sm font-semibold text-primary">
                    {patient.patient_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {patient.patient_name}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <ClockIcon className="size-3 shrink-0" />
                      <span className="truncate">
                        {patient.token_label.replace(/^T-/, "")} &middot;{" "}
                        {patient.reason_for_visit}
                      </span>
                    </p>
                  </div>
                  <Badge
                    variant={
                      patient.status === "called" ? "secondary" : "outline"
                    }
                    className="shrink-0"
                  >
                    {patient.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {stats.upcomingQueue.length > 0 && (
          <div className="px-5 pb-5">
            <Button className="w-full" asChild>
              <Link href="/doctor/consultation">
                <StethoscopeIcon className="size-4" />
                Start Consultation
              </Link>
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
