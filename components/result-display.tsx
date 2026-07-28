"use client"

import { SPIN_BOX_CARD_STYLE, SPIN_BOX_COLORS } from "@/lib/spin-box"

interface Trick {
  name: string
  definition: string
}

interface ResultDisplayProps {
  trick: Trick
}

export function ResultDisplay({ trick }: ResultDisplayProps) {
  return (
    <div className="w-full h-full">
      <div className="flex h-full flex-col justify-center gap-2 px-5 py-4" style={SPIN_BOX_CARD_STYLE}>
        <h2
          className="font-sans text-2xl font-semibold uppercase leading-none"
          style={{ color: SPIN_BOX_COLORS.accent }}
        >
          {trick.name}
        </h2>

        <div
          className="flex flex-1 items-center overflow-hidden rounded-lg px-3"
          style={{
            background: SPIN_BOX_COLORS.windowBg,
            border: SPIN_BOX_COLORS.windowBorder,
          }}
        >
          <p
            className="font-sans text-xl font-medium leading-snug text-pretty"
            style={{ color: SPIN_BOX_COLORS.text }}
          >
            {trick.definition}
          </p>
        </div>

        <div
          className="font-sans text-sm font-semibold uppercase leading-none"
          style={{ color: SPIN_BOX_COLORS.accent }}
        >
          Accepted, you have 2 minutes.
        </div>
      </div>
    </div>
  )
}
