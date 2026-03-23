"use client"

import dynamic from "next/dynamic"
import type { Visit } from "@/lib/types"

type MedicineRow = {
  id: string
  name: string
  dosage_form?: string
  display_name?: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export interface PrescriptionDownloadButtonProps {
  visit: Visit
  diagnosis: string
  problemList: string
  medicines: MedicineRow[]
  notes: string
  allergies: string
  followUpDate: string
  suggestedTests?: string[]
  disabled?: boolean
  className?: string
  doctorName?: string
  doctorSpecialty?: string
  doctorCredentials?: string
  clinicPhone?: string
  clinicAddress?: string
  clinicWebsite?: string
}

const PrescriptionDownloadInner = dynamic(
  () => import("@/components/clinic/prescription-pdf-inner"),
  { ssr: false, loading: () => null }
)

export function PrescriptionDownloadButton(
  props: PrescriptionDownloadButtonProps
) {
  return <PrescriptionDownloadInner {...props} />
}
