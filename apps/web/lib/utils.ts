export { cn } from "@workspace/ui/lib/utils"

/** Format a numeric MRN as a zero-padded display string, e.g. 42 → "MR-0042". */
export function formatMrn(mrn: number): string {
  return `MR-${String(mrn).padStart(4, '0')}`
}

/**
 * Normalize and validate a Pakistan phone number.
 *
 * Valid formats accepted:
 *  - 03xx-xxxxxxx  (local 11 digits, starts with 03)
 *  - 923xxxxxxxxx  (international 12 digits, starts with 92)
 *  - With or without dashes/spaces (stripped before validation)
 *
 * Returns the normalized number (digits only) on success, or null if invalid.
 * The returned string is always 11 or 12 digits with no separators.
 */
export function normalizePhoneNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')

  if (digits.length !== 11 && digits.length !== 12) return null

  if (digits.length === 11 && digits.startsWith('03')) return digits

  if (digits.length === 12 && digits.startsWith('92') && digits[2] === '3') return digits

  return null
}
