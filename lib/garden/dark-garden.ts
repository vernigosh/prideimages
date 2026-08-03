// Dark Vernigosh garden treatment. Single source of truth for the visual values so
// the garden component stays readable and the look can be tuned in one place.
//
// ─── FLAME ASSETS ───────────────────────────────────────────────────────────────
// One pixel-art flame GIF drives every anchor, living beside the existing rain.gif
// and bunny GIFs. To add more variety later, drop extra GIFs in the same folder and
// point individual FLAME_ANCHORS entries at them — nothing else needs to change.
//
// Note on desync: identical GIFs decoded from one cached file animate close to in
// step, and CSS `animation-delay` cannot offset GIF frames. So the anchors below are
// differentiated by the things that DO work on a GIF — scale, mirroring, and a small
// brightness/saturation shift — rather than by timing alone.
// ────────────────────────────────────────────────────────────────────────────────

export const FLAME_ASSETS = {
  red: "/garden/effects/red-fire.gif",
} as const

export interface FlameAnchor {
  id: string
  src: string
  /** Percent across the garden band, matching how flowers are positioned. */
  x: number
  /** Rendered height in px. Width scales naturally. */
  height: number
  /** Fine vertical seating against the garden baseline, in px. */
  bottom: number
  /** Staggered so the group never pulses in unison as it fades in. */
  delayMs: number
  /** Mirrored horizontally, so repeated assets don't read as clones. */
  flip?: boolean
  /**
   * Per-flame tone shift. The single shared GIF would otherwise look like five
   * identical stamps; nudging brightness and saturation makes some read as hotter
   * and nearer, others as dimmer and further back.
   */
  filter?: string
}

// Five ambient flames. Deliberately spread across the full width (no corner
// clustering) and kept clear of the horizontal centre band where the activity feed
// sits above the garden. Sizes vary so the group reads as scattered, not as a row.
export const FLAME_ANCHORS: FlameAnchor[] = [
  { id: "flame-a", src: FLAME_ASSETS.red, x: 8, height: 78, bottom: 0, delayMs: 0 },
  {
    id: "flame-b",
    src: FLAME_ASSETS.red,
    x: 27,
    height: 52,
    bottom: 6,
    delayMs: 140,
    flip: true,
    // Smaller and cooler: reads as sitting further back.
    filter: "brightness(0.78) saturate(0.9)",
  },
  { id: "flame-c", src: FLAME_ASSETS.red, x: 49, height: 88, bottom: -2, delayMs: 60, filter: "brightness(1.08)" },
  {
    id: "flame-d",
    src: FLAME_ASSETS.red,
    x: 71,
    height: 58,
    bottom: 8,
    delayMs: 210,
    flip: true,
    filter: "brightness(0.84) saturate(0.95)",
  },
  { id: "flame-e", src: FLAME_ASSETS.red, x: 90, height: 72, bottom: 0, delayMs: 90, flip: true },
]

/** Shared fade duration for flowers, flames, and the mood tint. */
export const DARK_TRANSITION_MS = 520

/**
 * Pushes every flower toward the same dark crimson regardless of its source hue.
 *
 * `sepia` first collapses the garden's pinks, blues, yellows, and whites onto one
 * warm tone; `saturate` + `hue-rotate` then drive that tone to crimson. A plain
 * `hue-rotate` alone was rejected because it maps each source hue differently —
 * the blue orchids and red tulips would have landed on completely different
 * colours, and some would have gone green. Luminance detail survives, so petals
 * and stems still read clearly, and the brightness floor keeps them from going
 * muddy brown or black. No blur, so it stays cheap in OBS.
 */
export const DARK_FLOWER_FILTER = "sepia(1) saturate(7) hue-rotate(-38deg) brightness(0.62) contrast(1.1)"

/**
 * Bottom-anchored crimson glow rather than a flat overlay rectangle.
 *
 * The garden canvas is transparent — it composites straight over the deck camera —
 * so a uniform tint would darken the video feed and leave a hard-edged band across
 * the frame. Fading to fully transparent at the top makes it read as firelight
 * rising from the flames instead.
 */
export const DARK_GARDEN_TINT =
  "linear-gradient(to top, rgba(122, 10, 18, 0.38) 0%, rgba(122, 10, 18, 0.16) 45%, rgba(122, 10, 18, 0) 100%)"
