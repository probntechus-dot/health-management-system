/** Shared auth constants and types — safe for both client and server imports. */

export const SESSION_UI_COOKIE = 'clinic_session_ui'

export type Session = {
  userId:         string
  email:          string
  role:           'doctor' | 'receptionist' | 'clinic_admin'
  fullName:       string
  clinicId:       string
  clinicSlug:     string
  specialization: string | null
}

/** UI-safe subset of session data (stored in a non-httpOnly cookie for client reading). */
export type SessionUI = Pick<Session, 'fullName' | 'email' | 'role' | 'specialization'>
