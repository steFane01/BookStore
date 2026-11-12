/**
 * Password policy mirrored in the UI (the backend enforces the same rules).
 * Kept in sync with `backend/src/lib/password.js`.
 */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128
export const PASSWORD_HINT =
  'Minim 8 caractere, o literă mare, o cifră și un caracter special.'

export interface PasswordCheck {
  label: string
  ok: boolean
}

/** The four elementary requirements, with a live status for the checklist UI. */
export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: `minim ${PASSWORD_MIN_LENGTH} caractere`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'o literă mare', ok: /\p{Lu}/u.test(password) },
    { label: 'o cifră', ok: /[0-9]/.test(password) },
    { label: 'un caracter special', ok: /[^\p{L}\p{N}]/u.test(password) },
  ]
}

/** First failing rule, or null when the password is acceptable. */
export function validatePassword(password: string, label = 'Parola'): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `${label} trebuie să aibă cel puțin ${PASSWORD_MIN_LENGTH} caractere.`
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `${label} poate avea cel mult ${PASSWORD_MAX_LENGTH} de caractere.`
  }
  if (!/\p{Lu}/u.test(password)) {
    return `${label} trebuie să conțină cel puțin o literă mare.`
  }
  if (!/[0-9]/.test(password)) {
    return `${label} trebuie să conțină cel puțin o cifră.`
  }
  if (!/[^\p{L}\p{N}]/u.test(password)) {
    return `${label} trebuie să conțină cel puțin un caracter special (ex. ! @ # $).`
  }
  return null
}
