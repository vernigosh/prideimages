"use client"

import { useEffect, useState, useRef } from "react"
import { SPIN_BOX_CARD_STYLE, SPIN_BOX_COLORS } from "@/lib/spin-box"

interface Trick {
  name: string
  definition: string
}

interface SpinningWheelProps {
  tricks: Trick[]
  isSpinning: boolean
  onSpinComplete: (trick: Trick) => void
}

export function SpinningWheel({ tricks, isSpinning, onSpinComplete }: SpinningWheelProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (isSpinning && listRef.current) {
      const itemHeight = 60
      const totalItems = tricks.length
      const repetitions = Math.ceil(15000 / (totalItems * itemHeight))
      const randomIndex = Math.floor(Math.random() * totalItems)
      const finalPosition = (repetitions * totalItems + randomIndex) * itemHeight

      let startTime: number
      const duration = 8000

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        const easeOut = 1 - Math.pow(1 - progress, 4)
        const currentPosition = finalPosition * easeOut

        setScrollPosition(currentPosition)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setScrollPosition(finalPosition)
          const selectedTrick = tricks[randomIndex]
          setTimeout(() => {
            onSpinComplete(selectedTrick)
          }, 500)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [isSpinning, tricks, onSpinComplete])

  const extendedTricks = Array(20).fill(tricks).flat()

  return (
    <div className="w-full h-full">
      <div className="flex h-full flex-col justify-center gap-3 px-5 py-4" style={SPIN_BOX_CARD_STYLE}>
        <div className="flex items-center justify-between gap-4">
          <h2
            className="font-sans text-2xl font-semibold uppercase leading-none"
            style={{ color: SPIN_BOX_COLORS.accent }}
          >
            DJ Technique Challenge
          </h2>
          <span
            className="font-sans text-sm font-semibold uppercase leading-none transition-opacity duration-300"
            style={{
              color: SPIN_BOX_COLORS.text,
              opacity: isSpinning ? 0.9 : 0,
            }}
          >
            <span className="animate-pulse">Spinning</span>
          </span>
        </div>

        <div
          className="relative flex flex-1 items-center overflow-hidden rounded-lg px-3"
          style={{
            background: SPIN_BOX_COLORS.windowBg,
            border: SPIN_BOX_COLORS.windowBorder,
          }}
        >
          <div className="relative h-[60px] w-full overflow-hidden">
            <ul
              ref={listRef}
              className="absolute m-0 w-full list-none p-0"
              style={{
                transform: `translateY(-${scrollPosition}px)`,
                transition: isSpinning ? "none" : "transform 0.3s ease",
              }}
            >
              {extendedTricks.map((trick, index) => (
                <li
                  key={index}
                  className="flex h-[60px] items-center justify-center px-8 text-center font-sans text-2xl font-semibold leading-tight"
                  style={{ color: SPIN_BOX_COLORS.text }}
                >
                  {trick.name}
                </li>
              ))}
            </ul>
          </div>

          <div
            aria-hidden="true"
            className="absolute left-2 top-1/2 h-0 w-0 -translate-y-1/2"
            style={{
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: `10px solid ${SPIN_BOX_COLORS.accent}`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
