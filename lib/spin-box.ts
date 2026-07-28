// Shared geometry + palette for the DJ technique spin box.
//
// The spin box is a 3D flip card: the SpinningWheel is the front face and the
// ResultDisplay is the back face. Both faces and the flip container in
// app/page.tsx must agree on the exact same dimensions or the flip breaks and
// the two faces visibly misalign, so those values live here as the single
// source of truth.

export const SPIN_BOX_WIDTH = 600
export const SPIN_BOX_HEIGHT = 200

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

// Shared card shell so both faces render identically.
export const SPIN_BOX_CARD_STYLE = {
  width: `${SPIN_BOX_WIDTH}px`,
  height: `${SPIN_BOX_HEIGHT}px`,
  background: SPIN_BOX_COLORS.cardBg,
  border: SPIN_BOX_COLORS.cardBorder,
  boxShadow: SPIN_BOX_COLORS.cardShadow,
  borderRadius: "12px",
} as const
