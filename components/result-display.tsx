"use client"

import { SPIN_BOX_CARD_STYLE, SPIN_BOX_COLORS, SPIN_BOX_TEXT } from "@/lib/spin-box"

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
        <h2 className="font-sans uppercase text-balance" style={SPIN_BOX_TEXT.heading}>
          {trick.name}
        </h2>

        <div
          className="flex flex-1 items-center overflow-hidden rounded-lg px-3"
          style={{
            background: SPIN_BOX_COLORS.windowBg,
            border: SPIN_BOX_COLORS.windowBorder,
          }}
        >
          <p className="font-sans text-pretty" style={SPIN_BOX_TEXT.body}>
            {trick.definition}
          </p>
        </div>

        <div className="font-sans uppercase" style={SPIN_BOX_TEXT.footer}>
          Accepted, you have 2 minutes.
        </div>
      </div>
    </div>
  )
}
