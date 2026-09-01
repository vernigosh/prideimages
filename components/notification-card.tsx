"use client"

import type { ReactNode } from "react"
import { OVERLAY_WEIGHT_PRIMARY, OVERLAY_WEIGHT_LABEL, OVERLAY_WEIGHT_BODY } from "@/lib/overlay-typography"

/**
 * Shared notification box for celebrations and work-timer phase changes.
 *
 * Why this exists: celebrations used to paint `fixed inset-0` tint washes and place
 * text with fixed offsets like `-mt-72`. Both assume a landscape canvas, so the same
 * overlay reads completely differently in vertical. A centered, self-sizing box works
 * in either orientation because it never depends on the canvas aspect ratio.
 *
 * Styling deliberately mirrors the chat cards in chat-overlay.tsx so notifications
 * read as the same family, just larger to carry announcement-sized text.
 */

const CARD_BG = "rgba(10, 10, 12, 0.88)"
const CARD_BORDER = "1px solid rgba(255,255,255,0.14)"
const CARD_SHADOW = "0 8px 24px rgba(0,0,0,0.45)"
const TEXT_SHADOW = "0 1px 2px rgba(0,0,0,0.85)"

/** Exported so one-off notifications (easter egg) can match without this layout. */
export const NOTIFICATION_CARD_STYLE = {
  backgroundColor: CARD_BG,
  border: CARD_BORDER,
  borderRadius: "16px",
  boxShadow: CARD_SHADOW,
} as const

/**
 * pixelrainbow.gif is a 480x480 canvas whose visible art is a short band around rows
 * ~318-348; the rest is transparent padding. Floating over a live scene that padding
 * was invisible, but inside a notification box it renders as a large dead gap between
 * the gif and the text.
 *
 * This shows a window over just the art band and scales the gif up so the rainbow
 * reads at a usable size. The crop is vertical only (full width, generous band) so
 * animation frames that move horizontally are never clipped.
 */
export function CroppedRainbow({ height = 72 }: { height?: number }) {
  const NATURAL = 480
  const BAND_TOP = 316
  const BAND_HEIGHT = 34
  // The art also sits in the left ~third of the canvas, so the window is narrowed
  // and offset horizontally too, keeping the rainbow centered in the card.
  const BAND_LEFT = 8
  const BAND_WIDTH = 120
  const scale = height / BAND_HEIGHT

  return (
    <div
      className="overflow-hidden"
      style={{ width: BAND_WIDTH * scale, height, maxWidth: "100%" }}
      role="img"
      aria-label="Rainbow celebration"
    >
      <img
        src="/images/pixelrainbow.gif"
        alt=""
        aria-hidden="true"
        style={{
          imageRendering: "pixelated",
          width: NATURAL * scale,
          height: NATURAL * scale,
          marginTop: -BAND_TOP * scale,
          marginLeft: -BAND_LEFT * scale,
          display: "block",
        }}
      />
    </div>
  )
}

export interface NotificationLine {
  text: string
  color?: string
  size?: "display" | "title" | "body"
}

const SIZES = {
  display: { fontSize: 44, fontWeight: OVERLAY_WEIGHT_PRIMARY, lineHeight: 1.05 },
  title: { fontSize: 32, fontWeight: OVERLAY_WEIGHT_LABEL, lineHeight: 1.15 },
  body: { fontSize: 24, fontWeight: OVERLAY_WEIGHT_BODY, lineHeight: 1.25 },
} as const

interface NotificationCardProps {
  /** Drives the fade. Kept mounted while fading so the transition can play. */
  visible: boolean
  /** Optional gif/image shown above the text. */
  media?: ReactNode
  lines: NotificationLine[]
  /** Matched to each caller's existing fade timing. */
  fadeMs?: number
  zIndex?: number
  /** Applied to the card, for callers with their own entrance animation. */
  cardAnimation?: string
}

export function NotificationCard({
  visible,
  media,
  lines,
  fadeMs = 1000,
  zIndex = 50,
  cardAnimation,
}: NotificationCardProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 flex items-center justify-center"
      style={{
        zIndex,
        opacity: visible ? 1 : 0,
        transition: `opacity ${fadeMs}ms ease-in-out`,
      }}
    >
      <div
        className="flex flex-col items-center gap-3 overflow-hidden text-center"
        style={{
          // min() keeps the box inside a narrow vertical canvas and stops it
          // stretching absurdly wide on ultrawide horizontal scenes.
          width: "min(90vw, 720px)",
          maxHeight: "85vh",
          padding: "32px 40px",
          animation: cardAnimation,
          ...NOTIFICATION_CARD_STYLE,
        }}
      >
        {media}
        {lines.map((line, i) => {
          const size = SIZES[line.size ?? "title"]
          return (
            <p
              key={i}
              className="m-0 font-sans uppercase text-balance"
              style={{
                color: line.color ?? "#ffffff",
                textShadow: TEXT_SHADOW,
                letterSpacing: 0,
                ...size,
              }}
            >
              {line.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default NotificationCard
