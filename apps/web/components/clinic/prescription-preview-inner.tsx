// Dynamically loaded (no SSR) — renders a prescription template to a blob URL for preview.
// Shares font registration with prescription-pdf-inner.tsx.

import { useState, useEffect } from 'react'
import { pdf, Font } from '@react-pdf/renderer'
import { getTemplateById, DEFAULT_TEMPLATE_ID } from './prescription-templates'
import type { PrescriptionTemplateProps } from './prescription-templates'

let fontsRegistered = false
if (!fontsRegistered) {
  Font.register({
    family: 'NotoNaskhArabic',
    src: '/fonts/NotoNaskhArabic-Regular.ttf',
  })
  fontsRegistered = true
}

const SAMPLE_DATA: Omit<PrescriptionTemplateProps, 'urduFontFamily'> = {
  visit: {
    id: 'preview',
    patient_id: 'preview',
    doctor_id: 'preview',
    patient_name: 'Ahmed Khan',
    patient_age: 45,
    patient_contact: '0300-1234567',
    patient_mrn: 142,
    patient_gender: 'Male',
    patient_address: '',
    status: 'checked',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    token_number: 1,
    token_label: 'A-1',
    reason_for_visit: 'Cough and fever',
    priority: 'normal',
  },
  diagnosis: 'Acute bronchitis with mild pharyngitis',
  problemList: 'Persistent cough for 5 days, sore throat, low-grade fever',
  medicines: [
    { id: '1', name: 'Azithromycin 500mg', dosage_form: 'tablet', display_name: 'Azithromycin 500mg (Tablet)', dosage: '1', frequency: 'Once Daily', duration: '3', instructions: '' },
    { id: '2', name: 'Ibuprofen 400mg', dosage_form: 'tablet', display_name: 'Ibuprofen 400mg (Tablet)', dosage: '1', frequency: 'Three Times Daily', duration: '5', instructions: '' },
    { id: '3', name: 'Dextromethorphan 10mg/5ml', dosage_form: 'syrup', display_name: 'Dextromethorphan 10mg/5ml (Syrup)', dosage: '2', frequency: 'Twice Daily', duration: '5', instructions: '' },
  ],
  notes: 'Drink plenty of warm fluids. Avoid cold beverages. Rest for 2-3 days.',
  allergies: 'Penicillin',
  followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  suggestedTests: ['CBC', 'Chest X-Ray'],
  doctorName: 'Dr. Sarah Ahmed',
  doctorSpecialty: 'General Physician',
  doctorCredentials: 'MBBS, FCPS',
  clinicPhone: '042-35761234',
  clinicAddress: '123 Medical Plaza, Lahore',
  clinicWebsite: 'www.clinic.example.com',
}

interface Props {
  templateId: string
  onReady: (url: string) => void
  onError: () => void
}

export default function PrescriptionPreviewInner({ templateId, onReady, onError }: Props) {
  const [generating, setGenerating] = useState(true)

  useEffect(() => {
    let cancelled = false
    setGenerating(true)

    async function generate() {
      try {
        const { Component } = getTemplateById(templateId || DEFAULT_TEMPLATE_ID)
        const blob = await pdf(
          <Component {...SAMPLE_DATA} urduFontFamily="NotoNaskhArabic" />
        ).toBlob()
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        onReady(url)
      } catch {
        if (!cancelled) onError()
      } finally {
        if (!cancelled) setGenerating(false)
      }
    }

    generate()
    return () => { cancelled = true }
  }, [templateId, onReady, onError])

  if (generating) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm gap-2">
        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Generating preview…
      </div>
    )
  }

  return null
}
