"use client"

import { useEffect, useLayoutEffect, useRef, useState, Fragment } from "react"
import {
  type NormalizedChatMessage,
  type OverlayChatEmote,
  twitchEmoteUrl,
  isKnownBot,
} from "@/lib/chat-commands"
import {
  OVERLAY_LINE_HEIGHT_CHAT,
  OVERLAY_WEIGHT_LABEL,
  OVERLAY_WEIGHT_BODY,
} from "@/lib/overlay-typography"
import type { StreamEvent } from "./streamelements-service"

export interface ChatOverlaySettings {
  enabled: boolean
  offsetX: number // px inset from the left edge
  offsetY: number // px inset from the bottom edge
  width: number // px
  visibleCount: number // 1-3
  usernameFontSize: number
  messageFontSize: number
  lifetimeMs: number // ~18000-22000
  backgroundOpacity: number // 0-1 (card translucency)
  borderRadius: number // px, per-card corner rounding
  paddingX: number // px, card horizontal padding
  paddingY: number // px, card vertical padding
  cardGap: number // px, vertical gap between individual cards
  maxLines: number // max text lines per message
  /** @deprecated Badges were removed from the presentation. Field kept so older
   *  saved settings still load; the value is ignored and no badge is rendered. */
  showBadges: boolean
  showEmotes: boolean
  hideRecognizedCommands: boolean
  hideAllCommands: boolean // hide every message starting with "!"
  hideBots: boolean
  ignoredUsers: string[]
  // When true (default), each username renders in that viewer's exact Twitch chat
  // color from the message tags. When false, every username uses the pink fallback.
  useTwitchUsernameColors: boolean
  // Render-only uppercase presentation. Never mutates stored message data.
  uppercase: boolean
  // Layout-schema version. Bumped whenever the compact layout defaults change so a
  // one-time migration can refresh legacy layout values loaded from OBS/Chrome
  // localStorage (which are separate stores). See CHAT_LAYOUT_VERSION.
  chatLayoutVersion: number
}

// Bump this when the layout defaults below change. On load, any persisted settings
// with a lower (or missing) version have ONLY their layout fields refreshed once.
export const CHAT_LAYOUT_VERSION = 5

// Layout-only fields refreshed by the migration. Behavioral/filter fields
// (enabled, filters, colors, uppercase, ignoredUsers, lifetime, etc.) are preserved.
export const CHAT_LAYOUT_FIELDS = [
  "offsetX",
  "offsetY",
  "width",
  "visibleCount",
  "usernameFontSize",
  "messageFontSize",
  "borderRadius",
  "paddingX",
  "paddingY",
  "cardGap",
  "maxLines",
] as const

export const DEFAULT_CHAT_OVERLAY_SETTINGS: ChatOverlaySettings = {
  enabled: true,
  offsetX: 50, // inset from left — lower-left chat rail in the approved layout
  offsetY: 250, // stack grows upward from this lower-left anchor
  width: 400,
  visibleCount: 2,
  usernameFontSize: 20,
  messageFontSize: 24, // shared readable size for chat messages and stream events
  lifetimeMs: 20000,
  backgroundOpacity: 0.58,
  borderRadius: 14,
  paddingX: 13,
  paddingY: 7,
  cardGap: 6,
  maxLines: 2,
  showBadges: false, // deprecated; badges are no longer rendered
  showEmotes: true,
  hideRecognizedCommands: true,
  hideAllCommands: false,
  hideBots: true,
  ignoredUsers: [],
  useTwitchUsernameColors: true,
  uppercase: true,
  chatLayoutVersion: CHAT_LAYOUT_VERSION,
}

// Established Vernigosh pink, used only when there is no valid Twitch color.
const PINK_FALLBACK = "#ff6b9d"
// Subtle dark shadow keeps any Twitch color legible over video without altering it.
const NAME_TEXT_SHADOW = "0 1px 2px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.65)"
// Individual-card chrome: subtle 1px light border + minimal shadow, no backdrop blur.
const CARD_BORDER = "1px solid rgba(255,255,255,0.14)"
const CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.35)"
const HISTORY_MAX = 20

// Message-flow animation timing.
const ENTER_OFFSET_PX = 16 // new messages rise from ~16px below their final spot
const ANIM_MS = 300 // enter / move / exit duration
const ANIM_EASE = "cubic-bezier(0.22, 1, 0.36, 1)" // smooth ease-out, no bounce/overshoot

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
}

interface DisplayChatMessage extends NormalizedChatMessage {
  kind: "chat"
  addedAt: number
  leaving?: boolean // fading out prior to removal
}

interface DisplayStreamEvent {
  kind: "event"
  id: string
  label: string
  message: string
  addedAt: number
  leaving?: boolean
}

type DisplayItem = DisplayChatMessage | DisplayStreamEvent

function formatStreamEvent(event: StreamEvent): Pick<DisplayStreamEvent, "label" | "message"> {
  const testSuffix = event.isTest ? " (test)" : ""
  switch (event.type) {
    case "follow":
      return { label: event.username, message: `just followed${testSuffix}` }
    case "subscriber": {
      const months = event.value && event.value > 1 ? ` for ${event.value} months` : ""
      if (event.gifted && event.gifter) {
        return { label: event.username, message: `received a gifted sub from ${event.gifter}${testSuffix}` }
      }
      return { label: event.username, message: `just subscribed${months}${testSuffix}` }
    }
    case "giftSub": {
      const count = event.value ?? 1
      return { label: event.gifter || event.username, message: `gifted ${count} sub${count === 1 ? "" : "s"}${testSuffix}` }
    }
    case "cheer":
      return { label: event.username, message: `cheered ${event.value ?? 0} bits${testSuffix}` }
    case "tip":
      return { label: event.username, message: `tipped $${(event.value ?? 0).toFixed(2)}${testSuffix}` }
    case "raid":
      return { label: event.username, message: `raided with ${event.value ?? 0} viewers${testSuffix}` }
  }
}

// Only a #RGB or #RRGGBB string is a valid Twitch color.
function isValidHexColor(color?: string): color is string {
  return typeof color === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim())
}

// Resolve the username color WITHOUT ever altering a valid Twitch value.
// - Colors disabled  -> pink fallback for everyone.
// - Valid Twitch hex -> returned exactly as provided (no brighten/darken/desaturate).
// - Missing/invalid  -> pink fallback.
// Role (broadcaster/mod/vip/sub) never influences color; that comes from badges.
function resolveUsernameColor(color: string | undefined, useTwitchColors: boolean): string {
  if (!useTwitchColors) return PINK_FALLBACK
  if (isValidHexColor(color)) return color.trim()
  return PINK_FALLBACK
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

// Badges and role pills were intentionally removed from the chat presentation.
// Role data still lives on normalized messages (used elsewhere for command
// permissions), it is simply never rendered here. No badge icons, placeholders,
// or role abbreviations appear, and no badge API is contacted.

interface ChatOverlayProps {
  settings?: Partial<ChatOverlaySettings>
  events?: StreamEvent[]
}

export function ChatOverlay({ settings, events = [] }: ChatOverlayProps) {
  const s: ChatOverlaySettings = { ...DEFAULT_CHAT_OVERLAY_SETTINGS, ...settings }

  const [messages, setMessages] = useState<DisplayItem[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const removeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const settingsRef = useRef(s)
  settingsRef.current = s

  // Animation bookkeeping (FLIP for position, CSS transition for enter/exit).
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const prevTopsRef = useRef<Map<string, number>>(new Map())
  const enteredRef = useRef<Set<string>>(new Set())

  // Expiry runs in two phases so the card can fade out before it is removed.
  // The lifetime is scheduled ONCE on arrival and is never reset by later messages.
  const scheduleExpiry = (id: string, lifetimeMs: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(id)
      const reduce = prefersReducedMotion()
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, leaving: true } : m)))
      const rt = setTimeout(
        () => {
          setMessages((prev) => prev.filter((m) => m.id !== id))
          removeTimersRef.current.delete(id)
        },
        reduce ? 0 : ANIM_MS,
      )
      removeTimersRef.current.set(id, rt)
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
        const next: DisplayItem[] = [...prev, { ...m, kind: "chat", addedAt: Date.now() }]
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

  // StreamElements returns a cumulative bounded event array. Ingest each stable id
  // once so events join the same upward-growing stack and expire independently.
  useEffect(() => {
    const cfg = settingsRef.current
    if (!cfg.enabled) return

    for (const event of events) {
      const id = `event:${event.id}`
      if (seenIdsRef.current.has(id)) continue
      seenIdsRef.current.add(id)
      const copy = formatStreamEvent(event)
      setMessages((prev) => {
        const next: DisplayItem[] = [...prev, { kind: "event", id, ...copy, addedAt: Date.now() }]
        while (next.length > HISTORY_MAX) {
          const removed = next.shift()
          if (removed) {
            const timer = timersRef.current.get(removed.id)
            if (timer) clearTimeout(timer)
            timersRef.current.delete(removed.id)
          }
        }
        return next
      })
      scheduleExpiry(id, cfg.lifetimeMs)
    }

    if (seenIdsRef.current.size > 500) {
      seenIdsRef.current = new Set(Array.from(seenIdsRef.current).slice(-200))
    }
    // `scheduleExpiry` reads no render state; settings are read through settingsRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events])

  // Clean up all timers on unmount.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current.clear()
      removeTimersRef.current.forEach((t) => clearTimeout(t))
      removeTimersRef.current.clear()
    }
  }, [])

  // FLIP animation: new cards rise + fade in, existing cards glide to their new
  // positions, expiring cards fade out. Runs after every commit; keys are stable
  // message ids so cards are never remounted unnecessarily.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      const tops = new Map<string, number>()
      cardRefs.current.forEach((el, id) => {
        el.style.transition = ""
        el.style.transform = ""
        el.style.opacity = el.dataset.leaving === "true" ? "0" : "1"
        tops.set(id, el.getBoundingClientRect().top)
      })
      prevTopsRef.current = tops
      return
    }

    // 1. Measure natural positions with any prior transform cleared.
    const naturalTops = new Map<string, number>()
    cardRefs.current.forEach((el, id) => {
      el.style.transition = "none"
      el.style.transform = ""
      naturalTops.set(id, el.getBoundingClientRect().top)
    })

    // 2. Invert: seed the starting transform/opacity for new + moved cards. New
    //    cards start ENTER_OFFSET_PX below + transparent; moved cards start at their
    //    previous position (transition still disabled from step 1).
    cardRefs.current.forEach((el, id) => {
      if (el.dataset.leaving === "true") return
      const prevTop = prevTopsRef.current.get(id)
      if (!enteredRef.current.has(id)) {
        enteredRef.current.add(id)
        el.style.transform = `translateY(${ENTER_OFFSET_PX}px)`
        el.style.opacity = "0"
      } else if (prevTop !== undefined) {
        const dy = prevTop - (naturalTops.get(id) ?? prevTop)
        if (dy) el.style.transform = `translateY(${dy}px)`
      }
    })

    // 2b. Force a synchronous reflow so the seeded (inverted) transform/opacity is
    //     committed as the transition's START value. Without this flush the browser
    //     coalesces the seed and target into a single style change and NO motion is
    //     painted — the bug that made the animation look instantaneous.
    void document.body.offsetHeight

    // 3. Play: enable transitions and set every card to its resting state. Because
    //    the start value was just committed, the browser animates seed -> target.
    cardRefs.current.forEach((el) => {
      el.style.transition = `transform ${ANIM_MS}ms ${ANIM_EASE}, opacity ${ANIM_MS}ms ${ANIM_EASE}`
      if (el.dataset.leaving === "true") {
        el.style.opacity = "0"
      } else {
        el.style.transform = "translateY(0)"
        el.style.opacity = "1"
      }
    })

    prevTopsRef.current = naturalTops
    enteredRef.current.forEach((id) => {
      if (!cardRefs.current.has(id)) enteredRef.current.delete(id)
    })
  })

  if (!s.enabled) return null

  // Newest at the bottom: show the most recent `visibleCount` messages, oldest first.
  const visible = messages.slice(-Math.max(1, Math.min(3, s.visibleCount)))
  if (visible.length === 0) return null // no permanent empty panel

  return (
    <div
      className="pointer-events-none fixed z-40 flex flex-col justify-end"
      style={{ left: `${s.offsetX}px`, bottom: `${s.offsetY}px`, width: `${s.width}px`, gap: `${s.cardGap}px` }}
    >
      {visible.map((item) => {
        const isEvent = item.kind === "event"
        const nameColor = item.kind === "chat"
          ? resolveUsernameColor(item.color, s.useTwitchUsernameColors)
          : "#171717"

        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) cardRefs.current.set(item.id, el)
              else cardRefs.current.delete(item.id)
            }}
            data-leaving={item.leaving ? "true" : "false"}
            className={isEvent ? "w-fit max-w-full self-start" : "w-full"}
            style={{
              backgroundColor: isEvent ? PINK_FALLBACK : `rgba(10, 10, 12, ${s.backgroundOpacity})`,
              borderRadius: `${s.borderRadius}px`,
              border: isEvent ? "1px solid rgba(23,23,23,0.3)" : CARD_BORDER,
              boxShadow: CARD_SHADOW,
              padding: `${s.paddingY}px ${s.paddingX}px`,
              willChange: "transform, opacity",
            }}
          >
            <p
              className={`m-0 font-sans${s.uppercase ? " uppercase" : ""}`}
              style={{
                color: isEvent ? "#171717" : "#ffffff",
                fontSize: `${s.messageFontSize}px`,
                lineHeight: OVERLAY_LINE_HEIGHT_CHAT,
                letterSpacing: 0,
                fontWeight: OVERLAY_WEIGHT_BODY,
                textShadow: isEvent ? "none" : NAME_TEXT_SHADOW,
                display: "-webkit-box",
                WebkitLineClamp: s.maxLines + 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
              }}
            >
              <span
                style={{
                  color: nameColor,
                  fontSize: isEvent ? `${s.messageFontSize}px` : `${s.usernameFontSize}px`,
                  fontWeight: OVERLAY_WEIGHT_LABEL,
                }}
              >
                {item.kind === "event" ? item.label : item.username}:
              </span>{" "}
              <span>
                {item.kind === "event"
                  ? item.message
                  : renderContent(item.message, item.emotes, s.showEmotes, s.messageFontSize)}
              </span>
            </p>
          </div>
        )
      })}
    </div>
  )
}
