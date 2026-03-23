"use client"

import { useState, useTransition } from "react"
import {
  updateProfileName,
  updateProfilePassword,
  updateSpecialization,
} from "@/actions/profile"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  Avatar,
  AvatarFallback,
} from "@workspace/ui/components/avatar"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  Loader2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react"

interface Props {
  initialFullName: string
  initialSpecialization: string
  email: string
  role: "doctor" | "receptionist" | "clinic_admin"
}

export function SettingsClient({
  initialFullName,
  initialSpecialization,
  email,
  role,
}: Props) {
  const [fullName, setFullName] = useState(initialFullName)
  const [specialization, setSpecialization] = useState(initialSpecialization)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profilePending, startProfileT] = useTransition()

  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState("")
  const [pwPending, startPwT] = useTransition()

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError("")
    setProfileSaved(false)
    startProfileT(async () => {
      const r1 = await updateProfileName(fullName)
      if ("error" in r1) {
        setProfileError(r1.error)
        return
      }

      if (role === "doctor") {
        const r2 = await updateSpecialization(specialization)
        if ("error" in r2) {
          setProfileError(r2.error)
          return
        }
      }

      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    })
  }

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError("")
    setPwSaved(false)
    startPwT(async () => {
      const r = await updateProfilePassword(currentPw, newPw)
      if ("error" in r) {
        setPwError(r.error)
        return
      }
      setPwSaved(true)
      setCurrentPw("")
      setNewPw("")
      setTimeout(() => setPwSaved(false), 3000)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profile card */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <Avatar className="size-12">
            <AvatarFallback className="text-lg font-bold">
              {initialFullName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold">{fullName}</div>
            {role === "doctor" && specialization && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {specialization}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-0.5">
              {email}
            </div>
            <Badge variant="secondary" className="mt-1 capitalize">
              {role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            {role === "doctor" && (
              <div className="space-y-2">
                <Label>
                  Specialization{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    shown in topbar subtitle
                  </span>
                </Label>
                <Input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. MBBS, FCPS — General Physician"
                />
              </div>
            )}

            {profileError && (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}

            {profileSaved && (
              <Alert>
                <CheckCircleIcon className="size-4" />
                <AlertDescription>Profile saved</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={profilePending}>
              {profilePending && <Loader2Icon className="animate-spin" />}
              {profilePending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password form */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                minLength={8}
                placeholder="min. 8 characters"
              />
            </div>

            {pwError && (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{pwError}</AlertDescription>
              </Alert>
            )}

            {pwSaved && (
              <Alert>
                <CheckCircleIcon className="size-4" />
                <AlertDescription>Password updated</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={pwPending}>
              {pwPending && <Loader2Icon className="animate-spin" />}
              {pwPending ? "Saving..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
