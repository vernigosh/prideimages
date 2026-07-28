import {
  OVERLAY_FONT_STANDARD,
  OVERLAY_LETTER_SPACING,
  OVERLAY_LINE_HEIGHT_STANDARD,
  OVERLAY_WEIGHT_BODY,
  OVERLAY_WEIGHT_LABEL,
} from "@/lib/overlay-typography"

// Shared geometry + palette for the DJ technique spin box.
//
// The spin box is a 3D flip card: the SpinningWheel is the front face and the
// ResultDisplay is the back face. Both faces and the flip container in
// app/page.tsx must agree on the exact same dimensions or the flip breaks and
// the two faces visibly misalign, so those values live here as the single
// source of truth.

export const SPIN_BOX_WIDTH = 600
// Tall enough to fit the shared 32px STANDARD type at readable line heights:
// heading + reel/definition window + footer line.
export const SPIN_BOX_HEIGHT = 260

// Height of a single row in the scrolling reel. The reel viewport is locked to
// this so exactly one trick is visible at a time, and the spin animation steps
// by this value.
export const SPIN_BOX_REEL_ITEM_HEIGHT = 64

// Distance from the top / left edge of the 1920x1080 stream frame to the
// outer edge of the box. Tuned to clear the overhead camera scene.
export const SPIN_BOX_TOP = 110
export const SPIN_BOX_LEFT = 50

// Brand palette (vernigosh): near-black card, tomato accent, off-white text.
export const SPIN_BOX_COLORS = {
  cardBg: "rgba(10, 10, 12, 0.88)",
  cardBorder: "1px solid rgba(255, 255, 255, 0.12)",
  cardShadow: "0 4px 16px rgba(0, 0, 0, 0.45)",
  windowBg: "rgba(255, 255, 255, 0.06)",
  windowBorder: "1px solid rgba(255, 255, 255, 0.14)",
  accent: "#ff563f",
  text: "#f5f2ef",
} as const

// Typography comes from the shared overlay standard so the spin box reads at
// the same size as every other announcement / notification on stream.
// Hierarchy is expressed with weight and color, never with smaller type.
export const SPIN_BOX_TEXT = {
  heading: {
    fontSize: `${OVERLAY_FONT_STANDARD}px`,
    lineHeight: OVERLAY_LINE_HEIGHT_STANDARD,
    letterSpacing: `${OVERLAY_LETTER_SPACING}px`,
    fontWeight: OVERLAY_WEIGHT_LABEL,
    color: SPIN_BOX_COLORS.accent,
  },
  item: {
    fontSize: `${OVERLAY_FONT_STANDARD}px`,
    lineHeight: OVERLAY_LINE_HEIGHT_STANDARD,
    letterSpacing: `${OVERLAY_LETTER_SPACING}px`,
    fontWeight: OVERLAY_WEIGHT_LABEL,
    color: SPIN_BOX_COLORS.text,
  },
  body: {
    fontSize: `${OVERLAY_FONT_STANDARD}px`,
    lineHeight: OVERLAY_LINE_HEIGHT_STANDARD,
    letterSpacing: `${OVERLAY_LETTER_SPACING}px`,
    fontWeight: OVERLAY_WEIGHT_BODY,
    color: SPIN_BOX_COLORS.text,
  },
  footer: {
    fontSize: `${OVERLAY_FONT_STANDARD}px`,
    lineHeight: OVERLAY_LINE_HEIGHT_STANDARD,
    letterSpacing: `${OVERLAY_LETTER_SPACING}px`,
    fontWeight: OVERLAY_WEIGHT_BODY,
    color: SPIN_BOX_COLORS.accent,
  },
} as const

// Shared card shell so both faces render identically.
export const SPIN_BOX_CARD_STYLE = {
  width: `${SPIN_BOX_WIDTH}px`,
  height: `${SPIN_BOX_HEIGHT}px`,
  background: SPIN_BOX_COLORS.cardBg,
  border: SPIN_BOX_COLORS.cardBorder,
  boxShadow: SPIN_BOX_COLORS.cardShadow,
  borderRadius: "12px",
} as const
