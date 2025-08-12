"use client"

import { useState, useEffect } from "react"
import { SpinningWheel } from "@/components/spinning-wheel"
import { AdminInterface } from "@/components/admin-interface"
import { ResultDisplay } from "@/components/result-display"
import { ChatIntegration } from "@/components/chat-integration"
import { TimeOverlay } from "@/components/time-overlay"
import { OverlaySettings } from "@/components/overlay-settings"
import { WorkTimer } from "@/components/work-timer"
import { SocialTimer } from "@/components/social-timer"

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
  const [chatConnected, setChatConnected] = useState(false)
  const [lastCommand, setLastCommand] = useState<string>("")

  // Time overlay settings
  const [showTimeOverlay, setShowTimeOverlay] = useState(true)
  const [timePosition, setTimePosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">(
    "top-right",
  )
  const [timeZone, setTimeZone] = useState("America/New_York")
  const [timeFontSize, setTimeFontSize] = useState(48)
  const [showSeconds, setShowSeconds] = useState(false)
  const [textColor, setTextColor] = useState("#ffffff")
  const [shadowColor, setShadowColor] = useState("#000000")
  const [shadowSize, setShadowSize] = useState(2)
  const [fontWeight, setFontWeight] = useState<"normal" | "bold" | "black">("bold")
  const [overlayBackground, setOverlayBackground] = useState<"transparent" | "black">("transparent")

  // Work timer settings
  const [showWorkTimer, setShowWorkTimer] = useState(false)
  const [workTimerConnected, setWorkTimerConnected] = useState(false)

  // Social timer settings
  const [showSocialTimer, setShowSocialTimer] = useState(false)
  const [socialTimerConnected, setSocialTimerConnected] = useState(false)

  // Simulate chat command integration
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "s" && e.ctrlKey) {
        e.preventDefault()
        handleSpin("Manual Test")
      }
      if (e.key === "h" && e.ctrlKey) {
        e.preventDefault()
        handleHide("Manual Test")
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  const handleSpin = (username: string) => {
    if (isSpinning) return

    // Hide work timer if active when spinning
    if (showWorkTimer) {
      setShowWorkTimer(false)
    }

    setIsVisible(true)
    setIsSpinning(true)
    setShowResult(false)
    setSelectedTrick(null)
    setLastCommand(`!spin by ${username}`)
  }

  const handleHide = (username: string) => {
    setIsVisible(false)
    setIsSpinning(false)
    setShowResult(false)
    setSelectedTrick(null)
    setLastCommand(`!hidespin by ${username}`)

    // Show work timer again if it was hidden
    if (workTimerConnected) {
      setShowWorkTimer(true)
    }
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

  // Determine which upper-left element to show (DJ Spinner only)
  const getUpperLeftElement = () => {
    if (isVisible) {
      return (
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
      )
    }
    return null
  }

  // Determine which right-side element to show (Social Timer > Work Timer)
  const getRightSideElement = () => {
    if (showSocialTimer) {
      return (
        <SocialTimer
          isVisible={showSocialTimer}
          onConnectionChange={setSocialTimerConnected}
          onHide={() => setShowSocialTimer(false)}
        />
      )
    }

    if (showWorkTimer) {
      return (
        <WorkTimer
          isVisible={showWorkTimer}
          onConnectionChange={setWorkTimerConnected}
          onHide={() => setShowWorkTimer(false)}
        />
      )
    }

    return null
  }

  return (
    <div className="min-h-screen">
      {/* OBS Overlay Section */}
      <div
        className={`h-screen flex items-center justify-center relative ${
          overlayBackground === "black" ? "bg-black" : ""
        }`}
      >
        {/* Time Overlay */}
        {showTimeOverlay && (
          <TimeOverlay
            position={timePosition}
            timeZone={timeZone}
            fontSize={timeFontSize}
            showSeconds={showSeconds}
            textColor={textColor}
            shadowColor={shadowColor}
            shadowSize={shadowSize}
            fontWeight={fontWeight}
          />
        )}

        {/* Upper Left Elements (DJ Spinner only) */}
        {getUpperLeftElement()}

        {/* Right Side Elements (Social Timer or Work Timer) */}
        {getRightSideElement()}
      </div>

      {/* Separator Line */}
      <div className="border-t-4 border-black"></div>

      {/* Status Text - Below the line, above admin */}
      <div className="py-8 text-center" style={{ backgroundColor: "#ffb8ad" }}>
        <h2 className="text-3xl font-bold text-black mb-4">🎮 Unified Stream Overlay 🎮</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-8xl mx-auto">
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">⏰ Time Display</h3>
            <p className="text-black/70">
              {showTimeOverlay ? `Showing in ${timePosition.replace("-", " ")}` : "Hidden"}
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">⏱️ Work Timer</h3>
            <p className="text-black/70">
              {showWorkTimer ? (workTimerConnected ? "Ready for commands" : "Connecting...") : "Hidden"}
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">📱 Social Timer</h3>
            <p className="text-black/70">
              {showSocialTimer ? (socialTimerConnected ? "Ready for commands" : "Connecting...") : "Hidden"}
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">🎵 DJ Spinner</h3>
            <p className="text-black/70">{chatConnected ? "Ready for chat commands" : "Manual mode only"}</p>
          </div>
        </div>
        <p className="text-lg text-black/70 mt-4">One overlay source for multiple stream elements!</p>
        <p className="text-sm text-black/50 mt-2">
          Background: {overlayBackground === "transparent" ? "Transparent (Stream Ready)" : "Black (Editing Mode)"}
        </p>
      </div>

      {/* Unified Overlay Settings */}
      <OverlaySettings
        showTimeOverlay={showTimeOverlay}
        setShowTimeOverlay={setShowTimeOverlay}
        timePosition={timePosition}
        setTimePosition={setTimePosition}
        timeZone={timeZone}
        setTimeZone={setTimeZone}
        timeFontSize={timeFontSize}
        setTimeFontSize={setTimeFontSize}
        showSeconds={showSeconds}
        setShowSeconds={setShowSeconds}
        textColor={textColor}
        setTextColor={setTextColor}
        shadowColor={shadowColor}
        setShadowColor={setShadowColor}
        shadowSize={shadowSize}
        setShadowSize={setShadowSize}
        fontWeight={fontWeight}
        setFontWeight={setFontWeight}
        showWorkTimer={showWorkTimer}
        setShowWorkTimer={setShowWorkTimer}
        workTimerConnected={workTimerConnected}
        showSocialTimer={showSocialTimer}
        setShowSocialTimer={setShowSocialTimer}
        socialTimerConnected={socialTimerConnected}
        overlayBackground={overlayBackground}
        setOverlayBackground={setOverlayBackground}
        chatConnected={chatConnected}
        lastCommand={lastCommand}
      />

      {/* Chat Integration Setup */}
      <div className="bg-white border-b-4 border-black">
        <ChatIntegration onSpin={handleSpin} onHide={handleHide} onConnectionChange={setChatConnected} />
      </div>

      {/* Admin Interface - Bottom Section */}
      <div className="min-h-screen bg-white">
        <AdminInterface tricks={tricks} onAddTrick={addTrick} onRemoveTrick={removeTrick} onUpdateTrick={updateTrick} />
      </div>
    </div>
  )
}
