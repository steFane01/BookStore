import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

/**
 * Labelled form field wrapper that keeps labels, hints and validation
 * messaging consistent across all forms.
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="text-oxblood"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-oxblood" role="alert" id={`${htmlFor}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}
