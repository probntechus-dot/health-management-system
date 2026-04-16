import { FREQ_INSTRUCTIONS, getDosageUrdu } from '@/lib/constants'
import type { MedicineRow } from './index'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function formatDate(iso: string | Date) {
  if (!iso) return ''
  const str = iso instanceof Date ? iso.toISOString().slice(0, 10) : String(iso)
  const [y, m, d] = str.split('-')
  return `${MONTHS[parseInt(m!, 10) - 1]!} ${parseInt(d!, 10)}, ${y}`
}

export function today() {
  return formatDate(new Date().toISOString().slice(0, 10))
}

export function fmtDr(name?: string) {
  if (!name) return ''
  return name.startsWith('Dr.') ? name : `Dr. ${name}`
}

export function filledMeds(medicines: MedicineRow[]) {
  return medicines.filter(m => m.name.trim())
}

export function buildUrduLine(row: MedicineRow): string {
  const freqUrdu = row.frequency ? FREQ_INSTRUCTIONS[row.frequency] : ''
  const durationDays = row.duration?.trim()
  const dosageUrdu = row.dosage ? getDosageUrdu(row.dosage_form ?? 'tablet', row.dosage) : ''
  const freqDurationUrdu = freqUrdu && durationDays
    ? `${freqUrdu} ، ${durationDays} دن تک`
    : freqUrdu || (durationDays ? `${durationDays} دن تک` : '')
  return dosageUrdu && freqDurationUrdu
    ? `${dosageUrdu} ${freqDurationUrdu}`
    : dosageUrdu || freqDurationUrdu
}

export function medDisplayName(row: MedicineRow) {
  return row.display_name || row.name
}

export function medDetailLine(row: MedicineRow, separator = '  \u00B7  ') {
  return [
    row.dosage && `Dose: ${row.dosage}`,
    row.frequency,
    row.duration && `${row.duration} days`,
  ].filter(Boolean).join(separator)
}

export const FOLLOW_UP_URDU = '\u06A9\u0648 \u062F\u0648\u0628\u0627\u0631\u06C1 \u062A\u0634\u0631\u06CC\u0641 \u0644\u0627\u0626\u06CC\u06BA'

export const DISCLAIMER = 'This is a computer-generated prescription'
