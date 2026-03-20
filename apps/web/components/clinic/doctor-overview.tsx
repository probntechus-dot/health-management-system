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

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function DoctorOverview({ doctorName, stats }: DoctorOverviewProps) {
  const maxVisits = Math.max(...stats.weeklyVisits.map((d) => d.count), 1)

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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column — 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          {/* Weekly Visits Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3 h-40">
                {stats.weeklyVisits.map((d) => (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center gap-1.5"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {d.count}
                    </span>
                    <div
                      className="w-full bg-primary rounded-md min-h-1 transition-all duration-300"
                      style={{ height: `${(d.count / maxVisits) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Prescriptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Prescriptions</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/doctor/patients">
                    View All
                    <ArrowRightIcon className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats.recentPrescriptions.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <FileTextIcon className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No prescriptions written today yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.recentPrescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-secondary/10 flex items-center justify-center text-sm font-semibold text-secondary">
                          {rx.patient_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {rx.patient_name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {rx.diagnosis || "No diagnosis"} &middot;{" "}
                            {rx.medicine_count}{" "}
                            {rx.medicine_count === 1 ? "medicine" : "medicines"}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(rx.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
        </div>

        {/* Right Column — 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Queue */}
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
                <div className="divide-y divide-border">
                  {stats.upcomingQueue.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-10 rounded-full bg-primary/10 flex shrink-0 items-center justify-center text-sm font-semibold text-primary">
                          {patient.patient_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {patient.patient_name}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <ClockIcon className="size-3 shrink-0" />
                            <span className="truncate">
                              {patient.token_label.replace(/^T-/, "")} &middot;{" "}
                              {patient.reason_for_visit}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          patient.status === "called" ? "secondary" : "outline"
                        }
                        className="shrink-0 ml-2"
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/doctor/consultation">
                  <PlusIcon className="size-4" />
                  Add Patient to Queue
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/doctor/patients">
                  <PillIcon className="size-4" />
                  View Patient Records
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/settings">
                  <FileTextIcon className="size-4" />
                  Clinic Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
