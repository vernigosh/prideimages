"use client"

import { useEffect, useState, useRef } from "react"

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
  const tickerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (isSpinning && listRef.current) {
      const itemHeight = 120
      const totalItems = tricks.length

      const repetitions = Math.ceil(15000 / (totalItems * itemHeight))
      const randomIndex = Math.floor(Math.random() * totalItems)
      const finalPosition = (repetitions * totalItems + randomIndex) * itemHeight

      let startTime: number
      const duration = 12000

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
          const selectedTrick = tricks[randomIndex]
          onSpinComplete(selectedTrick)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [isSpinning, tricks, onSpinComplete])

  const extendedTricks = Array(20).fill(tricks).flat()

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-brand-black/20 backdrop-blur-sm">
      <div
        style={{ backgroundColor: "#ffb8ad" }}
        className="rounded-3xl p-8 w-full max-w-5xl mx-4 shadow-2xl border-4 border-brand-black"
      >
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-brand-black font-sans mb-6">DJ Trick Spinner</h2>

          <div style={{ backgroundColor: "#ffffff" }} className="rounded-xl p-6 relative border-2 border-brand-black">
            <div className="relative w-full h-[120px] overflow-hidden">
              <div
                ref={tickerRef}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-[120px] overflow-hidden"
              >
                <ul
                  ref={listRef}
                  className="list-none p-0 m-0 absolute w-full"
                  style={{
                    transform: `translateY(-${scrollPosition}px)`,
                    transition: isSpinning ? "none" : "transform 0.3s ease",
                  }}
                >
                  {extendedTricks.map((trick, index) => (
                    <li
                      key={index}
                      className="h-[120px] leading-[120px] text-center text-brand-black font-bold text-5xl px-16 font-sans"
                    >
                      {trick.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
                <div className="w-0 h-0 border-l-[25px] border-r-[25px] border-b-[30px] border-l-transparent border-r-transparent border-b-brand-black drop-shadow-lg rotate-90"></div>
              </div>
            </div>
          </div>

          {isSpinning && (
            <div className="mt-6">
              <div className="text-brand-black text-3xl font-bold animate-pulse mb-2 font-sans">SPINNING...</div>
              <div className="text-brand-black text-xl font-semibold font-sans">Finding your next challenge!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
