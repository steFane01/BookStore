import { IconMinus, IconPlus } from './icons'

interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  label?: string
}

/**
 * An elegant stepper for choosing quantities. Keyboard accessible.
 */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  label = 'Cantitate',
}: QuantitySelectorProps) {
  const btn = size === 'sm' ? 'h-8 w-8' : 'h-11 w-11'
  const num = size === 'sm' ? 'w-8 text-sm' : 'w-12 text-base'

  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <div
      className="inline-flex items-center"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Scade cantitatea"
        className={`${btn} flex items-center justify-center rounded-sm border border-ink/20 text-ink transition-colors hover:border-oxblood hover:text-oxblood disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <IconMinus className="h-4 w-4" />
      </button>
      <span
        className={`${num} text-center font-medium tabular-nums`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Crește cantitatea"
        className={`${btn} flex items-center justify-center rounded-sm border border-ink/20 text-ink transition-colors hover:border-oxblood hover:text-oxblood disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <IconPlus className="h-4 w-4" />
      </button>
    </div>
  )
}
