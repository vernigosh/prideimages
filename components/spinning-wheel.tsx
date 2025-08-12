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
      const itemHeight = 80
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
    <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 max-w-4xl mx-4 shadow-2xl animate-in zoom-in duration-500">
        <div className="relative w-full h-[200px] bg-black/20 rounded-xl overflow-hidden">
          <div
            ref={tickerRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] h-[80px] bg-black/30 rounded-xl overflow-hidden"
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
                <li key={index} className="h-[80px] leading-[80px] text-center text-black font-bold text-3xl px-4">
                  {trick.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute top-1/2 left-12 transform -translate-y-1/2">
            <div className="w-0 h-0 border-t-[20px] border-b-[20px] border-r-[25px] border-t-transparent border-b-transparent border-r-black drop-shadow-lg"></div>
          </div>
        </div>
        {isSpinning && (
          <div className="mt-6 text-center">
            <div className="text-black text-2xl font-bold animate-pulse">SPINNING...</div>
            <div className="text-black/70 text-lg">Finding your next challenge!</div>
          </div>
        )}
      </div>
    </div>
  )
}
