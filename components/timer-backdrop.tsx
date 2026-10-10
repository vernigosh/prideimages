/**
 * Soft radial shade behind a timer so the white ring and text stay legible over
 * light backgrounds. Absolutely positioned and pointer-transparent, so it adds no
 * layout size and doesn't shift the measured edges used for chat placement.
 * The parent must be `relative isolate`.
 */
export function TimerBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-10 -z-10"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(10,10,12,0.6) 0%, rgba(10,10,12,0.4) 45%, rgba(10,10,12,0) 72%)",
      }}
    />
  )
}
