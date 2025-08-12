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
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (isSpinning && listRef.current) {
      const itemHeight = 60 // 50% of original 120px
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
    <div className="absolute left-8 top-8">
      <div
        className="rounded-3xl p-4 shadow-2xl border-2 border-black"
        style={{
          backgroundColor: "#ffb8ad",
          width: "600px", // 50% of original 1200px
          height: "200px", // 50% of original 400px
        }}
      >
        <div className="text-center h-full flex flex-col justify-center">
          <h2 className="text-xl md:text-2xl font-bold text-black mb-2">DJ Trick Spinner</h2>

          <div className="rounded-xl p-3 relative border-2 border-black bg-white flex-1 flex items-center">
            <div className="relative w-full h-[60px] overflow-hidden">
              {" "}
              {/* 50% of original 120px */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-[60px] overflow-hidden">
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
                      className="h-[60px] flex items-center justify-center text-center text-black font-bold text-lg md:text-xl px-6"
                    >
                      {trick.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                {" "}
                {/* Reduced from left-8 */}
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[15px] border-l-transparent border-r-transparent border-b-black drop-shadow-lg rotate-90"></div>{" "}
                {/* 50% smaller arrow */}
              </div>
            </div>
          </div>

          {isSpinning && (
            <div className="mt-3">
              {" "}
              {/* Reduced from mt-6 */}
              <div className="text-black text-lg font-bold animate-pulse mb-1">SPINNING...</div>{" "}
              {/* Reduced from 5xl and mb-2 */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
