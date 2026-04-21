// Only loaded via dynamic(..., { ssr: false }) — never imported directly.

import { pdf, Font } from "@react-pdf/renderer"
import type { Visit } from "@/lib/types"
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "./prescription-templates"
import type { PrescriptionTemplateProps } from "./prescription-templates"
import { PrintButton } from "@/components/print/print-button"
import type { PrintButtonProps } from "@/components/print/print-button"

let fontsRegistered = false
if (!fontsRegistered) {
  Font.register({ family: "NotoNaskhArabic", src: "/fonts/NotoNaskhArabic-Regular.ttf" })
  fontsRegistered = true
}

interface Props {
  visit: Visit
  diagnosis: string
  problemList: string
  medicines: object[]
  notes: string
  allergies: string
  followUpDate: string
  suggestedTests?: string[]
  doctorName?: string
  doctorSpecialty?: string
  doctorCredentials?: string
  clinicPhone?: string
  clinicAddress?: string
  clinicWebsite?: string
  prescriptionTemplateId?: string
  printRef?: PrintButtonProps["printRef"]
  className?: string
}

export default function PrescriptionPrintInner({
  prescriptionTemplateId,
  printRef,
  className,
  ...data
}: Props) {
  function getBlob() {
    const { Component } = getTemplateById(prescriptionTemplateId ?? DEFAULT_TEMPLATE_ID)
    return pdf(<Component {...(data as PrescriptionTemplateProps)} urduFontFamily="NotoNaskhArabic" />).toBlob()
  }

  return <PrintButton getPdfBlob={getBlob} printRef={printRef} className={className} />
}
