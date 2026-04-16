// This file is ONLY loaded via dynamic(..., { ssr: false }) — never imported directly.
// All @react-pdf/renderer imports live here so Turbopack never tries to bundle them for SSR.

import { useState } from 'react'
import { pdf, Font } from '@react-pdf/renderer'
import type { Visit } from '@/lib/types'
import { getTemplateById, DEFAULT_TEMPLATE_ID } from './prescription-templates'

// Register Arabic font for Urdu text (stable rendering)
let fontsRegistered = false
if (!fontsRegistered) {
  Font.register({
    family: 'NotoNaskhArabic',
    src: '/fonts/NotoNaskhArabic-Regular.ttf'
  })
  fontsRegistered = true
}

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

interface PrescriptionData {
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
  prescriptionTemplateId?: string
  clinicPhone?: string
  clinicAddress?: string
  clinicWebsite?: string
}

// ── Exported component (dynamically loaded) ───────────────────────────────────

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export default function PrescriptionDownloadInner({ disabled = false, className, prescriptionTemplateId, ...data }: PrescriptionData) {
  const [busy, setBusy] = useState(false)
  const btnClass = className ?? 'ml-auto inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-transparent border border-[#dde6f0] text-[#0b78d1] rounded-[10px] font-semibold text-[14px] hover:-translate-y-px transition-transform disabled:opacity-50 disabled:cursor-not-allowed'

  async function handleDownload() {
    if (busy || disabled) return
    setBusy(true)
    try {
      const { Component } = getTemplateById(prescriptionTemplateId ?? DEFAULT_TEMPLATE_ID)
      const blob = await pdf(<Component {...data} urduFontFamily="NotoNaskhArabic" />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prescription-${data.visit.patient_name.replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // PDF generation can fail due to font loading or memory issues — alert rather than silently stalling
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" disabled={disabled || busy} onClick={handleDownload} className={btnClass}>
      <DownloadIcon />
      {busy ? 'Preparing…' : 'Download'}
    </button>
  )
}
