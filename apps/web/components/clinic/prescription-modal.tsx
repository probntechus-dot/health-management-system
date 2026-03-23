'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import type { Visit, Prescription } from '@/lib/types'
import { getCachedPrescriptions, invalidatePrescriptions, searchCachedDrugs } from '@/lib/cache'
import { createPrescription, updatePrescription } from '@/actions/prescriptions'
import { updateVisitStatus } from '@/actions/patients'
import {
  FREQUENCIES,
  FREQ_INSTRUCTIONS,
  DOSAGE_FORM_LABELS,
  parseDosageForm,
  getDosageUrdu,
  COMMON_TESTS,
  searchTests,
  type DosageForm,
} from '@/lib/constants'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Badge } from '@workspace/ui/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Separator } from '@workspace/ui/components/separator'
import { Alert, AlertDescription } from '@workspace/ui/components/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { Calendar } from '@workspace/ui/components/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover'
import {
  Loader2Icon,
  XIcon,
  PlusIcon,
  Trash2Icon,
  CheckIcon,
  HistoryIcon,
  CalendarIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { PrescriptionDownloadButton } from '@/components/clinic/prescription-pdf'

// ── Types ────────────────────────────────────────────────────────────────────

type DrugSuggestion = {
  id: string
  name: string
  generic_name: string
  dosage_form: string
  strength: string
}

type MedicineRow = {
  id: string
  /** Bare drug name (from medicines table). */
  name: string
  /** Strength string, e.g. "500mg". */
  strength: string
  /** Canonical dosage form key. */
  dosage_form: DosageForm
  /**
   * Computed display name: "{name} {strength} ({Form Label})".
   * This is what gets stored in the prescription and shown everywhere.
   */
  display_name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface PrescriptionModalProps {
  clinicSlug: string
  visit: Visit
  onSave: (prescription: Prescription) => void
  onChecked: () => void
  onClose: () => void
  onShowHistory?: () => void
  editPrescription?: Prescription
  doctorName?: string
  doctorSpecialty?: string
  doctorCredentials?: string
  clinicPhone?: string
  clinicAddress?: string
  clinicWebsite?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safely normalise a value that might be string[] | string | null into string[]. */
function normalizeStringArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string')
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed.filter((v: unknown): v is string => typeof v === 'string') : [] } catch { return [] }
  }
  return []
}

function makeRow(): MedicineRow {
  return {
    id: `temp-${Math.random().toString(36).slice(2)}`,
    name: '',
    strength: '',
    dosage_form: 'other',
    display_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  }
}

/**
 * Build the display_name from the name field and form label.
 * The name field already contains strength when populated from autocomplete
 * (e.g. "Azithromycin 500mg"), so we only append the form label.
 * Returns empty string when name is blank (nothing to preview yet).
 */
function buildDisplayName(name: string, form: DosageForm): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  return form === 'other'
    ? trimmed
    : `${trimmed} (${DOSAGE_FORM_LABELS[form]})`
}

function parseMedicineRow(
  m: {
    name: string
    dosage_form?: string
    display_name?: string
    dosage?: string
    frequency?: string
    duration?: string
    instructions?: string
  },
  index: number,
): MedicineRow {
  const form = parseDosageForm(m.dosage_form)
  const strength = ''  // legacy rows don't carry strength separately; it may be embedded in name

  // For records that already have structured fields populated
  if (m.frequency || m.duration) {
    return {
      id: `saved-${index}`,
      name: m.name,
      strength,
      dosage_form: form,
      display_name: m.display_name || m.name,
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      instructions: m.instructions || '',
    }
  }

  // Legacy: parse packed instructions string
  const parts = (m.instructions || '').split(' · ').map(s => s.trim())
  let dosage = m.dosage || ''
  let frequency = ''
  let duration = ''
  const remaining: string[] = []
  for (const part of parts) {
    if (!dosage && /^\d+\s*mg/i.test(part)) { dosage = part }
    else if (!frequency && (FREQUENCIES as readonly string[]).includes(part)) { frequency = part }
    else if (!duration && /^\d+\s*days?$/i.test(part)) { duration = part.replace(/\s*days?$/i, '') }
    else { remaining.push(part) }
  }
  return {
    id: `saved-${index}`,
    name: m.name,
    strength,
    dosage_form: form,
    display_name: m.display_name || m.name,
    dosage,
    frequency,
    duration,
    instructions: remaining.join(', '),
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateForm(diagnosis: string, medicines: MedicineRow[]): string | null {
  if (!diagnosis.trim()) return 'Diagnosis is required.'

  const filledMeds = medicines.filter(m => m.name.trim())
  if (filledMeds.length === 0) return 'Add at least one medicine with a name.'

  for (const med of filledMeds) {
    if (!med.dosage.trim()) return `Dosage is required for "${med.display_name || med.name}".`
    if (!med.frequency) return `Frequency is required for "${med.display_name || med.name}".`
    if (!med.duration.toString().trim()) return `Duration (days) is required for "${med.display_name || med.name}".`
  }

  return null
}

// ── Drug autocomplete hook ────────────────────────────────────────────────────

function useDrugSearch(clinicSlug: string) {
  const [suggestions, setSuggestions] = useState<DrugSuggestion[]>([])
  const [activeRowId, setActiveRowId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((rowId: string, query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 2) { setSuggestions([]); setActiveRowId(null); return }
    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchCachedDrugs(clinicSlug, query)
        setSuggestions(results as DrugSuggestion[])
        setActiveRowId(rowId)
      } catch {
        setSuggestions([])
        setActiveRowId(null)
      }
    }, 300)
  }, [clinicSlug])

  const clear = useCallback(() => {
    setSuggestions([])
    setActiveRowId(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { suggestions, activeRowId, search, clear }
}

// ── Dosage Form chip selector ─────────────────────────────────────────────────

const ALL_DOSAGE_FORMS: DosageForm[] = [
  'tablet', 'capsule', 'syrup', 'drops', 'injection',
  'cream', 'inhaler', 'suppository', 'patch', 'sachet', 'lozenge', 'gel', 'other',
]

interface DosageFormSelectorProps {
  value: DosageForm
  onChange: (form: DosageForm) => void
}

function DosageFormSelector({ value, onChange }: DosageFormSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {ALL_DOSAGE_FORMS.map(form => (
        <Badge
          key={form}
          variant={value === form ? 'default' : 'outline'}
          className={`cursor-pointer text-xs font-medium transition-all duration-100 ${
            value === form
              ? ''
              : 'bg-transparent text-muted-foreground hover:border-primary hover:text-primary'
          }`}
          onClick={() => onChange(form)}
        >
          {DOSAGE_FORM_LABELS[form]}
        </Badge>
      ))}
    </div>
  )
}

// ── Dosage input (free-text, with Urdu hint for known forms) ──────────────────

interface DosageInputProps {
  form: DosageForm
  value: string
  onChange: (val: string) => void
}

function DosageInput({ form, value, onChange }: DosageInputProps) {
  const urduHint = getDosageUrdu(form, value)

  return (
    <div className="flex flex-col gap-1 w-[110px]">
      <Input
        type="text"
        placeholder="Dose"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm"
      />
      {urduHint && (
        <span className="text-[11px] text-muted-foreground font-medium leading-tight">
          {urduHint}
        </span>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoToDayDiff(iso: string | null | undefined): string {
  if (!iso) return ''
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const selected = new Date(iso); selected.setHours(0, 0, 0, 0)
  const diff = Math.round((selected.getTime() - today.getTime()) / 86400000)
  return diff > 0 ? String(diff) : ''
}

// ── Main component ────────────────────────────────────────────────────────────

export function PrescriptionModal({ clinicSlug, visit, onSave, onChecked, onClose, editPrescription, doctorName, doctorSpecialty, doctorCredentials, clinicPhone, clinicAddress, clinicWebsite }: PrescriptionModalProps) {
  const isEdit = !!editPrescription

  const [diagnosis, setDiagnosis] = useState(editPrescription?.diagnosis || '')
  const [problemList, setProblemList] = useState(editPrescription?.problem_list || '')
  const [medicines, setMedicines] = useState<MedicineRow[]>(() => {
    if (!Array.isArray(editPrescription?.medicines) || !editPrescription.medicines.length) return [makeRow()]
    return editPrescription.medicines.map((m, i) => parseMedicineRow(m, i))
  })
  const [allergies, setAllergies] = useState(editPrescription?.allergies || '')
  const [notes, setNotes] = useState(editPrescription?.notes || '')
  const [selectedTests, setSelectedTests] = useState<string[]>(() =>
    normalizeStringArray(editPrescription?.suggested_tests)
  )
  const [testSearch, setTestSearch] = useState('')
  const [followUpDays, setFollowUpDays] = useState(() => isoToDayDiff(editPrescription?.follow_up))
  const [followUpDate, setFollowUpDate] = useState(editPrescription?.follow_up || '')

  function handleFollowUpDays(val: string) {
    setFollowUpDays(val)
    const d = parseInt(val, 10)
    if (!d || d < 1) { setFollowUpDate(''); return }
    const date = new Date()
    date.setDate(date.getDate() + d)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    setFollowUpDate(`${yyyy}-${mm}-${dd}`)
  }

  function handleFollowUpDate(iso: string) {
    setFollowUpDate(iso)
    setFollowUpDays(isoToDayDiff(iso))
  }

  const [pastRx, setPastRx] = useState<Prescription[]>([])
  const [loadingRx, setLoadingRx] = useState(true)
  const [accordionOpen, setAccordionOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saved, setSaved] = useState(isEdit)
  const [isPending, startTransition] = useTransition()

  const { suggestions, activeRowId, search, clear } = useDrugSearch(clinicSlug)

  useEffect(() => {
    let active = true
    getCachedPrescriptions(clinicSlug, visit.patient_id)
      .then(data => {
        if (active) { setPastRx(data); setLoadingRx(false) }
      })
      .catch(() => {
        if (active) setLoadingRx(false)
      })
    return () => { active = false }
  }, [visit.patient_id, clinicSlug])

  // ── Medicine row helpers ──────────────────────────────────────────────────

  const updateRow = useCallback((id: string, patch: Partial<MedicineRow>) => {
    setMedicines(prev => prev.map(r => {
      if (r.id !== id) return r
      const updated = { ...r, ...patch }

      // Auto-fill instructions when frequency changes
      if ('frequency' in patch && patch.frequency) {
        const wasAuto = Object.values(FREQ_INSTRUCTIONS).includes(r.instructions)
        if (!r.instructions || wasAuto) updated.instructions = FREQ_INSTRUCTIONS[patch.frequency] ?? ''
      }

      // Recompute display_name if any name/strength/form component changed
      if ('name' in patch || 'strength' in patch || 'dosage_form' in patch) {
        updated.display_name = buildDisplayName(updated.name, updated.dosage_form)
      }

      return updated
    }))
  }, [])

  const updateName = useCallback((id: string, value: string) => {
    updateRow(id, { name: value })
    search(id, value)
  }, [updateRow, search])

  const pickSuggestion = useCallback((rowId: string, drug: DrugSuggestion) => {
    const form = parseDosageForm(drug.dosage_form)
    const strength = drug.strength || ''
    // Show "Name Strength" in the text field (e.g. "Azithromycin 500mg")
    const nameWithStrength = [drug.name, strength].filter(Boolean).join(' ')
    // display_name adds the form label: "Azithromycin 500mg (Tablet)"
    const display_name = buildDisplayName(nameWithStrength, form)
    setMedicines(prev => prev.map(r =>
      r.id === rowId
        ? { ...r, name: nameWithStrength, strength, dosage_form: form, display_name }
        : r
    ))
    clear()
  }, [clear])

  const addRow = () => setMedicines(prev => [...prev, makeRow()])
  const removeRow = (id: string) => setMedicines(prev => prev.filter(r => r.id !== id))

  // ── Allergy check ─────────────────────────────────────────────────────────

  const allergyFor = (name: string): string | null => {
    if (!name.trim() || !allergies.trim()) return null
    const lower = name.toLowerCase()
    const allergyList = allergies.split(',').map(a => a.trim().toLowerCase()).filter(Boolean)
    return allergyList.find(a => lower.includes(a) || a.includes(lower)) ?? null
  }

  // ── Reuse past prescription ───────────────────────────────────────────────

  const reuse = (rx: Prescription) => {
    setDiagnosis(rx.diagnosis)
    setProblemList(rx.problem_list || '')
    setNotes(rx.notes || '')
    if (rx.allergies) setAllergies(rx.allergies)
    if (rx.follow_up) setFollowUpDate(rx.follow_up)
    if (Array.isArray(rx.medicines) && rx.medicines.length) {
      setMedicines(rx.medicines.map((m, i) => parseMedicineRow(m, i)))
    }
    setSelectedTests(normalizeStringArray(rx.suggested_tests))
    setMessage({ type: 'success', text: 'Prescription loaded from history.' })
    setTimeout(() => setMessage(null), 2000)
  }

  // ── Test helpers ──────────────────────────────────────────────────────────

  const toggleTest = useCallback((label: string) => {
    setSelectedTests(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    )
  }, [])

  const trimmedTestSearch = testSearch.trim()
  const filteredTests = trimmedTestSearch.length > 0
    ? searchTests(trimmedTestSearch).filter(t => !selectedTests.includes(t.label))
    : []
  const canAddCustomTest =
    trimmedTestSearch.length > 0 &&
    !selectedTests.includes(trimmedTestSearch) &&
    !filteredTests.some(t => t.label.toLowerCase() === trimmedTestSearch.toLowerCase())

  const addCustomTest = useCallback(() => {
    const label = testSearch.trim()
    if (!label || selectedTests.includes(label)) return
    setSelectedTests(prev => [...prev, label])
    setTestSearch('')
  }, [testSearch, selectedTests])

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const validationError = validateForm(diagnosis, medicines)
    if (validationError) { setMessage({ type: 'error', text: validationError }); return }

    const filledMeds = medicines.filter(m => m.name.trim())

    startTransition(async () => {
      setMessage(null)
      const formData = new FormData()
      formData.append('diagnosis', diagnosis.trim())
      formData.append('problemList', problemList.trim())
      formData.append('notes', notes.trim())
      formData.append('allergies', allergies.trim())
      formData.append('followUp', followUpDate)
      formData.append('medicines', JSON.stringify(
        filledMeds.map(m => ({
          name:         m.name.trim(),
          dosage_form:  m.dosage_form,
          display_name: m.display_name || m.name.trim(),
          dosage:       m.dosage.trim(),
          frequency:    m.frequency,
          duration:     m.duration,
          instructions: m.instructions.trim(),
        }))
      ))
      formData.append('suggestedTests', JSON.stringify(selectedTests))

      try {
        const result = isEdit
          ? await updatePrescription(editPrescription!.id, formData)
          : await (() => { formData.append('visitId', visit.id); return createPrescription(formData) })()

        if (result.error) { setMessage({ type: 'error', text: result.error }); return }

        invalidatePrescriptions(clinicSlug, visit.patient_id)
        setSaved(true)
        setMessage({ type: 'success', text: isEdit ? 'Prescription updated.' : 'Prescription saved.' })
        setTimeout(() => setMessage(null), 3000)
        onSave(result.prescription as Prescription)
      } catch {
        setMessage({ type: 'error', text: 'Failed to save prescription. Please try again.' })
      }
    })
  }

  const handleMarkChecked = () => {
    const hasFormData = diagnosis.trim() || medicines.some(m => m.name.trim()) || selectedTests.length > 0
    if (hasFormData && !window.confirm('You have unsaved prescription data. Mark as checked without saving?')) return
    startTransition(async () => {
      setMessage(null)
      const result = await updateVisitStatus(visit.id, 'checked')
      if (result.error) { setMessage({ type: 'error', text: result.error }) }
      else { onChecked() }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Card className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Scrollable prescription body */}
      <div className="flex-1 overflow-y-auto flex flex-col">

        {/* ── Header ── */}
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold leading-tight">{visit.patient_name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {visit.patient_contact || '—'}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground leading-relaxed shrink-0">
              <span>{visit.patient_age} yrs · {visit.patient_gender}</span>
              <br />
              <span>{visit.reason_for_visit || '—'}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onClose()}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">

          {/* 1. Diagnosis */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold">Diagnosis</Label>
            <Input
              type="text"
              placeholder="e.g. Upper Respiratory Infection"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
            />
          </div>

          {/* 2. Problem List */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold">Problem List</Label>
            <Textarea
              placeholder="e.g. 1st visit: swollen joints, morning stiffness. O/E: right ankle swollen."
              rows={3}
              value={problemList}
              onChange={e => setProblemList(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* 3. Medicines */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-semibold">Medicines</Label>

            {medicines.map((row) => {
              const allergy = allergyFor(row.name)
              return (
                <div key={row.id} className="bg-muted/50 rounded-xl p-4 border border-border hover:border-primary/30 transition-colors">

                  {/* Row 1: Name + dosage */}
                  <div className="flex gap-2 items-start mb-2">
                    <div className="relative flex-[2]">
                      <Input
                        type="text"
                        placeholder="Medicine name"
                        value={row.name}
                        onChange={e => updateName(row.id, e.target.value)}
                        onBlur={clear}
                        className={allergy ? 'border-destructive bg-destructive/10' : ''}
                      />
                      {/* Autocomplete dropdown */}
                      {activeRowId === row.id && suggestions.length > 0 && (
                        <ul className="absolute top-full left-0 right-0 z-10 bg-popover border border-border rounded-xl mt-1 overflow-hidden shadow-lg" onMouseDown={e => e.preventDefault()}>
                          {suggestions.map(s => (
                            <li
                              key={s.id}
                              onMouseDown={() => pickSuggestion(row.id, s)}
                              className="px-3.5 py-2.5 text-sm text-popover-foreground hover:bg-accent cursor-pointer transition-colors"
                            >
                              {s.name}
                              {s.strength ? <span className="text-muted-foreground"> {s.strength}</span> : null}
                              {s.dosage_form ? <span className="text-muted-foreground"> ({DOSAGE_FORM_LABELS[parseDosageForm(s.dosage_form)] ?? s.dosage_form})</span> : null}
                            </li>
                          ))}
                        </ul>
                      )}
                      {/* Live display_name preview — updates on every name/form change */}
                      {row.display_name && (
                        <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                          {row.display_name}
                        </p>
                      )}
                    </div>

                    {/* Dose input (free-text; shows Urdu hint for known forms) */}
                    <DosageInput
                      form={row.dosage_form}
                      value={row.dosage}
                      onChange={val => updateRow(row.id, { dosage: val })}
                    />

                    {medicines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Allergy warning */}
                  {allergy && (
                    <div className="flex items-center gap-1.5 mb-2 px-1">
                      <AlertTriangleIcon className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs text-destructive font-medium">Allergy: {allergy}</span>
                    </div>
                  )}

                  {/* Dosage Form chips */}
                  <DosageFormSelector
                    value={row.dosage_form}
                    onChange={form => updateRow(row.id, { dosage_form: form })}
                  />

                  {/* Frequency + Duration */}
                  <div className="flex gap-2 items-center mt-2">
                    <Select
                      value={row.frequency}
                      onValueChange={val => updateRow(row.id, { frequency: val })}
                    >
                      <SelectTrigger className="flex-1 min-w-0">
                        <SelectValue placeholder="Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Days"
                        value={row.duration}
                        onChange={e => updateRow(row.id, { duration: e.target.value })}
                        className="w-[70px]"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <Input
                    type="text"
                    placeholder="Instructions (e.g. after food)"
                    value={row.instructions}
                    onChange={e => updateRow(row.id, { instructions: e.target.value })}
                    className="mt-2"
                  />
                </div>
              )
            })}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit ml-auto text-primary"
              onClick={addRow}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Medicine
            </Button>
          </div>

          {/* 4. Allergies */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold">Allergies</Label>
            <Input
              type="text"
              placeholder="e.g. Penicillin, Sulfa (comma-separated)"
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
            />
          </div>

          {/* 5. Advice / Notes */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold">Advice / Notes for Patient</Label>
            <Textarea
              placeholder="e.g. Drink plenty of water, rest for 2 days"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* 6. Suggested Tests */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Suggested Tests</Label>
              {selectedTests.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedTests.length} selected
                </Badge>
              )}
            </div>

            {/* Common test chips — quick-pick */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TESTS.map(test => {
                const isSelected = selectedTests.includes(test)
                return (
                  <Badge
                    key={test}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer text-xs font-medium transition-all duration-150 ${
                      isSelected
                        ? ''
                        : 'bg-background text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5'
                    }`}
                    onClick={() => toggleTest(test)}
                  >
                    {isSelected ? <XIcon className="h-3 w-3 mr-1" /> : <PlusIcon className="h-3 w-3 mr-1" />}
                    {test}
                  </Badge>
                )
              })}
            </div>

            {/* Search input for full test catalog — Enter adds a custom test */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search tests or type custom test name + Enter"
                value={testSearch}
                onChange={e => setTestSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTest() } }}
              />
              {(filteredTests.length > 0 || canAddCustomTest) && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border border-border rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
                  {filteredTests.slice(0, 12).map(t => (
                    <button
                      key={t.label}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); toggleTest(t.label); setTestSearch('') }}
                      className="w-full text-left px-3.5 py-2.5 text-sm text-popover-foreground hover:bg-accent cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <span>
                        <span className="font-medium">{t.label}</span>
                        {t.aliases.length > 0 && (
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            ({t.aliases.slice(0, 2).join(', ')})
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {t.category}
                      </span>
                    </button>
                  ))}
                  {filteredTests.length > 12 && (
                    <div className="px-3.5 py-2 text-xs text-muted-foreground border-t border-border text-center">
                      +{filteredTests.length - 12} more — type more to narrow
                    </div>
                  )}
                  {canAddCustomTest && (
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); addCustomTest() }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm text-primary font-medium hover:bg-accent cursor-pointer transition-colors flex items-center gap-2 ${filteredTests.length > 0 ? 'border-t border-border' : ''}`}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add &ldquo;{trimmedTestSearch}&rdquo; as custom test
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selected tests — removable tags */}
            {selectedTests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedTests.map(test => (
                  <Badge
                    key={test}
                    variant="secondary"
                    className="text-xs font-medium"
                  >
                    {test}
                    <button
                      type="button"
                      onClick={() => toggleTest(test)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 7. Follow-up */}
          <div className="flex items-center gap-3 flex-wrap">
            <Label className="text-sm font-semibold whitespace-nowrap">Follow-up in</Label>
            <Input
              type="number"
              min="1"
              placeholder="Days"
              value={followUpDays}
              onChange={e => handleFollowUpDays(e.target.value)}
              className="w-[80px]"
            />
            <span className="text-sm text-muted-foreground">days</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={followUpDate ? 'secondary' : 'outline'}
                  size="sm"
                  className="ml-auto text-sm"
                >
                  <CalendarIcon className="h-4 w-4 mr-1.5" />
                  {followUpDate
                    ? new Date(followUpDate + 'T00:00:00').toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 overflow-hidden" align="end" side="top">
                <Calendar
                  mode="single"
                  selected={followUpDate ? new Date(followUpDate + 'T00:00:00') : undefined}
                  onSelect={(date: Date | undefined) => {
                    if (!date) return  // prevent accidental clear by clicking selected date again
                    const yyyy = date.getFullYear()
                    const mm = String(date.getMonth() + 1).padStart(2, '0')
                    const dd = String(date.getDate()).padStart(2, '0')
                    handleFollowUpDate(`${yyyy}-${mm}-${dd}`)
                  }}
                  disabled={{ before: new Date() }}
                  className="[--cell-size:--spacing(6)] p-1.5"
                  classNames={{
                    month: 'flex w-full flex-col gap-2',
                    week: 'mt-0.5 flex w-full',
                    weekday: 'flex-1 rounded-md text-[0.65rem] font-normal text-muted-foreground select-none',
                    caption_label: 'text-xs font-medium select-none',
                    day_button: 'text-[11px]',
                  }}
                />
                {/* Preset buttons — 2 rows */}
                <div className="border-t border-border px-1.5 py-1 flex flex-col gap-0.5">
                  <div className="flex gap-1">
                    {[{ label: 'Tomorrow', days: 1 }, { label: '3 days', days: 3 }, { label: '1 week', days: 7 }].map(preset => (
                      <Button
                        key={preset.days}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] leading-none py-1 px-1 h-auto"
                        onClick={() => handleFollowUpDays(String(preset.days))}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="flex gap-1 flex-1">
                      {[{ label: '2 weeks', days: 14 }, { label: '1 month', days: 30 }].map(preset => (
                        <Button
                          key={preset.days}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 text-[10px] leading-none py-1 px-1 h-auto"
                          onClick={() => handleFollowUpDays(String(preset.days))}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    {followUpDate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[10px] leading-none py-1 px-1.5 h-auto"
                        onClick={() => { setFollowUpDate(''); setFollowUpDays('') }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

        </CardContent>
      </div>

      {/* ── Footer action bar ── */}
      <div className="px-4 pt-4 bg-background border-t border-border">
        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-3">
            {message.type === 'success' && <CheckIcon className="h-4 w-4" />}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 items-center">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending
              ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? 'Updating...' : 'Saving...'}
                </>
              )
              : saved && !message ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-1.5" />
                  {isEdit ? 'Update Prescription' : 'Save Prescription'}
                </>
              )
              : isEdit ? 'Update Prescription' : 'Save Prescription'}
          </Button>
          {!isEdit && !saved && (
            <Button variant="outline" onClick={handleMarkChecked} disabled={isPending}>
              Mark Checked
            </Button>
          )}
          {saved && (
            <PrescriptionDownloadButton
              visit={visit}
              diagnosis={diagnosis}
              problemList={problemList}
              medicines={medicines}
              notes={notes}
              allergies={allergies}
              followUpDate={followUpDate}
              suggestedTests={selectedTests}
              doctorName={doctorName}
              doctorSpecialty={doctorSpecialty}
              doctorCredentials={doctorCredentials}
              clinicPhone={clinicPhone}
              clinicAddress={clinicAddress}
              clinicWebsite={clinicWebsite}
            />
          )}
        </div>

        {/* Past prescriptions accordion */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setAccordionOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors py-1"
          >
            <ChevronRightIcon
              className={`h-4 w-4 transition-transform duration-150 ${accordionOpen ? 'rotate-90' : ''}`}
            />
            <HistoryIcon className="h-4 w-4" />
            Prescription History
            {pastRx.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pastRx.length}
              </Badge>
            )}
          </button>

          {accordionOpen && (
            <div className="mt-3 flex flex-col gap-2 max-h-[260px] overflow-y-auto">
              {loadingRx ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : pastRx.length === 0 ? (
                <span className="text-sm text-muted-foreground py-2">No history found.</span>
              ) : (
                pastRx.map(rx => (
                  <div key={rx.id} className="bg-muted/50 border border-border rounded-xl p-3.5 flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => reuse(rx)}
                      className="flex flex-col gap-1 min-w-0 text-left hover:opacity-75 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{rx.diagnosis}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(rx.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {Array.isArray(rx.medicines) && rx.medicines.length > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {rx.medicines.length} medicine{rx.medicines.length !== 1 ? 's' : ''}
                          {' — '}{rx.medicines.map(m => m.display_name || m.name).join(', ')}
                        </span>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
