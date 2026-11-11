import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Modal } from '../components/Modal'

type DialogTone = 'primary' | 'danger'

export interface ConfirmOptions {
  title: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
}

export interface AlertOptions {
  title: string
  message?: ReactNode
  closeLabel?: string
  tone?: DialogTone
}

interface DialogContextValue {
  /** Styled replacement for `window.confirm`; resolves to the user's choice. */
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** Styled replacement for `window.alert`; resolves when dismissed. */
  alert: (options: AlertOptions) => Promise<void>
}

type DialogState =
  | { kind: 'confirm'; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: 'alert'; options: AlertOptions; resolve: () => void }

const DialogContext = createContext<DialogContextValue | undefined>(undefined)

/** Provides app-wide styled confirm/alert dialogs. */
export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setDialog({ kind: 'confirm', options, resolve })
      }),
    [],
  )

  const alert = useCallback(
    (options: AlertOptions) =>
      new Promise<void>((resolve) => {
        setDialog({ kind: 'alert', options, resolve })
      }),
    [],
  )

  const close = useCallback(
    (confirmed: boolean) => {
      setDialog((current) => {
        if (!current) return null
        if (current.kind === 'confirm') current.resolve(confirmed)
        else current.resolve()
        return null
      })
    },
    [],
  )

  const value = useMemo<DialogContextValue>(() => ({ confirm, alert }), [confirm, alert])

  return (
    <DialogContext.Provider value={value}>
      {children}

      <Modal
        open={dialog !== null}
        title={dialog?.options.title ?? ''}
        eyebrow={dialog?.kind === 'alert' ? 'Notificare' : 'Confirmare'}
        onClose={() => close(false)}
        maxWidth="max-w-md"
        footer={
          dialog?.kind === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={() => close(false)}
                className="btn btn-outline px-5 py-2.5 text-sm"
              >
                {dialog.options.cancelLabel ?? 'Anulează'}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`btn px-5 py-2.5 text-sm ${
                  dialog.options.tone === 'danger' ? 'btn-primary' : 'btn-brass'
                }`}
              >
                {dialog.options.confirmLabel ?? 'Confirmă'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => close(false)}
              className={`btn px-5 py-2.5 text-sm ${
                dialog?.options.tone === 'danger' ? 'btn-primary' : 'btn-brass'
              }`}
            >
              {(dialog?.kind === 'alert' && dialog.options.closeLabel) || 'Închide'}
            </button>
          )
        }
      >
        {dialog?.options.message && <div className="text-ink-light">{dialog.options.message}</div>}
      </Modal>
    </DialogContext.Provider>
  )
}

/** Access the styled dialogs from any component. */
export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within DialogProvider')
  return ctx
}
