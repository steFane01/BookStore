import type { DeliveryMethod } from '../types'
import type { SiteSettings } from '../config/site'
import { SHIPPING_FEES } from '../data/easyboxes'

export const MAX_SHIPPING_FEE = 500

function parseFee(value: unknown, fallback: number): number {
  if (value == null || value === '') return fallback
  const fee = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(fee) || fee < 0 || fee > MAX_SHIPPING_FEE) return fallback
  return Math.round(fee * 100) / 100
}

/**
 * Shipping fees (RON) from the owner-editable settings.
 *
 * Mirrors `shippingFeesFromSettings` in the backend so the checkout summary
 * shows exactly what the server will charge.
 */
export function shippingFeesFromSettings(settings: Partial<SiteSettings>): Record<DeliveryMethod, number> {
  return {
    courier: parseFee(settings.shippingFeeCourier, SHIPPING_FEES.courier),
    easybox: parseFee(settings.shippingFeeEasybox, SHIPPING_FEES.easybox),
    fanbox: parseFee(settings.shippingFeeFanbox, SHIPPING_FEES.fanbox),
  }
}

/** One shipping fee for the chosen delivery method. */
export function shippingFeeFor(
  settings: Partial<SiteSettings>,
  method: DeliveryMethod,
): number {
  return shippingFeesFromSettings(settings)[method]
}
