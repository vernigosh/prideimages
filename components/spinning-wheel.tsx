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
      const itemHeight = 60
      const totalItems = tricks.length
      const repetitions = Math.ceil(15000 / (totalItems * itemHeight))
      const randomIndex = Math.floor(Math.random() * totalItems)
      const finalPosition = (repetitions * totalItems + randomIndex) * itemHeight

      console.log("[v0] SpinningWheel: Total tricks available:", totalItems)
      console.log("[v0] SpinningWheel: Random index selected:", randomIndex)
      console.log("[v0] SpinningWheel: Selected trick:", tricks[randomIndex]?.name)

      let startTime: number
      const duration = 8000 // Reduced from 12000 for more consistent timing

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
          // Ensure we're exactly on the selected item
          setScrollPosition(finalPosition)
          const selectedTrick = tricks[randomIndex]
          console.log("[v0] SpinningWheel: Final selected trick:", selectedTrick?.name)
          // Add a small delay to ensure the final position is visible
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
    <div className="absolute left-8 top-1/2 -translate-y-1/2">
      <div
        className="rounded-3xl p-4 shadow-2xl border-2 border-black"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 184, 173, 0.8) 0%, rgba(255, 154, 139, 0.8) 50%, rgba(255, 122, 107, 0.8) 100%)",
          width: "600px",
          height: "200px",
        }}
      >
        <div className="text-center h-full flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-black mb-2 uppercase font-sans">DJ TECHNIQUE CHALLENGE</h2>

          <div className="rounded-xl p-3 relative border-2 border-black bg-white flex-1 flex items-center">
            <div className="relative w-full h-[60px] overflow-hidden">
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
                      className="h-[60px] flex items-center justify-center text-center text-black font-bold text-xl md:text-2xl px-6 font-sans"
                    >
                      {trick.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[15px] border-l-transparent border-r-transparent border-b-black drop-shadow-lg rotate-90"></div>
              </div>
            </div>
          </div>

          {isSpinning && (
            <div className="mt-3">
              <div className="text-black text-4xl font-bold animate-pulse mb-1 uppercase font-sans">SPINNING...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
