"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { createVisit } from "@/actions/patients"
import { ContactLookup } from "@/components/clinic/contact-lookup"
import type { PatientMatch } from "@/components/clinic/contact-lookup"
import { Loader2Icon, UserPlusIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react"

interface PatientFormProps {
  clinicSlug: string
  onSuccess?: () => void
  prefill?: {
    full_name: string
    age: number | null
    gender: string
    contact: string
    address: string
  }
}

export function PatientForm({ clinicSlug, onSuccess, prefill }: PatientFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [contact, setContact] = useState(prefill?.contact ?? "")
  const [gender, setGender] = useState(prefill?.gender ?? "")
  const nameRef = useRef<HTMLInputElement>(null)
  const ageRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!prefill) return
    if (nameRef.current) nameRef.current.value = prefill.full_name
    if (ageRef.current) ageRef.current.value = String(prefill.age ?? "")
    setGender(prefill.gender ?? "")
    setContact(prefill.contact)
  }, [prefill])

  const handleSelect = (m: PatientMatch) => {
    if (nameRef.current) nameRef.current.value = m.full_name
    if (ageRef.current) ageRef.current.value = String(m.age ?? "")
    setGender(m.gender ?? "")
    setContact(m.contact_number)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("gender", gender)

    startTransition(async () => {
      setError("")
      setSuccess(false)
      const result = await createVisit(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        setContact("")
        setGender("")
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        onSuccess?.()
      }
    })
  }

  const clearForm = () => {
    formRef.current?.reset()
    setContact("")
    setGender("")
    setError("")
    setSuccess(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlusIcon className="size-5" />
          Register Patient
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact">Contact Number</Label>
            <ContactLookup
              clinicSlug={clinicSlug}
              contact={contact}
              setContact={setContact}
              onSelect={handleSelect}
              skipInitialSearch={!!prefill}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              ref={nameRef}
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Patient's full name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                ref={ageRef}
                id="age"
                name="age"
                type="number"
                min="0"
                required
                placeholder="Years"
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="gender" value={gender} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reasonForVisit">Reason for Visit</Label>
            <Input
              id="reasonForVisit"
              name="reasonForVisit"
              type="text"
              required
              placeholder="e.g. Fever, follow-up, lab results"
            />
          </div>

          <input
            type="hidden"
            name="address"
            value={prefill?.address || "Not provided"}
          />

          {success && (
            <Alert>
              <CheckCircleIcon className="size-4" />
              <AlertDescription>
                Patient registered successfully!
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending && <Loader2Icon className="animate-spin" />}
              {isPending ? "Registering..." : "Register Patient"}
            </Button>
            <Button type="button" variant="outline" onClick={clearForm}>
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
