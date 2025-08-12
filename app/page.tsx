"use client"

import { useState, useEffect } from "react"
import { SpinningWheel } from "@/components/spinning-wheel"
import { AdminInterface } from "@/components/admin-interface"
import { ResultDisplay } from "@/components/result-display"

// DJ Tricks data with definitions
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
  { name: "Quick Cut", definition: "Sharp, immediate cut between tracks without blending" },
  { name: "Reverb Throw", definition: "Add reverb before cutting to create space and atmosphere" },
  { name: "Scratch Transition", definition: "Use turntable scratching techniques to transition between tracks" },
  { name: "Slip Mode Tricks", definition: "Use slip mode to manipulate audio while maintaining timeline" },
  { name: "Stutter Effect", definition: "Create stuttering rhythm using beat effects or manual techniques" },
  { name: "Transform Scratch", definition: "Use crossfader to create rhythmic on/off patterns while scratching" },
  { name: "Vinyl Brake", definition: "Simulate vinyl stopping effect using brake/spindown" },
  { name: "Word Play", definition: "Isolate and repeat vocal phrases for creative mixing" },
  { name: "Air Horn Drop", definition: "Use air horn sample before major drop or transition" },
  { name: "Bass Drop Isolation", definition: "Cut all frequencies except bass for dramatic drop effect" },
]

export default function DJRandomizer() {
  const [tricks, setTricks] = useState(initialTricks)
  const [isVisible, setIsVisible] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedTrick, setSelectedTrick] = useState<{ name: string; definition: string } | null>(null)
  const [showResult, setShowResult] = useState(false)

  // Simulate chat command integration
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

    // The spinner will call onSpinComplete when it's done
  }

  const handleHide = () => {
    setIsVisible(false)
    setIsSpinning(false)
    setShowResult(false)
    setSelectedTrick(null)
  }

  const addTrick = (name: string, definition: string) => {
    setTricks([...tricks, { name, definition }])
  }

  const removeTrick = (index: number) => {
    setTricks(tricks.filter((_, i) => i !== index))
  }

  const updateTrick = (index: number, name: string, definition: string) => {
    const updatedTricks = [...tricks]
    updatedTricks[index] = { name, definition }
    setTricks(updatedTricks)
  }

  return (
    <div className="min-h-screen">
      {/* OBS Overlay Section - Top Half - Transparent Background */}
      <div className="h-screen flex items-center justify-center relative">
        {isVisible && (
          <>
            <SpinningWheel
              tricks={tricks}
              isSpinning={isSpinning}
              onSpinComplete={(trick) => {
                setSelectedTrick(trick)
                setIsSpinning(false)
                setShowResult(true)

                // Hide result after 2 minutes
                setTimeout(() => {
                  setShowResult(false)
                  setIsVisible(false)
                }, 120000)
              }}
            />
            {showResult && selectedTrick && <ResultDisplay trick={selectedTrick} />}
          </>
        )}
      </div>

      {/* Separator Line */}
      <div className="border-t-4 border-black"></div>

      {/* Status Text - Below the line, above admin */}
      <div className="py-8 text-center" style={{ backgroundColor: "#ffb8ad" }}>
        <p className="text-xl text-black/70">Press Ctrl+S to simulate !spin command</p>
        <p className="text-sm mt-2 text-black/70">Waiting for chat command...</p>
      </div>

      {/* Admin Interface - Bottom Section */}
      <div className="min-h-screen bg-white">
        <AdminInterface tricks={tricks} onAddTrick={addTrick} onRemoveTrick={removeTrick} onUpdateTrick={updateTrick} />
      </div>
    </div>
  )
}
