"use client"

import { useCallback, useState } from "react"
import type { NormalizedChatMessage } from "@/lib/chat-commands"
import type { TaskCommandResponse } from "@/lib/viewer-tasks/task-types"

interface TaskDebugPanelProps {
  responses: TaskCommandResponse[]
  phase: "work" | "break"
  activeTaskCount: number
  enabled: boolean
  onSimulate: (message: NormalizedChatMessage, bypassCooldown: boolean) => void
  onWorkStart: () => void
  onBreakStart: () => void
  onAdvance: () => void
  onClearCurrent: () => void
  onReset: () => void
  onEnable: () => void
  onDisable: () => void
}

const VIEWERS = [
  { name: "AlphaViewer", color: "#ff6b6b" },
  { name: "BetaViewer", color: "#1f2933" }, // deliberately dark: tests the readability floor
  { name: "GammaViewer", color: "#4ecdc4" },
]

let simCounter = 0

/** Builds a message shaped exactly like the live normalized chat payload, so the
 *  panel exercises the same code path real viewers do. */
function simulatedMessage(
  username: string,
  color: string,
  text: string,
  isMod = false,
): NormalizedChatMessage {
  simCounter += 1
  return {
    id: `task-debug-${simCounter}-${Date.now()}`,
    username,
    color,
    badges: { broadcaster: false, moderator: isMod, vip: false, subscriber: false },
    message: text,
    emotes: [],
    isBot: false,
    isCommand: text.startsWith("!"),
    isRecognizedCommand: true,
    timestamp: Date.now(),
  }
}

export function TaskDebugPanel({
  responses,
  phase,
  activeTaskCount,
  enabled,
  onSimulate,
  onWorkStart,
  onBreakStart,
  onAdvance,
  onClearCurrent,
  onReset,
  onEnable,
  onDisable,
}: TaskDebugPanelProps) {
  const [bypassCooldown, setBypassCooldown] = useState(true)

  const send = useCallback(
    (viewerIndex: number, text: string) => {
      const viewer = VIEWERS[viewerIndex]
      onSimulate(simulatedMessage(viewer.name, viewer.color, text), bypassCooldown)
    },
    [onSimulate, bypassCooldown],
  )

  /** Sends as a moderator, for exercising the mod-gated !hidetask path. */
  const sendAsMod = useCallback(
    (text: string) => {
      onSimulate(simulatedMessage("ModViewer", "#ffd166", text, true), bypassCooldown)
    },
    [onSimulate, bypassCooldown],
  )

  const buttonClass =
    "rounded border border-white/15 bg-white/5 px-2 py-1 text-left text-[11px] leading-tight text-white/90 hover:bg-white/15"

  return (
    <div className="pointer-events-auto fixed bottom-4 right-4 z-[100] w-[300px] rounded-lg border border-white/15 bg-neutral-950/95 p-3 font-mono text-[11px] text-white">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-sans text-xs font-semibold uppercase tracking-wide">Task Debug</span>
        <span className="text-white/60">
          {phase} · {activeTaskCount} active · {enabled ? "on" : "off"}
        </span>
      </div>

      <label className="mb-2 flex items-center gap-2 text-white/70">
        <input
          type="checkbox"
          checked={bypassCooldown}
          onChange={(e) => setBypassCooldown(e.target.checked)}
        />
        Bypass 5s cooldown
      </label>

      <div className="mb-2 grid grid-cols-2 gap-1">
        <button type="button" className={buttonClass} onClick={onWorkStart}>
          Start work
        </button>
        <button type="button" className={buttonClass} onClick={onBreakStart}>
          Start break
        </button>

        <button type="button" className={buttonClass} onClick={() => send(0, "!task finish my deck prep")}>
          A: !task
        </button>
        <button type="button" className={buttonClass} onClick={() => send(1, "!task write release notes")}>
          B: !task
        </button>
        <button type="button" className={buttonClass} onClick={() => send(2, "!task clean sample library")}>
          C: !task
        </button>
        <button type="button" className={buttonClass} onClick={() => send(0, "!task replaced task for A")}>
          A: replace task
        </button>

        <button type="button" className={buttonClass} onClick={() => send(0, "!repeat")}>
          A: !repeat
        </button>
        <button type="button" className={buttonClass} onClick={() => send(1, "!repeat")}>
          B: !repeat
        </button>
        <button type="button" className={buttonClass} onClick={() => send(0, "!done")}>
          A: !done
        </button>
        <button type="button" className={buttonClass} onClick={() => send(1, "!done")}>
          B: !done
        </button>

        <button type="button" className={buttonClass} onClick={onAdvance}>
          Advance rotation
        </button>
        <button type="button" className={buttonClass} onClick={onClearCurrent}>
          Clear current
        </button>

        <button type="button" className={buttonClass} onClick={() => send(2, "!task")}>
          Empty !task
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() =>
            send(
              2,
              "!task this task text is deliberately far longer than seventy characters so the clamp can be verified",
            )
          }
        >
          Over 70 chars
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => send(2, "!task check https://example.com/very/long/link now")}
        >
          Task with URL
        </button>
        <button type="button" className={buttonClass} onClick={() => send(2, "!done")}>
          C: !done (grammar)
        </button>

        {/* Mod-only !hidetask. "Non-mod" must produce NO confirmation at all. */}
        <button type="button" className={buttonClass} onClick={() => sendAsMod("!hidetask AlphaViewer")}>
          Mod: !hidetask A
        </button>
        <button type="button" className={buttonClass} onClick={() => sendAsMod("!hidetask @BetaViewer")}>
          Mod: !hidetask @B
        </button>
        <button type="button" className={buttonClass} onClick={() => sendAsMod("!hidetask NobodyHere")}>
          Mod: hide unknown
        </button>
        <button type="button" className={buttonClass} onClick={() => send(2, "!hidetask AlphaViewer")}>
          Non-mod: !hidetask
        </button>

        <button type="button" className={buttonClass} onClick={enabled ? onDisable : onEnable}>
          {enabled ? "Disable system" : "Enable system"}
        </button>
        <button
          type="button"
          className="rounded border border-red-400/40 bg-red-500/20 px-2 py-1 text-left text-[11px] leading-tight text-white hover:bg-red-500/35"
          onClick={onReset}
        >
          Reset daily data
        </button>
      </div>

      <div className="mb-1 text-white/60">
        Generated confirmations (simulations are not sent to Twitch):
      </div>
      <div className="max-h-32 overflow-y-auto rounded bg-black/50 p-2">
        {responses.length === 0 ? (
          <span className="text-white/40">No responses yet.</span>
        ) : (
          responses.map((r, i) => (
            <div key={`${r.timestamp}-${i}`} className="mb-1 break-words text-white/85">
              {r.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
