"use client"

import { useEffect, useRef, useState } from "react"
import { UserPlus, Star, Gift, Gem, DollarSign, Swords } from "lucide-react"
import type { StreamEvent, StreamEventType } from "./streamelements-service"

export interface StreamEventPopupSettings {
  enabled: boolean
  position: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
  offsetX: number
  offsetY: number
  scale: number
  followExpiryMs: number
}

export const DEFAULT_EVENT_POPUP_SETTINGS: StreamEventPopupSettings = {
  enabled: true,
  position: "bottom-center",
  offsetX: 0,
  offsetY: 120,
  scale: 1,
  followExpiryMs: 45_000,
}

interface StreamEventPopupProps {
  events: StreamEvent[]
  settings?: Partial<StreamEventPopupSettings>
  onActiveChange?: (active: boolean) => void
  // When true (e.g. a full-screen takeover is active), events keep queuing but
  // nothing is displayed. Display resumes automatically once suppression lifts.
  suppressed?: boolean
  // Called once per event when it is first ingested into the internal queue.
  // The parent uses this to record consumed ids so that a popup remount (while the
  // parent still holds the cumulative events array) never re-enqueues old events.
  onConsumed?: (id: string) => void
}

// Per-type display durations (ms). Important events linger longer.
const DURATION_BY_TYPE: Record<StreamEventType, number> = {
  follow: 4000,
  cheer: 6000,
  tip: 6500,
  subscriber: 8000,
  giftSub: 8000,
  raid: 9000,
}

const FADE_MS = 400
const QUEUE_MAX = 20

interface QueuedEvent {
  event: StreamEvent
  enqueuedAt: number
}

function getIcon(type: StreamEventType) {
  switch (type) {
    case "follow":
      return UserPlus
    case "subscriber":
      return Star
    case "giftSub":
      return Gift
    case "cheer":
      return Gem
    case "tip":
      return DollarSign
    case "raid":
      return Swords
  }
}

function getMessage(ev: StreamEvent): { title: string; detail: string } {
  const name = ev.username
  switch (ev.type) {
    case "follow":
      return { title: name, detail: "just followed" }
    case "subscriber": {
      const months = ev.value && ev.value > 1 ? ` (${ev.value} months)` : ""
      if (ev.gifted && ev.gifter) return { title: name, detail: `gifted a sub by ${ev.gifter}` }
      return { title: name, detail: `just subscribed${months}` }
    }
    case "giftSub":
      return { title: ev.gifter || name, detail: `gifted ${ev.value ?? 1} sub${(ev.value ?? 1) > 1 ? "s" : ""}` }
    case "cheer":
      return { title: name, detail: `cheered ${ev.value ?? 0} bits` }
    case "tip":
      return { title: name, detail: `tipped $${(ev.value ?? 0).toFixed(2)}` }
    case "raid":
      return { title: name, detail: `raided with ${ev.value ?? 0} viewers` }
  }
}

function positionClasses(position: StreamEventPopupSettings["position"]): string {
  switch (position) {
    case "top-left":
      return "top-0 left-0 items-start"
    case "top-center":
      return "top-0 left-1/2 -translate-x-1/2 items-center"
    case "top-right":
      return "top-0 right-0 items-end"
    case "bottom-left":
      return "bottom-0 left-0 items-start"
    case "bottom-center":
      return "bottom-0 left-1/2 -translate-x-1/2 items-center"
    case "bottom-right":
      return "bottom-0 right-0 items-end"
  }
}

export function StreamEventPopup({
  events,
  settings,
  onActiveChange,
  suppressed = false,
  onConsumed,
}: StreamEventPopupProps) {
  const s: StreamEventPopupSettings = { ...DEFAULT_EVENT_POPUP_SETTINGS, ...settings }

  const [current, setCurrent] = useState<StreamEvent | null>(null)
  const [visible, setVisible] = useState(false)

  // Refs to prevent duplicate processing / scheduling.
  const seenIdsRef = useRef<Set<string>>(new Set())
  const queueRef = useRef<QueuedEvent[]>([])
  const processingRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const settingsRef = useRef(s)
  settingsRef.current = s
  const suppressedRef = useRef(suppressed)
  suppressedRef.current = suppressed

  const onActiveChangeRef = useRef(onActiveChange)
  onActiveChangeRef.current = onActiveChange
  const onConsumedRef = useRef(onConsumed)
  onConsumedRef.current = onConsumed

  // Ingest new discrete events into the internal queue (bounded).
  useEffect(() => {
    if (!s.enabled) return
    let added = false
    for (const ev of events) {
      if (seenIdsRef.current.has(ev.id)) continue
      seenIdsRef.current.add(ev.id)
      queueRef.current.push({ event: ev, enqueuedAt: Date.now() })
      onConsumedRef.current?.(ev.id)
      added = true
    }
    // Bound the internal queue; drop oldest low-priority (follow) first, else oldest.
    if (queueRef.current.length > QUEUE_MAX) {
      const overflow = queueRef.current.length - QUEUE_MAX
      for (let i = 0; i < overflow; i++) {
        const followIdx = queueRef.current.findIndex((q) => q.event.type === "follow")
        if (followIdx >= 0) queueRef.current.splice(followIdx, 1)
        else queueRef.current.shift()
      }
    }
    // Keep seen-id set from growing unbounded.
    if (seenIdsRef.current.size > 500) {
      seenIdsRef.current = new Set(events.map((e) => e.id))
    }
    if (added) processNext()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, s.enabled])

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }

  const processNext = () => {
    if (processingRef.current) return
    if (suppressedRef.current) return // hold the queue while a takeover is active
    const cfg = settingsRef.current
    // Skip stale follows that waited too long behind important events.
    let next: QueuedEvent | undefined
    while ((next = queueRef.current.shift())) {
      if (next.event.type === "follow" && Date.now() - next.enqueuedAt > cfg.followExpiryMs) {
        continue // expired stale follow
      }
      break
    }
    if (!next) return

    processingRef.current = true
    setCurrent(next.event)
    setVisible(true)
    onActiveChangeRef.current?.(true)

    const duration = DURATION_BY_TYPE[next.event.type] ?? 5000
    // Begin fade-out after duration.
    timersRef.current.push(
      setTimeout(() => {
        setVisible(false)
        // After fade completes, clear + process the next queued event.
        timersRef.current.push(
          setTimeout(() => {
            setCurrent(null)
            processingRef.current = false
            if (queueRef.current.length > 0) {
              processNext()
            } else {
              onActiveChangeRef.current?.(false)
            }
          }, FADE_MS),
        )
      }, duration),
    )
  }

  // When suppression lifts, resume draining the queue.
  useEffect(() => {
    if (!suppressed && s.enabled && !processingRef.current && queueRef.current.length > 0) {
      processNext()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppressed, s.enabled])

  useEffect(() => {
    return () => clearTimers()
  }, [])

  if (!s.enabled || suppressed || !current) return null

  const Icon = getIcon(current.type)
  const { title, detail } = getMessage(current)

  return (
    <div className={`pointer-events-none fixed z-40 flex ${positionClasses(s.position)}`}>
      <div
        style={{
          transform: `translate(${s.offsetX}px, ${s.position.startsWith("top") ? s.offsetY : -s.offsetY}px) scale(${s.scale})`,
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/85 px-5 py-3 shadow-2xl backdrop-blur-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#ff6b9d]">
            <Icon className="h-6 w-6 text-neutral-900" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-white">{title}</span>
            <span className="text-sm font-medium text-white/70">{detail}</span>
          </div>
          {current.isTest && (
            <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Test
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
