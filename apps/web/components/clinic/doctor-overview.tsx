"use client"

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
  ArrowRightIcon,
  ClockIcon,
  StethoscopeIcon,
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
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DoctorOverview({ doctorName, stats }: DoctorOverviewProps) {
  const maxVisits = Math.max(...stats.weeklyVisits.map((d) => d.count), 1)

  return (
    <div className="space-y-6 max-w-4xl">
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

      {/* Weekly Visits Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly Visits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between gap-2 h-32">
            {stats.weeklyVisits.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {d.count}
                </span>
                <div
                  className="w-full bg-primary/80 rounded-sm min-h-1 transition-all"
                  style={{ height: `${(d.count / maxVisits) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Upcoming Patients</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/doctor/consultation">
                Start Consultation
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
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
            <div className="space-y-3">
              {stats.upcomingQueue.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {patient.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{patient.patient_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        {patient.token_label.replace(/^T-/, "")} &middot;{" "}
                        {patient.reason_for_visit}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={patient.status === "called" ? "secondary" : "outline"}
                  >
                    {patient.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
