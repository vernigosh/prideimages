"use client"

import { memo } from "react"
import { OVERLAY_WEIGHT_BODY } from "@/lib/overlay-typography"

interface TaskBreakPromptProps {
  visible: boolean
  text?: string
  width?: number
  fontSize?: number
}

/** The only task-related copy shown during a break. Deliberately no board, no
 *  unfinished cards, no summary — just the one instruction. */
function TaskBreakPromptBase({
  visible,
  text = "Type !repeat to do the same task next work period.",
  width = 400,
  fontSize = 20,
}: TaskBreakPromptProps) {
  if (!visible) return null

  return (
    <div
      className="pointer-events-none rounded-xl border border-white/10 bg-neutral-900/80 px-5 py-3"
      style={{ width: `${width}px` }}
    >
      <span
        className="block font-sans text-center text-white/80 text-pretty"
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.35,
          fontWeight: OVERLAY_WEIGHT_BODY,
          textShadow: "0 2px 6px rgba(0,0,0,0.6)",
        }}
      >
        {text}
      </span>
    </div>
  )
}

export const TaskBreakPrompt = memo(TaskBreakPromptBase)
