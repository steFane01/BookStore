import { passwordChecks } from '../utils/password'
import { IconCheck } from './icons'

/**
 * Live password requirements: each rule turns oxblood with a check as soon as
 * the typed password satisfies it.
 */
export function PasswordChecklist({
  password,
  className = '',
}: {
  password: string
  className?: string
}) {
  const checks = passwordChecks(password)
  return (
    <ul
      className={`grid gap-1.5 text-xs sm:grid-cols-2 ${className}`}
      aria-label="Cerințe pentru parolă"
    >
      {checks.map((check) => (
        <li
          key={check.label}
          className={`flex items-center gap-1.5 transition-colors ${
            check.ok ? 'text-oxblood' : 'text-ink-muted'
          }`}
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
              check.ok ? 'border-oxblood bg-oxblood text-paper-50' : 'border-ink/20 text-transparent'
            }`}
            aria-hidden="true"
          >
            <IconCheck className="h-2.5 w-2.5" />
          </span>
          {check.label}
        </li>
      ))}
    </ul>
  )
}
