/**
 * Password policy shared by every endpoint that sets a password:
 * at least 8 characters, one uppercase letter, one digit and one special
 * character. The same rules are mirrored in the frontend checklist.
 */

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

/**
 * Validate a new password.
 * Returns `{ ok: true }` or `{ ok: false, error }` with a Romanian message.
 * `label` lets callers say „Parola nouă” instead of „Parola”.
 */
export function validatePassword(password, label = 'Parola') {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `${label} trebuie să aibă cel puțin ${PASSWORD_MIN_LENGTH} caractere.`,
    }
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      error: `${label} poate avea cel mult ${PASSWORD_MAX_LENGTH} de caractere.`,
    }
  }
  if (!/\p{Lu}/u.test(password)) {
    return { ok: false, error: `${label} trebuie să conțină cel puțin o literă mare.` }
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: `${label} trebuie să conțină cel puțin o cifră.` }
  }
  if (!/[^\p{L}\p{N}]/u.test(password)) {
    return {
      ok: false,
      error: `${label} trebuie să conțină cel puțin un caracter special (ex. ! @ # $).`,
    }
  }
  return { ok: true }
}
