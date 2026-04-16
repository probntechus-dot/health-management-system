import type { Visit } from '@/lib/types'

// ── Shared types ─────────────────────────────────────────────────────────────

export type MedicineRow = {
  id: string
  name: string
  dosage_form?: string
  display_name?: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

export interface PrescriptionTemplateProps {
  visit: Visit
  diagnosis: string
  problemList: string
  medicines: MedicineRow[]
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
  urduFontFamily?: string
}

export interface TemplateMetadata {
  id: string
  name: string
  description: string
  thumbnail: string
}

export interface PrescriptionTemplate extends TemplateMetadata {
  Component: React.ComponentType<PrescriptionTemplateProps>
}

// ── Template imports ─────────────────────────────────────────────────────────

import { ClassicTemplate, metadata as classicMeta } from './classic'
import { ModernTemplate, metadata as modernMeta } from './modern'
import { MinimalTemplate, metadata as minimalMeta } from './minimal'
import { ClinicalTemplate, metadata as clinicalMeta } from './clinical'
import { ElegantTemplate, metadata as elegantMeta } from './elegant'
import { CompactTemplate, metadata as compactMeta } from './compact'

// ── Registry ─────────────────────────────────────────────────────────────────

export const DEFAULT_TEMPLATE_ID = 'classic'

export const TEMPLATES: PrescriptionTemplate[] = [
  { ...classicMeta, Component: ClassicTemplate },
  { ...modernMeta, Component: ModernTemplate },
  { ...minimalMeta, Component: MinimalTemplate },
  { ...clinicalMeta, Component: ClinicalTemplate },
  { ...elegantMeta, Component: ElegantTemplate },
  { ...compactMeta, Component: CompactTemplate },
]

export function getTemplateById(id: string): PrescriptionTemplate {
  return TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0]!
}
