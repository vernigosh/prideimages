"use client"

import { memo, useEffect, useRef, useState } from "react"
import type { DisplayedTask } from "@/lib/viewer-tasks/task-types"
import { OVERLAY_WEIGHT_BODY, OVERLAY_WEIGHT_LABEL } from "@/lib/overlay-typography"

interface RotatingTaskCardProps {
  task: DisplayedTask | null
  visible: boolean
  /** Matches the timer rail width so the stack never changes horizontal footprint. */
  width?: number
  taskFontSize?: number
  usernameFontSize?: number
}

const FADE_MS = 200

/** Twitch hands out some very dark colors that are unreadable on a dark card, so
 *  keep the viewer's color only when it clears a luminance floor. */
function readableUsernameColor(color?: string): string {
  const fallback = "rgba(255,255,255,0.72)"
  if (!color) return fallback
  const hex = color.trim().replace("#", "")
  if (hex.length !== 6 || !/^[0-9a-f]{6}$/i.test(hex)) return fallback

  const r = Number.parseInt(hex.slice(0, 2), 16) / 255
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

  return luminance < 0.22 ? fallback : color
}

function RotatingTaskCardBase({
  task,
  visible,
  width = 400,
  taskFontSize = 26,
  usernameFontSize = 19,
}: RotatingTaskCardProps) {
  // Hold the outgoing task through a short crossfade so text never pops.
  const [shown, setShown] = useState<DisplayedTask | null>(task)
  const [faded, setFaded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sameTask = shown?.userId === task?.userId && shown?.task === task?.task
    if (sameTask) return

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    // Nothing on screen yet: adopt immediately and fade in.
    if (!shown || !task) {
      setShown(task)
      setFaded(Boolean(task))
      if (task) {
        timeoutRef.current = setTimeout(() => setFaded(false), 20)
      }
      return
    }

    setFaded(true)
    timeoutRef.current = setTimeout(() => {
      setShown(task)
      setFaded(false)
    }, FADE_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Hidden entirely when there is nothing to show, so the stack collapses cleanly.
  if (!visible || !shown) return null

  return (
    <div
      className="pointer-events-none rounded-xl border border-white/10 bg-neutral-900/80 px-5 py-3"
      style={{ width: `${width}px`, minHeight: "92px" }}
    >
      {/* Only opacity and transform animate: no layout, no blur, OBS-cheap. */}
      <div
        className="flex flex-col items-center gap-1 text-center"
        style={{
          opacity: faded ? 0 : 1,
          transform: faded ? "translateY(-6px)" : "translateY(0)",
          transition: `opacity ${FADE_MS}ms ease-out, transform ${FADE_MS}ms ease-out`,
        }}
      >
        <span
          className="font-sans text-white text-pretty"
          style={{
            fontSize: `${taskFontSize}px`,
            lineHeight: 1.2,
            fontWeight: OVERLAY_WEIGHT_LABEL,
            textShadow: "0 2px 6px rgba(0,0,0,0.6)",
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
          }}
        >
          {shown.task}
        </span>
        <span
          className="font-sans uppercase"
          style={{
            fontSize: `${usernameFontSize}px`,
            lineHeight: 1.1,
            fontWeight: OVERLAY_WEIGHT_BODY,
            color: readableUsernameColor(shown.usernameColor),
            textShadow: "0 2px 6px rgba(0,0,0,0.6)",
          }}
        >
          {shown.displayName}
        </span>
      </div>
    </div>
  )
}

export const RotatingTaskCard = memo(RotatingTaskCardBase)
