"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  clearViewerTaskData,
  getRomeDateKey,
  loadViewerTaskData,
  saveViewerTaskData,
  type PersistedViewerTaskUser,
} from "@/lib/viewer-tasks/task-storage"

interface UseViewerTaskStorageResult {
  /** Rome date key the current counts belong to. */
  dateKey: string
  /** Read persisted counts once on mount (empty during SSR). */
  hydrate: () => Record<string, PersistedViewerTaskUser>
  persist: (users: Record<string, PersistedViewerTaskUser>) => void
  clear: () => void
}

/** Owns the localStorage side of viewer tasks and watches for Rome midnight so
 *  completedToday can reset without a browser-source refresh. */
export function useViewerTaskStorage(onDateRollover?: () => void): UseViewerTaskStorageResult {
  const [dateKey, setDateKey] = useState(() => getRomeDateKey())
  const dateKeyRef = useRef(dateKey)
  dateKeyRef.current = dateKey
  const rolloverRef = useRef(onDateRollover)
  rolloverRef.current = onDateRollover

  const hydrate = useCallback(() => loadViewerTaskData(getRomeDateKey()).users, [])

  const persist = useCallback((users: Record<string, PersistedViewerTaskUser>) => {
    saveViewerTaskData({ version: 1, dateKey: dateKeyRef.current, users })
  }, [])

  const clear = useCallback(() => {
    clearViewerTaskData()
  }, [])

  // Rome-midnight watch. Checking once a minute is plenty for a calendar-day reset
  // and costs nothing in OBS compared with a continuous loop.
  useEffect(() => {
    const check = () => {
      const next = getRomeDateKey()
      if (next !== dateKeyRef.current) {
        dateKeyRef.current = next
        setDateKey(next)
        clearViewerTaskData()
        rolloverRef.current?.()
      }
    }
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [])

  return { dateKey, hydrate, persist, clear }
}
