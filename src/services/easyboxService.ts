import type { EasyBox } from '../types'
import { api, NetworkError } from './http'
import { EASYBOXES, findEasybox } from '../data/easyboxes'

/**
 * EasyBox service.
 *
 * The pickup points are fetched from the backend, which acts as a proxy for the
 * SameDay Courier API (`GET /api/easyboxes`): when SameDay credentials are
 * configured the list is the live one, otherwise the backend serves the bundled
 * demo list. On a network failure we fall back to the local static list so the
 * checkout always has something to offer.
 */

export interface LockersResult {
  boxes: EasyBox[]
  /** 'sameday' when served from the live API, 'static' when it's the demo list. */
  source: 'sameday' | 'static'
}

async function list(): Promise<LockersResult> {
  try {
    const result = await api<LockersResult>('/easyboxes')
    return result
  } catch (err) {
    if (err instanceof NetworkError) {
      return { boxes: EASYBOXES.map((e) => ({ ...e })), source: 'static' }
    }
    throw err
  }
}

let cache: Promise<LockersResult> | null = null

export const easyboxService = {
  /** Load the pickup points (cached per session). */
  getLockers(): Promise<LockersResult> {
    if (!cache) cache = list()
    return cache
  },

  /** Force a fresh fetch (e.g. after the admin re-syncs). */
  refresh(): Promise<LockersResult> {
    cache = list()
    return cache
  },

  /** Look up a single box by id within the fetched list. Falls back to static. */
  async findById(id: string | undefined): Promise<EasyBox | undefined> {
    if (!id) return undefined
    try {
      const { boxes } = await this.getLockers()
      const hit = boxes.find((b) => b.id === id)
      if (hit) return hit
    } catch {
      // ignore
    }
    return findEasybox(id)
  },
}
