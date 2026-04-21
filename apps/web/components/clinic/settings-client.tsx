"use client"

import { useState, useTransition, useRef, useEffect } from "react"
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
import { TemplatePreview } from "@/components/clinic/prescription-template-preview"
import { BuyButton, PremiumBadge } from "@/components/buy/buy-button"

const TEMPLATE_OPTIONS = [
  { id: "classic",  name: "Classic",  description: "Traditional letterhead with formal two-column layout — the original design." },
  { id: "modern",   name: "Modern",   description: "Clean sans-serif layout with blue accent band and generous whitespace." },
  { id: "minimal",  name: "Minimal",  description: "Black and white with maximum whitespace and understated typography." },
  { id: "clinical", name: "Clinical", description: "Structured sections with tabular medication list and clear grid layout." },
  { id: "elegant",  name: "Elegant",  description: "Premium feel with refined typography, subtle accents, and decorative borders." },
  { id: "compact",  name: "Compact",  description: "Denser layout with smaller fonts and tighter spacing - fits more per page." },
] as const

const PREMIUM_TEMPLATE_IDS = new Set<string>(["elegant", "compact"])
const isPremiumTemplate = (id: string) => PREMIUM_TEMPLATE_IDS.has(id)

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
  role,
  initialTemplateId = "classic",
}: Props) {
  const [fullName, setFullName] = useState(initialFullName)
  const [specialization, setSpecialization] = useState(initialSpecialization)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profilePending, startProfileT] = useTransition()

  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplateId)
  const [previewId, setPreviewId] = useState(initialTemplateId)
  const [templateSaved, setTemplateSaved] = useState(false)
  const [templateError, setTemplateError] = useState("")
  const [templatePending, startTemplateT] = useTransition()

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

  const handleTemplateClick = (templateId: string) => {
    if (previewId === templateId) return
    setPreviewId(templateId)
  }

  const handleSelectTemplate = (templateId: string) => {
    if (templateId === selectedTemplate) return
    const prev = selectedTemplate
    setSelectedTemplate(templateId)
    setTemplateError("")
    setTemplateSaved(false)
    startTemplateT(async () => {
      const r = await updatePrescriptionTemplate(templateId)
      if ("error" in r) {
        setSelectedTemplate(prev)
        setTemplateError(r.error)
        return
      }
      setTemplateSaved(true)
      templateTimer.current = setTimeout(() => setTemplateSaved(false), 3000)
    })
  }

  const handleProfileSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileError("")
    setProfileSaved(false)
    startProfileT(async () => {
      const r1 = await updateProfileName(fullName)
      if ("error" in r1) { setProfileError(r1.error); return }
      if (role === "doctor") {
        const r2 = await updateSpecialization(specialization)
        if ("error" in r2) { setProfileError(r2.error); return }
      }
      setProfileSaved(true)
      profileTimer.current = setTimeout(() => setProfileSaved(false), 3000)
    })
  }

  const handlePasswordSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPwError("")
    setPwSaved(false)
    startPwT(async () => {
      const r = await updateProfilePassword(currentPw, newPw)
      if ("error" in r) { setPwError(r.error); return }
      setPwSaved(true)
      setCurrentPw("")
      setNewPw("")
      pwTimer.current = setTimeout(() => setPwSaved(false), 3000)
    })
  }

  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const previewTemplateName = TEMPLATE_OPTIONS.find(t => t.id === previewId)?.name

  return (
    <div className="flex gap-6">
      {/* Left column */}
      <div className="flex flex-col gap-6 max-w-2xl w-full shrink-0">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              {role === "doctor" && (
                <div className="space-y-2">
                  <Label>
                    Specialization{" "}
                    <span className="text-xs font-normal text-muted-foreground">shown in topbar subtitle</span>
                  </Label>
                  <Input
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    placeholder="e.g. MBBS, FCPS — General Physician"
                  />
                </div>
              )}
              {profileError && <Alert variant="destructive"><AlertCircleIcon className="size-4" /><AlertDescription>{profileError}</AlertDescription></Alert>}
              {profileSaved && <Alert><CheckCircleIcon className="size-4" /><AlertDescription>Profile saved</AlertDescription></Alert>}
              <Button type="submit" disabled={profilePending}>
                {profilePending && <Loader2Icon className="animate-spin" />}
                {profilePending ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {role === "doctor" && (
          <Card>
            <CardHeader><CardTitle>Prescription Template</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Click a template to preview it. Use the &quot;Select Template&quot; button to apply it.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATE_OPTIONS.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.id
                  const isPreviewing = previewId === tpl.id
                  const isPremium = isPremiumTemplate(tpl.id)
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      disabled={templatePending}
                      onClick={() => handleTemplateClick(tpl.id)}
                      className={`relative text-left rounded-lg border-2 p-4 transition-colors disabled:opacity-60 ${
                        isSelected
                          ? "border-primary/40 bg-primary/5 opacity-60"
                          : isPreviewing
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-primary/10 z-10">
                          <CheckCircleIcon className="size-6 text-primary" />
                        </span>
                      )}
                      {isPremium && !isSelected && (
                        <span className="absolute top-2 right-2 z-10">
                          <PremiumBadge />
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <FileTextIcon className="size-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-semibold">{tpl.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                    </button>
                  )
                })}
              </div>
              <div className="xl:hidden flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowPreviewDialog(true)}
                >
                  <EyeIcon className="size-3.5" />
                  Preview {previewTemplateName}
                </Button>
                {!isPremiumTemplate(previewId) && previewId !== selectedTemplate && (
                  <Button size="sm" disabled={templatePending} onClick={() => handleSelectTemplate(previewId)}>
                    {templatePending && <Loader2Icon className="animate-spin" />}
                    {templatePending ? "Saving..." : "Select Template"}
                  </Button>
                )}
              </div>
              {templateError && <Alert variant="destructive"><AlertCircleIcon className="size-4" /><AlertDescription>{templateError}</AlertDescription></Alert>}
              {templateSaved && <Alert><CheckCircleIcon className="size-4" /><AlertDescription>Template updated</AlertDescription></Alert>}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Current password</Label>
                <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>New password</Label>
                <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} placeholder="min. 8 characters" />
              </div>
              {pwError && <Alert variant="destructive"><AlertCircleIcon className="size-4" /><AlertDescription>{pwError}</AlertDescription></Alert>}
              {pwSaved && <Alert><CheckCircleIcon className="size-4" /><AlertDescription>Password updated</AlertDescription></Alert>}
              <Button type="submit" disabled={pwPending}>
                {pwPending && <Loader2Icon className="animate-spin" />}
                {pwPending ? "Saving..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right column — live HTML preview (sticky) */}
      {role === "doctor" && (
        <div className="hidden xl:block flex-1 min-w-0">
          <div className="sticky top-0">
            <Card className="h-[calc(100vh-64px-16px)] flex flex-col">
              <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base">
                  {previewTemplateName}
                </CardTitle>
                {isPremiumTemplate(previewId) ? (
                  <BuyButton
                    size="sm"
                    itemId={previewId}
                    itemName={previewTemplateName ?? previewId}
                  />
                ) : previewId !== selectedTemplate ? (
                  <Button size="sm" disabled={templatePending} onClick={() => handleSelectTemplate(previewId)}>
                    {templatePending && <Loader2Icon className="animate-spin" />}
                    {templatePending ? "Saving..." : "Select Template"}
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                    <CheckCircleIcon className="size-4" />
                    Selected
                  </span>
                )}
              </CardHeader>
              <CardContent className="flex-1 min-h-0 p-4 overflow-y-auto bg-muted/40 rounded-b-lg">
                <div className="max-w-[620px] mx-auto shadow-md">
                  <TemplatePreview templateId={previewId} doctorName={fullName} specialization={specialization} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {role === "doctor" && (
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewTemplateName} Preview</DialogTitle>
            </DialogHeader>
            <div className="max-w-[620px] mx-auto shadow-md">
              <TemplatePreview templateId={previewId} doctorName={fullName} specialization={specialization} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {isPremiumTemplate(previewId) ? (
                <BuyButton size="sm" itemId={previewId} itemName={previewTemplateName ?? previewId} />
              ) : previewId !== selectedTemplate ? (
                <Button size="sm" disabled={templatePending} onClick={() => { handleSelectTemplate(previewId); setShowPreviewDialog(false) }}>
                  {templatePending && <Loader2Icon className="animate-spin" />}
                  {templatePending ? "Saving..." : "Select Template"}
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                  <CheckCircleIcon className="size-4" />
                  Selected
                </span>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
