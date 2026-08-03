// Durable slice of the viewer task system.
//
// Only lastTask + completedToday are persisted, keyed by the Europe/Rome calendar
// date. Active/queued tasks and rotation order are intentionally NOT persisted: the
// rotation is meant to clear every break, so restoring it after an OBS refresh would
// resurrect tasks the break was supposed to wipe.

export const VIEWER_TASK_STORAGE_KEY = "verniViewerTasksVersion1"
export const VIEWER_TASK_STORAGE_VERSION = 1

export interface PersistedViewerTaskUser {
  lastTask: string | null
  completedToday: number
}

export interface PersistedViewerTaskData {
  version: 1
  dateKey: string
  users: Record<string, PersistedViewerTaskUser>
}

/** Calendar date in Europe/Rome, as YYYY-MM-DD. The responses say "today", and the
 *  stream runs on Rome time, so the reset must follow Rome midnight rather than the
 *  machine's timezone or UTC. */
export function getRomeDateKey(now: Date = new Date()): string {
  try {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now)
  } catch {
    return now.toISOString().slice(0, 10)
  }
}

function emptyData(dateKey: string): PersistedViewerTaskData {
  return { version: VIEWER_TASK_STORAGE_VERSION, dateKey, users: {} }
}

/** Reads persisted data, discarding it when the Rome date has rolled over or the
 *  payload is malformed. Guarded for SSR and for OBS profiles with storage denied. */
export function loadViewerTaskData(dateKey = getRomeDateKey()): PersistedViewerTaskData {
  if (typeof window === "undefined") return emptyData(dateKey)

  try {
    const raw = window.localStorage.getItem(VIEWER_TASK_STORAGE_KEY)
    if (!raw) return emptyData(dateKey)

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return emptyData(dateKey)

    const candidate = parsed as Partial<PersistedViewerTaskData>
    if (candidate.version !== VIEWER_TASK_STORAGE_VERSION) return emptyData(dateKey)
    if (candidate.dateKey !== dateKey) return emptyData(dateKey) // new Rome day
    if (!candidate.users || typeof candidate.users !== "object") return emptyData(dateKey)

    const users: Record<string, PersistedViewerTaskUser> = {}
    for (const [key, value] of Object.entries(candidate.users)) {
      if (!value || typeof value !== "object") continue
      const entry = value as Partial<PersistedViewerTaskUser>
      const count = typeof entry.completedToday === "number" && Number.isFinite(entry.completedToday)
        ? Math.max(0, Math.floor(entry.completedToday))
        : 0
      users[key.toLowerCase()] = {
        lastTask: typeof entry.lastTask === "string" ? entry.lastTask : null,
        completedToday: count,
      }
    }

    return { version: VIEWER_TASK_STORAGE_VERSION, dateKey, users }
  } catch {
    return emptyData(dateKey)
  }
}

export function saveViewerTaskData(data: PersistedViewerTaskData): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(VIEWER_TASK_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage unavailable (private mode / quota). Counts stay in memory only.
  }
}

export function clearViewerTaskData(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(VIEWER_TASK_STORAGE_KEY)
  } catch {
    // Nothing else to do.
  }
}
