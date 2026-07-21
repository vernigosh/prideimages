"use client"

import { useEffect, useRef, useState, Fragment } from "react"
import {
  type NormalizedChatMessage,
  type OverlayChatEmote,
  twitchEmoteUrl,
  isKnownBot,
} from "@/lib/chat-commands"
import {
  OVERLAY_FONT_STANDARD,
  OVERLAY_LINE_HEIGHT_CHAT,
  OVERLAY_WEIGHT_LABEL,
  OVERLAY_WEIGHT_BODY,
} from "@/lib/overlay-typography"

export interface ChatOverlaySettings {
  enabled: boolean
  offsetX: number // px inset from the right edge
  offsetY: number // px inset from the bottom edge
  width: number // px
  visibleCount: number // 1-3
  usernameFontSize: number
  messageFontSize: number
  lifetimeMs: number // ~18000-22000
  backgroundOpacity: number // 0-1 (card translucency)
  maxLines: number // max text lines per message
  showBadges: boolean
  showEmotes: boolean
  hideRecognizedCommands: boolean
  hideAllCommands: boolean // hide every message starting with "!"
  hideBots: boolean
  ignoredUsers: string[]
}

export const DEFAULT_CHAT_OVERLAY_SETTINGS: ChatOverlaySettings = {
  enabled: true,
  offsetX: 40,
  offsetY: 40,
  width: 560, // wide enough for two clean lines at the 32px standard size
  visibleCount: 2,
  usernameFontSize: OVERLAY_FONT_STANDARD, // 32 (standard) - same as message
  messageFontSize: OVERLAY_FONT_STANDARD, // 32 (standard)
  lifetimeMs: 20000,
  backgroundOpacity: 0.72,
  maxLines: 2,
  showBadges: true,
  showEmotes: true,
  hideRecognizedCommands: true,
  hideAllCommands: false,
  hideBots: true,
  ignoredUsers: [],
}

const PINK_FALLBACK = "#ff6b9d"
const HISTORY_MAX = 20

interface DisplayMessage extends NormalizedChatMessage {
  addedAt: number
}

// Ensure username colors stay readable on the near-black cards.
function readableColor(color?: string): string {
  if (!color) return PINK_FALLBACK
  const hex = color.replace("#", "")
  if (hex.length !== 6) return color
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  // Relative luminance; if too dark, fall back to pink.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  if (luminance < 0.25) return PINK_FALLBACK
  return color
}

// Render message text, substituting Twitch emotes with their images.
function renderContent(text: string, emotes: OverlayChatEmote[], showEmotes: boolean, size: number) {
  if (!showEmotes || emotes.length === 0) return text
  const chars = Array.from(text)
  const nodes: React.ReactNode[] = []
  let cursor = 0
  emotes.forEach((emote, i) => {
    if (emote.start > cursor) {
      nodes.push(<Fragment key={`t-${i}`}>{chars.slice(cursor, emote.start).join("")}</Fragment>)
    }
    nodes.push(
      <img
        key={`e-${i}`}
        src={twitchEmoteUrl(emote.id) || "/placeholder.svg"}
        alt={emote.code}
        className="inline-block align-middle"
        style={{ height: `${Math.round(size * 1.15)}px`, margin: "0 1px" }}
        crossOrigin="anonymous"
      />,
    )
    cursor = emote.end + 1
  })
  if (cursor < chars.length) {
    nodes.push(<Fragment key="t-end">{chars.slice(cursor).join("")}</Fragment>)
  }
  return nodes
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[0.5em] font-bold uppercase leading-none align-middle ${className}`}
      style={{ letterSpacing: 0 }}
    >
      {label}
    </span>
  )
}

interface ChatOverlayProps {
  settings?: Partial<ChatOverlaySettings>
}

export function ChatOverlay({ settings }: ChatOverlayProps) {
  const s: ChatOverlaySettings = { ...DEFAULT_CHAT_OVERLAY_SETTINGS, ...settings }

  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const settingsRef = useRef(s)
  settingsRef.current = s

  const scheduleExpiry = (id: string, lifetimeMs: number) => {
    const timer = setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id))
      timersRef.current.delete(id)
    }, lifetimeMs)
    timersRef.current.set(id, timer)
  }

  // Decide whether a message is allowed to be DISPLAYED (never affects execution).
  const shouldDisplay = (m: NormalizedChatMessage): boolean => {
    const cfg = settingsRef.current
    const lower = m.username.trim().toLowerCase()
    if (cfg.ignoredUsers.map((u) => u.trim().toLowerCase()).includes(lower)) return false
    if (cfg.hideBots && (m.isBot || isKnownBot(m.username, cfg.ignoredUsers))) return false
    if (cfg.hideAllCommands && m.isCommand) return false
    if (cfg.hideRecognizedCommands && m.isRecognizedCommand) return false
    return true
  }

  useEffect(() => {
    const handleMessage = (e: Event) => {
      const cfg = settingsRef.current
      if (!cfg.enabled) return
      const m = (e as CustomEvent<NormalizedChatMessage>).detail
      if (!m || !m.id) return
      if (seenIdsRef.current.has(m.id)) return // dedup by Twitch message id
      if (!shouldDisplay(m)) return

      seenIdsRef.current.add(m.id)
      // Keep the seen-id set bounded.
      if (seenIdsRef.current.size > 500) {
        seenIdsRef.current = new Set(Array.from(seenIdsRef.current).slice(-200))
      }

      setMessages((prev) => {
        const next = [...prev, { ...m, addedAt: Date.now() }]
        // Bound retained history; drop + un-time oldest overflow.
        while (next.length > HISTORY_MAX) {
          const removed = next.shift()
          if (removed) {
            const t = timersRef.current.get(removed.id)
            if (t) {
              clearTimeout(t)
              timersRef.current.delete(removed.id)
            }
          }
        }
        return next
      })
      scheduleExpiry(m.id, cfg.lifetimeMs)
    }

    const handleClear = () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current.clear()
      setMessages([])
    }

    window.addEventListener("overlayChatMessage", handleMessage as EventListener)
    window.addEventListener("clearChatOverlay", handleClear as EventListener)
    return () => {
      window.removeEventListener("overlayChatMessage", handleMessage as EventListener)
      window.removeEventListener("clearChatOverlay", handleClear as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clean up all timers on unmount.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current.clear()
    }
  }, [])

  if (!s.enabled) return null

  // Newest at the bottom: show the most recent `visibleCount` messages, oldest first.
  const visible = messages.slice(-Math.max(1, Math.min(3, s.visibleCount)))
  if (visible.length === 0) return null // no permanent empty panel

  return (
    <div
      className="pointer-events-none fixed z-40 flex flex-col justify-end gap-2"
      style={{ right: `${s.offsetX}px`, bottom: `${s.offsetY}px`, width: `${s.width}px` }}
    >
      {visible.map((m) => {
        const nameColor = readableColor(m.color)
        return (
          <div
            key={m.id}
            className="w-full shadow-lg"
            style={{
              backgroundColor: `rgba(10, 10, 12, ${s.backgroundOpacity})`,
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "14px 20px",
            }}
          >
            {/* Username and message share one size + baseline; text flows inline. */}
            <p
              className="m-0 font-sans text-white"
              style={{
                fontSize: `${s.messageFontSize}px`,
                lineHeight: OVERLAY_LINE_HEIGHT_CHAT,
                letterSpacing: 0,
                fontWeight: OVERLAY_WEIGHT_BODY,
                display: "-webkit-box",
                WebkitLineClamp: s.maxLines + 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              {s.showBadges && m.badges.broadcaster && (
                <>
                  <Badge label="HOST" className="bg-[#ff6b9d] text-neutral-900" />{" "}
                </>
              )}
              {s.showBadges && m.badges.moderator && (
                <>
                  <Badge label="MOD" className="bg-emerald-500 text-neutral-900" />{" "}
                </>
              )}
              {s.showBadges && m.badges.vip && (
                <>
                  <Badge label="VIP" className="bg-fuchsia-400 text-neutral-900" />{" "}
                </>
              )}
              {s.showBadges && m.badges.subscriber && !m.badges.broadcaster && (
                <>
                  <Badge label="SUB" className="bg-sky-400 text-neutral-900" />{" "}
                </>
              )}
              <span
                style={{ color: nameColor, fontSize: `${s.usernameFontSize}px`, fontWeight: OVERLAY_WEIGHT_LABEL }}
              >
                {m.username}
              </span>{" "}
              <span>{renderContent(m.message, m.emotes, s.showEmotes, s.messageFontSize)}</span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
