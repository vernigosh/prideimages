"use client"

import { memo, useEffect, useRef, useState } from "react"
import { DARK_TRANSITION_MS, FLAME_ANCHORS } from "@/lib/garden/dark-garden"

interface DarkGardenFlamesProps {
  /** True only while Dark Vernigosh is counting down. */
  active: boolean
}

/**
 * Ambient flame layer for Dark Vernigosh mode.
 *
 * Mounted only while it is needed: the GIFs are unmounted (and so stop decoding)
 * once the fade-out finishes, rather than being left on screen at opacity 0 and
 * animating forever behind an invisible layer. Nothing here runs on a timer beyond
 * that single unmount timeout, and the flames are pure <img> loops plus an opacity
 * transition — no particle system, no blur, no per-frame JS.
 */
function DarkGardenFlamesBase({ active }: DarkGardenFlamesProps) {
  // Kept mounted through the fade-out, then dropped.
  const [mounted, setMounted] = useState(active)
  // Drives the opacity transition one frame after mount so the browser has a
  // 0 -> 1 change to animate instead of painting the flames already opaque.
  const [shown, setShown] = useState(false)
  // Assets that failed to load (the placeholder GIFs are not in the project yet).
  const [failed, setFailed] = useState<Record<string, boolean>>({})
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current)
      unmountTimerRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (active) {
      setMounted(true)
      rafRef.current = requestAnimationFrame(() => setShown(true))
    } else {
      setShown(false)
      unmountTimerRef.current = setTimeout(() => setMounted(false), DARK_TRANSITION_MS)
    }

    return () => {
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current)
        unmountTimerRef.current = null
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [active])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {FLAME_ANCHORS.map((flame) => {
        if (failed[flame.id]) return null
        return (
          <img
            key={flame.id}
            src={flame.src || "/placeholder.svg"}
            alt=""
            className="absolute pixelated"
            onError={() => setFailed((prev) => (prev[flame.id] ? prev : { ...prev, [flame.id]: true }))}
            style={{
              left: `${flame.x}%`,
              bottom: `${flame.bottom}px`,
              height: `${flame.height}px`,
              width: "auto",
              imageRendering: "pixelated",
              transform: `translateX(-50%)${flame.flip ? " scaleX(-1)" : ""}`,
              opacity: shown ? 0.85 : 0,
              transition: `opacity ${DARK_TRANSITION_MS}ms ease-in-out ${flame.delayMs}ms`,
            }}
          />
        )
      })}
    </div>
  )
}

export const DarkGardenFlames = memo(DarkGardenFlamesBase)
