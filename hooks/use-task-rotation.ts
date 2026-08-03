"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { TASK_ROTATION_INTERVAL_MS } from "@/lib/viewer-tasks/task-types"

/**
 * Round-robins a single userId out of rotationOrder on ONE shared interval.
 *
 * The interval is created once (per active/inactive flip) and reads the order from a
 * ref, so a newly submitted task never restarts the timer or cuts short the task
 * currently on screen. Advancing works off the displayed userId rather than a numeric
 * index, which keeps the sequence correct when entries are removed mid-cycle.
 */
export function useTaskRotation(rotationOrder: string[], active: boolean) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const orderRef = useRef(rotationOrder)
  orderRef.current = rotationOrder
  const currentRef = useRef<string | null>(null)
  currentRef.current = currentUserId

  const advance = useCallback(() => {
    const order = orderRef.current
    if (order.length === 0) {
      if (currentRef.current !== null) setCurrentUserId(null)
      return
    }
    const index = currentRef.current ? order.indexOf(currentRef.current) : -1
    const next = order[(index + 1) % order.length]
    setCurrentUserId(next)
  }, [])

  // Keep the selection valid: adopt the first task when nothing is shown, and jump
  // to a live entry the moment the displayed one is completed or cleared.
  useEffect(() => {
    if (rotationOrder.length === 0) {
      setCurrentUserId(null)
      return
    }
    setCurrentUserId((prev) => (prev && rotationOrder.includes(prev) ? prev : rotationOrder[0]))
  }, [rotationOrder])

  useEffect(() => {
    if (!active) return
    const id = setInterval(advance, TASK_ROTATION_INTERVAL_MS)
    return () => clearInterval(id)
  }, [active, advance])

  return { currentUserId, advance }
}
