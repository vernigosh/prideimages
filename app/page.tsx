"use client"

import { useState, useEffect } from "react"
import { SpinningWheel } from "@/components/spinning-wheel"
import { ResultDisplay } from "@/components/result-display"

const initialTricks = [
  { name: "Backspin + Echo", definition: "Reverse the track while adding echo effect for dramatic transition" },
  { name: "Beat Chopping", definition: "Cut and rearrange beats using hot cues for rhythmic variation" },
  { name: "Beatmatching (Manual)", definition: "Manually sync BPM without sync button using pitch fader" },
  { name: "Big Echo Out", definition: "End track with heavy echo/delay effect for smooth fadeout" },
  { name: "Double Drop", definition: "Drop two tracks simultaneously at their peak moments" },
  { name: "Filter Sweep", definition: "Use high/low pass filters to create sweeping transition effects" },
  { name: "Flanger Effect", definition: "Apply flanger for whooshing metallic sound during transitions" },
  { name: "Hot Cue Juggling", definition: "Use hot cues to create new rhythmic patterns and loops" },
  { name: "Loop Roll", definition: "Create rolling effect by looping small sections with decreasing lengths" },
  { name: "Phrase Matching", definition: "Align musical phrases (8/16/32 bars) for seamless transitions" },
]

export default function DJRandomizer() {
  const [isVisible, setIsVisible] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedTrick, setSelectedTrick] = useState<{ name: string; definition: string } | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "s" && e.ctrlKey) {
        e.preventDefault()
        handleSpin()
      }
      if (e.key === "h" && e.ctrlKey) {
        e.preventDefault()
        handleHide()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const handleSpin = () => {
    if (isSpinning) return

    setIsVisible(true)
    setIsSpinning(true)
    setShowResult(false)
    setSelectedTrick(null)
  }

  const handleHide = () => {
    setIsVisible(false)
    setIsSpinning(false)
    setShowResult(false)
    setSelectedTrick(null)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffb8ad" }}>
      <div className="h-screen flex items-center justify-center relative">
        {isVisible && (
          <>
            <SpinningWheel
              tricks={initialTricks}
              isSpinning={isSpinning}
              onSpinComplete={(trick) => {
                setSelectedTrick(trick)
                setIsSpinning(false)
                setShowResult(true)

                setTimeout(() => {
                  setShowResult(false)
                  setIsVisible(false)
                }, 120000)
              }}
            />
            {showResult && selectedTrick && <ResultDisplay trick={selectedTrick} />}
          </>
        )}

        {!isVisible && (
          <div className="text-center text-black/70">
            <p className="text-xl">Press Ctrl+S to simulate !spin command</p>
            <p className="text-sm mt-2">Waiting for chat command...</p>
          </div>
        )}
      </div>
    </div>
  )
}
