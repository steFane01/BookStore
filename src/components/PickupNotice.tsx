import type { DeliveryMethod } from '../types'
import { useSettings } from '../context/SettingsContext'
import { Modal } from './Modal'
import { IconCheck, IconMapPin } from './icons'

interface PickupNoticeProps {
  open: boolean
  method: Exclude<DeliveryMethod, 'courier'>
  onClose: () => void
}

/**
 * Styled information dialog shown when the customer chooses a locker delivery
 * (EasyBox or FANbox). Explains that the parcel is shipped to the exact locker
 * and that the payment is made by card at the locker (ramburs is also possible
 * for EasyBox). All copy is owner-editable from Admin → Setări.
 */
export function PickupNotice({ open, method, onClose }: PickupNoticeProps) {
  const { settings } = useSettings()
  const isFanbox = method === 'fanbox'
  const title =
    (isFanbox ? settings.fanboxNoticeTitle : settings.easyboxNoticeTitle) ||
    (isFanbox ? 'Livrare la FANbox' : 'Livrare la EasyBox')
  const text = isFanbox ? settings.fanboxNoticeText : settings.easyboxNoticeText
  const lockerLabel = isFanbox ? 'FANbox' : 'EasyBox'

  return (
    <Modal
      open={open}
      title={title}
      eyebrow={`Livrare ${lockerLabel}`}
      onClose={onClose}
      closeOnBackdrop={false}
      maxWidth="max-w-xl"
      footer={
        <button type="button" onClick={onClose} className="btn btn-primary px-6 py-2.5 text-sm">
          {settings.pickupNoticeConfirm || 'Am înțeles'}
        </button>
      }
    >
      <div className="flex items-start gap-3 border border-brass/40 bg-brass/5 px-4 py-3">
        <IconMapPin className="mt-0.5 h-5 w-5 shrink-0 text-brass-dark" />
        <p className="text-sm leading-relaxed text-ink">
          Comanda este expediată direct către lockerul {lockerLabel} ales, pe numele și
          telefonul indicate la checkout.
        </p>
      </div>

      {text && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-light">{text}</p>}

      <div className="mt-4 rounded-sm border border-oxblood/20 bg-oxblood/5 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <IconCheck className="h-4 w-4 text-oxblood" />
          Plata se face cu cardul la locker
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {isFanbox
            ? 'Plata este exclusiv cu cardul, la ridicarea coletului. Poți alege să achizi doar transportul sau valoarea întreagă a coletului (ramburs).'
            : 'La ridicarea coletului poți plăti cu cardul sau alege ramburs la locker.'}
        </p>
      </div>
    </Modal>
  )
}
