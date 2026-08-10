// Durable slice of the community garden.
//
// Only userPickedTotals is persisted, keyed by the Europe/Rome calendar date, so an
// OBS refresh mid-stream no longer wipes everyone's picked totals. This matters for
// more than the displayed number: the milestone celebrations fire on the crossing
// edge (`newPickedTotal >= 20 && previous < 20`), so a wiped total made viewers
// re-earn awards they already had and replayed the celebrations on stream.
//
// Live flowers are intentionally NOT persisted. They carry plantedAt timestamps that
// drive growth stages and the 5-minute pick gate, and restoring a garden full of
// flowers that silently matured while the overlay was closed would hand out a pile
// of instantly-pickable flowers after every refresh.
//
// Mirrors lib/viewer-tasks/task-storage.ts, and shares its Rome date helper so both
// systems roll over at exactly the same moment.

import { getRomeDateKey } from "@/lib/viewer-tasks/task-storage"

export { getRomeDateKey }

export const GARDEN_STORAGE_KEY = "verniGardenPickedTotalsVersion1"
export const GARDEN_STORAGE_VERSION = 1

export type PickedTotals = Record<string, number>

export interface PersistedGardenData {
  version: 1
  dateKey: string
  pickedTotals: PickedTotals
}

function emptyData(dateKey: string): PersistedGardenData {
  return { version: GARDEN_STORAGE_VERSION, dateKey, pickedTotals: {} }
}

/** Reads persisted totals, discarding them when the Rome date has rolled over or the
 *  payload is malformed. Guarded for SSR and for OBS profiles with storage denied. */
export function loadGardenData(dateKey = getRomeDateKey()): PersistedGardenData {
  if (typeof window === "undefined") return emptyData(dateKey)

  try {
    const raw = window.localStorage.getItem(GARDEN_STORAGE_KEY)
    if (!raw) return emptyData(dateKey)

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return emptyData(dateKey)

    const candidate = parsed as Partial<PersistedGardenData>
    if (candidate.version !== GARDEN_STORAGE_VERSION) return emptyData(dateKey)
    if (candidate.dateKey !== dateKey) return emptyData(dateKey) // new Rome day
    if (!candidate.pickedTotals || typeof candidate.pickedTotals !== "object") {
      return emptyData(dateKey)
    }

    // Rebuild rather than trusting the blob: a corrupted count would otherwise feed
    // straight into the milestone comparisons and either spam or suppress awards.
    const pickedTotals: PickedTotals = {}
    for (const [username, value] of Object.entries(candidate.pickedTotals)) {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue
      pickedTotals[username.toLowerCase()] = Math.floor(value)
    }

    return { version: GARDEN_STORAGE_VERSION, dateKey, pickedTotals }
  } catch {
    return emptyData(dateKey)
  }
}

export function loadPickedTotals(dateKey = getRomeDateKey()): PickedTotals {
  return loadGardenData(dateKey).pickedTotals
}

export function savePickedTotals(pickedTotals: PickedTotals, dateKey = getRomeDateKey()): void {
  if (typeof window === "undefined") return
  try {
    const payload: PersistedGardenData = {
      version: GARDEN_STORAGE_VERSION,
      dateKey,
      pickedTotals,
    }
    window.localStorage.setItem(GARDEN_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable (private mode / quota). Totals stay in memory only.
  }
}

/** Used by the explicit !resetgarden command, which is meant to wipe the day. */
export function clearGardenData(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(GARDEN_STORAGE_KEY)
  } catch {
    // Nothing else to do.
  }
}
