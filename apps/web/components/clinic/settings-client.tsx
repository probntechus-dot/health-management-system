"use client"

import { useState, useTransition, useRef, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import {
  updateProfileName,
  updateProfilePassword,
  updateSpecialization,
  updatePrescriptionTemplate,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Loader2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
  FileTextIcon,
  EyeIcon,
} from "lucide-react"

const PrescriptionPreviewInner = dynamic(
  () => import("@/components/clinic/prescription-preview-inner"),
  { ssr: false }
)

// Template metadata — kept in sync with prescription-templates/index.ts
// We duplicate the metadata here to avoid importing @react-pdf/renderer on the client settings page.
const TEMPLATE_OPTIONS = [
  { id: "classic", name: "Classic", description: "Traditional letterhead with formal two-column layout — the original design." },
  { id: "modern", name: "Modern", description: "Clean sans-serif layout with blue accent band and generous whitespace." },
  { id: "minimal", name: "Minimal", description: "Black and white with maximum whitespace and understated typography." },
  { id: "clinical", name: "Clinical", description: "Structured sections with tabular medication list and clear grid layout." },
  { id: "elegant", name: "Elegant", description: "Premium feel with refined typography, subtle accents, and decorative borders." },
  { id: "compact", name: "Compact", description: "Denser layout with smaller fonts and tighter spacing — fits more per page." },
] as const

interface Props {
  initialFullName: string
  initialSpecialization: string
  email: string
  role: "doctor" | "receptionist" | "clinic_admin"
  initialTemplateId?: string
}

export function SettingsClient({
  initialFullName,
  initialSpecialization,
  email,
  role,
  initialTemplateId = "classic",
}: Props) {
  const [fullName, setFullName] = useState(initialFullName)
  const [specialization, setSpecialization] = useState(initialSpecialization)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profilePending, startProfileT] = useTransition()

  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplateId)
  const [templateSaved, setTemplateSaved] = useState(false)
  const [templateError, setTemplateError] = useState("")
  const [templatePending, startTemplateT] = useTransition()

  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)

  const handlePreviewReady = useCallback((url: string) => {
    setPreviewUrl(url)
    setPreviewError(false)
  }, [])

  const handlePreviewError = useCallback(() => {
    setPreviewError(true)
  }, [])

  const closePreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewId(null)
    setPreviewUrl(null)
    setPreviewError(false)
  }, [previewUrl])

  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState("")
  const [pwPending, startPwT] = useTransition()

  const profileTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const pwTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const templateTimer = useRef<ReturnType<typeof setTimeout>>(null)
  useEffect(() => () => {
    if (profileTimer.current) clearTimeout(profileTimer.current)
    if (pwTimer.current) clearTimeout(pwTimer.current)
    if (templateTimer.current) clearTimeout(templateTimer.current)
  }, [])

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
      profileTimer.current = setTimeout(() => setProfileSaved(false), 3000)
    })
  }

  const handleTemplateSelect = (templateId: string) => {
    const prev = selectedTemplate
    setSelectedTemplate(templateId) // optimistic
    setTemplateError("")
    setTemplateSaved(false)
    startTemplateT(async () => {
      const r = await updatePrescriptionTemplate(templateId)
      if ("error" in r) {
        setSelectedTemplate(prev) // rollback
        setTemplateError(r.error)
        return
      }
      setTemplateSaved(true)
      templateTimer.current = setTimeout(() => setTemplateSaved(false), 3000)
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
      pwTimer.current = setTimeout(() => setPwSaved(false), 3000)
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

      {/* Prescription template picker — doctors only */}
      {role === "doctor" && (
        <Card>
          <CardHeader>
            <CardTitle>Prescription Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose the design used when downloading prescriptions.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {TEMPLATE_OPTIONS.map((tpl) => {
                const isActive = selectedTemplate === tpl.id
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    disabled={templatePending}
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`relative text-left rounded-lg border-2 p-4 transition-colors disabled:opacity-60 ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-2 right-2">
                        <CheckCircleIcon className="size-4 text-primary" />
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <FileTextIcon className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold">{tpl.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tpl.description}
                    </p>
                    <span
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewUrl(null)
                        setPreviewError(false)
                        setPreviewId(tpl.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation()
                          setPreviewUrl(null)
                          setPreviewError(false)
                          setPreviewId(tpl.id)
                        }
                      }}
                    >
                      <EyeIcon className="size-3" />
                      Preview
                    </span>
                  </button>
                )
              })}
            </div>

            {templateError && (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{templateError}</AlertDescription>
              </Alert>
            )}

            {templateSaved && (
              <Alert>
                <CheckCircleIcon className="size-4" />
                <AlertDescription>Template updated</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template preview dialog */}
      <Dialog open={!!previewId} onOpenChange={(open) => { if (!open) closePreview() }}>
        <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[92vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
            <DialogTitle>
              Preview — {TEMPLATE_OPTIONS.find(t => t.id === previewId)?.name ?? "Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/40">
            {previewId && !previewUrl && !previewError && (
              <PrescriptionPreviewInner
                templateId={previewId}
                onReady={handlePreviewReady}
                onError={handlePreviewError}
              />
            )}
            {previewError && (
              <div className="text-sm text-destructive">
                Failed to generate preview. Please try again.
              </div>
            )}
            {previewUrl && (
              <embed
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                className="w-full h-full"
                title="Prescription template preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

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
