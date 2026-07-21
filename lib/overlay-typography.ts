// Shared overlay typography system.
//
// The on-stream overlay uses a strict two-size system, with one optional third
// size reserved for chat only:
//   - DISPLAY (60px): primary numbers / major temporary headings
//   - STANDARD (32px): all labels, messages, usernames, locations, descriptions
//   - CHAT (30px): optional, only if 32px prevents two chat lines fitting
//
// These constants are the single source of truth for component default/reset
// values. Runtime-configurable settings still override them, but their defaults
// should reference these values so the whole overlay stays consistent.

export const OVERLAY_FONT_DISPLAY = 60
export const OVERLAY_FONT_STANDARD = 32
export const OVERLAY_FONT_CHAT = 30

export const OVERLAY_LINE_HEIGHT_DISPLAY = 1
export const OVERLAY_LINE_HEIGHT_STANDARD = 1.2
export const OVERLAY_LINE_HEIGHT_CHAT = 1.25

export const OVERLAY_LETTER_SPACING = 0

// Font weights: use weight (not size) to establish hierarchy.
export const OVERLAY_WEIGHT_PRIMARY = 700 // primary numbers / major headings
export const OVERLAY_WEIGHT_LABEL = 600 // labels / usernames
export const OVERLAY_WEIGHT_BODY = 500 // message / supporting text

// Shared card system (popup / chat / garden activity).
export const OVERLAY_CARD = {
  borderRadius: 12,
  background: "rgba(10, 10, 12, 0.76)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
  paddingX: 22,
  paddingY: 16,
} as const
