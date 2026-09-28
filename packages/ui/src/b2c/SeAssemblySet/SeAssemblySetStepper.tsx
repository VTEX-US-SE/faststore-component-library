import styles from './SeAssemblySet.module.scss'

export interface SeAssemblySetStepperProps {
  value: number
  decreaseLabel: string
  increaseLabel: string
  canDecrease?: boolean
  canIncrease?: boolean
  announce?: boolean
  onDecrease: () => void
  onIncrease: () => void
}

/**
 * Minus / value / plus control, shared by the item cards and the summary's set quantity.
 * The two sides are separate callbacks rather than one `onChange(next)`: each caller
 * clamps differently (an item against its group's remaining capacity, the set count
 * against a floor of 1).
 */
export function SeAssemblySetStepper({
  value,
  decreaseLabel,
  increaseLabel,
  canDecrease = true,
  canIncrease = true,
  announce,
  onDecrease,
  onIncrease,
}: SeAssemblySetStepperProps) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        className={styles.stepper__button}
        onClick={onDecrease}
        disabled={!canDecrease}
        aria-label={decreaseLabel}
      >
        &minus;
      </button>

      <span className={styles.stepper__value} aria-live={announce ? 'polite' : undefined}>
        {value}
      </span>

      <button
        type="button"
        className={styles.stepper__button}
        onClick={onIncrease}
        disabled={!canIncrease}
        aria-label={increaseLabel}
      >
        +
      </button>
    </div>
  )
}
