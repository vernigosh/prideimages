"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Persist a settings object in localStorage, keyed by `key`.
 *
 * Persistence characteristics:
 * - Survives browser-source refresh, OBS restart, and new v0 deployments, because
 *   localStorage is scoped to the origin and is not cleared on reload/redeploy.
 * - On load, the stored object is MERGED over `defaults`, so any field added in a
 *   newer version is filled from defaults while previously saved fields are kept.
 *   This is why adding a new setting never requires clearing localStorage.
 *
 * The first render always returns `defaults` (so server and client markup match);
 * the persisted value is applied in a mount effect to avoid hydration mismatches.
 */
export function usePersistentSettings<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
  // Optional one-time migration. Receives the raw stored object and the current
  // defaults, and returns the object to merge over defaults. Use this to refresh
  // stale layout fields loaded from a separate store (e.g. OBS vs Chrome) without
  // clobbering unrelated saved values. Runs once per mount, before merging.
  migrate?: (stored: Partial<T>, defaults: T) => Partial<T>,
): [T, (update: Partial<T> | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(defaults)
  const defaultsRef = useRef(defaults)
  const migrateRef = useRef(migrate)
  migrateRef.current = migrate
  const hydratedRef = useRef(false)

  // Load persisted value after mount (optionally migrated, then merged over defaults).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        let parsed = JSON.parse(raw) as Partial<T>
        if (migrateRef.current) {
          parsed = migrateRef.current(parsed, defaultsRef.current)
        }
        setValue({ ...defaultsRef.current, ...parsed })
      }
    } catch (err) {
      console.log("[v0] Failed to load persisted settings for", key, err)
    }
    hydratedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Persist on every change (only after hydration so we never overwrite stored
  // values with defaults during the initial mount).
  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.log("[v0] Failed to persist settings for", key, err)
    }
  }, [key, value])

  const update = useCallback((patch: Partial<T> | ((prev: T) => T)) => {
    setValue((prev) => (typeof patch === "function" ? (patch as (p: T) => T)(prev) : { ...prev, ...patch }))
  }, [])

  const reset = useCallback(() => {
    setValue(defaultsRef.current)
  }, [])

  return [value, update, reset]
}
