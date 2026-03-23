// This file is ONLY loaded via dynamic(..., { ssr: false }) — never imported directly.
// All @react-pdf/renderer imports live here so Turbopack never tries to bundle them for SSR.

import { useState } from 'react'
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import type { Visit } from '@/lib/types'
import { FREQ_INSTRUCTIONS, getDosageUrdu } from '@/lib/constants'
import { formatMrn } from '@/lib/utils'

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
  clinicPhone?: string
  clinicAddress?: string
  clinicWebsite?: string
}

interface PrescriptionDocumentProps extends PrescriptionData {
  urduFontFamily?: 'NotoNaskhArabic'
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: '#000000', backgroundColor: '#ffffff' },

  // ── Header (letterhead) ──────────────────────────────────────────────────
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 24,
  },
  hLeft: { flex: 1, paddingRight: 24 },
  hRight: { width: 180 },

  // Doctor info (left side of header)
  specialtyTitle: { fontSize: 8, color: '#333333', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  drName: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: '#000000', marginBottom: 4 },
  credential: { fontSize: 8.5, color: '#333333', lineHeight: 1.4 },

  // Patient info (right side of header) — label + colon + value
  patientRow: { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
  patientLabel: { fontSize: 11, color: '#333333', width: 40, flexShrink: 0 },
  patientColon: { fontSize: 11, color: '#333333', width: 8, flexShrink: 0 },
  patientValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#000000', flex: 1 },

  // ── Body: two-panel layout ───────────────────────────────────────────────
  body: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
  },

  // Left panel — Diagnosis, Problem List
  leftPanel: {
    width: '35%',
    paddingRight: 20,
  },

  // Right panel — Medicines
  rightPanel: {
    width: '65%',
    paddingLeft: 24,
  },

  // Section headings (bold)
  sectionHeading: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  // Section body text
  sectionText: {
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.5,
    marginBottom: 14,
    marginTop: 4,
  },

  // Medicine list
  medicineRow: { marginBottom: 10 },
  medNumber: { fontSize: 10, color: '#000000', marginBottom: 2 },
  medBody: { flex: 1 },
  medName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#000000', marginBottom: 2 },
  medDetail: { fontSize: 9.5, color: '#333333' },
  urduInstruction: { fontFamily: 'NotoNaskhArabic', fontSize: 9.5, color: '#000000', marginBottom: 2, whiteSpace: 'nowrap' },

  // ── Suggested Tests (inside right panel, after medicines/advice) ─────────
  testsContainer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  testsHeading: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 6,
  },
  testsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  testChip: {
    fontSize: 8.5,
    color: '#1a2332',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#dfe6ed',
  },

  // ── Follow-up (inside right panel, after medicines) ──────────────────────
  followUpRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  followUpLabel: { fontSize: 9, color: '#333333', textTransform: 'uppercase', letterSpacing: 0.3 },
  followUpDate: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#000000' },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    borderTopWidth: 0,
    marginHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#666666' },
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string | Date) {
  if (!iso) return ''
  const str = iso instanceof Date ? iso.toISOString().slice(0, 10) : String(iso)
  const [y, m, d] = str.split('-')
  return `${MONTHS[parseInt(m!, 10) - 1]!} ${parseInt(d!, 10)}, ${y}`
}

function today() {
  return formatDate(new Date().toISOString().slice(0, 10))
}

// ── Document ──────────────────────────────────────────────────────────────────

function PrescriptionDocument({
  visit,
  diagnosis,
  problemList,
  medicines,
  notes,
  allergies,
  followUpDate,
  suggestedTests,
  urduFontFamily = 'NotoNaskhArabic',
  doctorName,
  doctorSpecialty,
  doctorCredentials,
  clinicPhone,
  clinicAddress,
  clinicWebsite,
}: PrescriptionDocumentProps) {
  const filledMeds = medicines.filter(m => m.name.trim())

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Letterhead header ── */}
        <View style={s.letterhead}>

          {/* Left: doctor info */}
          <View style={s.hLeft}>
            <Text style={s.drName}>{doctorName ? `Dr. ${doctorName}` : ''}</Text>
            {doctorCredentials ? <Text style={s.credential}>{doctorCredentials}</Text> : null}
            {doctorSpecialty ? <Text style={s.specialtyTitle}>{doctorSpecialty}</Text> : null}
          </View>

          {/* Right: patient details — label + colon + value, all aligned */}
          <View style={s.hRight}>
            {([
              ['Name', visit.patient_name],
              ['Age',  String(visit.patient_age)],
              ['Phone', visit.patient_contact || '—'],
              ['MrNo',  formatMrn(visit.patient_mrn)],
              ['Date',  today()],
            ] as [string, string][]).map(([label, value]) => (
              <View key={label} style={s.patientRow}>
                <Text style={s.patientLabel}>{label}</Text>
                <Text style={s.patientColon}>:</Text>
                <Text style={s.patientValue}>{value}</Text>
              </View>
            ))}
          </View>

        </View>

        {/* ── Two-panel body ── */}
        <View style={s.body}>

          {/* Left panel: Diagnosis · Problem List · Allergies */}
          <View style={s.leftPanel}>

            {diagnosis.trim() ? (
              <>
                <Text style={s.sectionHeading}>Diagnosis:</Text>
                <Text style={s.sectionText}>{diagnosis.trim()}</Text>
              </>
            ) : null}

            {problemList.trim() ? (
              <>
                <Text style={s.sectionHeading}>Problem List:</Text>
                <Text style={s.sectionText}>{problemList.trim()}</Text>
              </>
            ) : null}

            {allergies.trim() ? (
              <>
                <Text style={s.sectionHeading}>Allergies:</Text>
                <Text style={[s.sectionText, { color: '#b91c1c' }]}>{allergies.trim()}</Text>
              </>
            ) : null}

          </View>

          {/* Right panel: Medicines · Advice */}
          <View style={s.rightPanel}>

            {filledMeds.length > 0 ? (
              <>
                <Text style={s.sectionHeading}>Medicine:</Text>
                {filledMeds.map((row, i) => {
                  const freqUrdu = row.frequency ? FREQ_INSTRUCTIONS[row.frequency] : ''
                  const durationDays = row.duration?.trim()
                  const dosageUrdu = row.dosage ? getDosageUrdu(row.dosage_form ?? 'tablet', row.dosage) : ''
                  const freqDurationUrdu = freqUrdu && durationDays
                    ? `${freqUrdu} ، ${durationDays} دن تک`
                    : freqUrdu || (durationDays ? `${durationDays} دن تک` : '')
                  const urduLine = dosageUrdu && freqDurationUrdu
                    ? `${dosageUrdu} ${freqDurationUrdu}`
                    : dosageUrdu || freqDurationUrdu

                  // display_name for new records; fall back to bare name for legacy records
                  const medicineLine = row.display_name || row.name

                  return (
                    <View key={row.id} style={s.medicineRow}>
                      <Text style={s.medNumber}>({i + 1}) {medicineLine}</Text>
                      {urduLine ? (
                        <Text style={[s.urduInstruction, { fontFamily: urduFontFamily }]}>
                          {urduLine}
                        </Text>
                      ) : null}
                    </View>
                  )
                })}
              </>
            ) : null}

            {notes.trim() ? (
              <>
                <Text style={[s.sectionHeading, { marginTop: filledMeds.length > 0 ? 12 : 0 }]}>Advice:</Text>
                <Text style={s.sectionText}>{notes.trim()}</Text>
              </>
            ) : null}

            {/* Suggested Tests — rendered as chips after medicines/advice */}
            {suggestedTests && suggestedTests.length > 0 ? (
              <View style={s.testsContainer}>
                <Text style={s.testsHeading}>Suggested Tests:</Text>
                <View style={s.testsGrid}>
                  {suggestedTests.map((test, i) => (
                    <Text key={i} style={s.testChip}>{test}</Text>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Follow-up sits right after medicines/advice/tests in the right panel */}
            {followUpDate ? (
              <View style={s.followUpRow}>
                <Text style={[s.followUpLabel, { fontFamily: urduFontFamily }]}>کو دوبارہ تشریف لائیں</Text>
                <Text style={s.followUpDate}>{formatDate(followUpDate)}</Text>
              </View>
            ) : null}

          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>{clinicPhone || ''}</Text>
          <Text style={s.footerText}>{clinicAddress || ''}</Text>
          <Text style={s.footerText}>{clinicWebsite || ''}</Text>
        </View>

      </Page>
    </Document>
  )
}

// ── Exported component (dynamically loaded) ───────────────────────────────────

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export default function PrescriptionDownloadInner({ disabled = false, className, ...data }: PrescriptionData) {
  const [busy, setBusy] = useState(false)
  const btnClass = className ?? 'ml-auto inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-transparent border border-[#dde6f0] text-[#0b78d1] rounded-[10px] font-semibold text-[14px] hover:-translate-y-px transition-transform disabled:opacity-50 disabled:cursor-not-allowed'

  async function handleDownload() {
    if (busy || disabled) return
    setBusy(true)
    try {
      const blob = await pdf(<PrescriptionDocument {...data} urduFontFamily="NotoNaskhArabic" />).toBlob()
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
