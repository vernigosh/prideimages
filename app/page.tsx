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
import { DarkTimer } from "@/components/dark-timer"

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

  // New CDJ-3000 Specific Tricks
  {
    name: "Harmonic Key Shift",
    definition: "Use CDJ-3000's key shift feature to create perfect harmonic transitions between tracks",
  },
  {
    name: "Slip Mode Scratch",
    definition: "Scratch using slip mode to manipulate audio while keeping the timeline intact",
  },
  {
    name: "Loop Shortening",
    definition: "Progressively shorten loop lengths to build intensity and create rolling effects",
  },

  // New V10 Mixer Specific Tricks
  { name: "Send FX", definition: "Use V10's send effects to add depth and space without affecting the dry signal" },
  { name: "Use Big Knobs", definition: "Utilize the V10's large parameter knobs for smooth, precise effect control" },
  { name: "Apply Filter to Master", definition: "Use the master filter on the V10 to affect the entire mix output" },
  {
    name: "Mix Only Using Trim",
    definition: "Create transitions using only the trim knobs without touching faders or EQ",
  },

  // New Genre-Specific House/Techno Tricks
  { name: "Bass Line Swap", definition: "Switch basslines between tracks while keeping the drum patterns intact" },
  { name: "Extend Breakdown", definition: "Use loops and effects to extend breakdown sections for longer build-ups" },
  {
    name: "Tension and Release",
    definition: "Build musical tension with filters/effects, then release for maximum impact",
  },
]

export default function DJRandomizer() {
  const [tricks, setTricks] = useState(initialTricks)
  const [isVisible, setIsVisible] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedTrick, setSelectedTrick] = useState<{ name: string; definition: string } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [chatConnected, setChatConnected] = useState(false)
  const [lastCommand, setLastCommand] = useState<string>("")

  // Time overlay settings - Updated defaults
  const [showTimeOverlay, setShowTimeOverlay] = useState(true)
  const [timePosition, setTimePosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">(
    "top-right",
  )
  const [timeZone, setTimeZone] = useState("Europe/Rome") // Changed default to Rome
  const [timeFontSize, setTimeFontSize] = useState(40) // Changed default from 48 to 40
  const [showSeconds, setShowSeconds] = useState(false)
  const [textColor, setTextColor] = useState("#ffffff")
  const [shadowColor, setShadowColor] = useState("#000000")
  const [shadowSize, setShadowSize] = useState(0) // Changed default from 2 to 0 (no shadow)
  const [fontWeight, setFontWeight] = useState<"normal" | "bold" | "black">("bold")
  const [overlayBackground, setOverlayBackground] = useState<"transparent" | "black">("transparent")

  // Dark timer settings
  const [showDarkTimer, setShowDarkTimer] = useState(false)
  const [darkTimerConnected, setDarkTimerConnected] = useState(false)

  // Work timer settings
  const [showWorkTimer, setShowWorkTimer] = useState(false)
  const [workTimerConnected, setWorkTimerConnected] = useState(false)

  // Social timer settings
  const [showSocialTimer, setShowSocialTimer] = useState(false)
  const [socialTimerConnected, setSocialTimerConnected] = useState(false)

  // Add event listeners for timer commands
  useEffect(() => {
    const handleStartDarkTimer = (event: CustomEvent) => {
      console.log("Page: Received startDarkTimer event", event.detail)
      if (!showDarkTimer) {
        console.log("Page: Enabling dark timer")
        setShowDarkTimer(true)
      }
    }

    const handleStartWorkTimer = (event: CustomEvent) => {
      console.log("Page: Received startWorkTimer event", event.detail)
      if (!showWorkTimer) {
        console.log("Page: Enabling work timer")
        setShowWorkTimer(true)
      }
    }

    const handleStartSocialTimer = (event: CustomEvent) => {
      console.log("Page: Received startSocialTimer event", event.detail)
      if (!showSocialTimer) {
        console.log("Page: Enabling social timer")
        setShowSocialTimer(true)
      }
    }

    const handleHideDarkTimer = (event: CustomEvent) => {
      console.log("Page: Received hideDarkTimer event", event.detail)
      setShowDarkTimer(false)
    }

    const handleHideWorkTimer = (event: CustomEvent) => {
      console.log("Page: Received hideWorkTimer event", event.detail)
      setShowWorkTimer(false)
    }

    const handleHideSocialTimer = (event: CustomEvent) => {
      console.log("Page: Received hideSocialTimer event", event.detail)
      setShowSocialTimer(false)
    }

    const handleHideAnyTimer = (event: CustomEvent) => {
      console.log("Page: Received hideAnyTimer event", event.detail)
      // Hide whichever timer is currently visible (priority order: Dark > Social > Work)
      if (showDarkTimer) {
        console.log("Page: Hiding dark timer via !hidetimer")
        setShowDarkTimer(false)
      } else if (showSocialTimer) {
        console.log("Page: Hiding social timer via !hidetimer")
        setShowSocialTimer(false)
      } else if (showWorkTimer) {
        console.log("Page: Hiding work timer via !hidetimer")
        setShowWorkTimer(false)
      } else {
        console.log("Page: No timer visible to hide")
      }
    }

    const handleResetAnyTimer = (event: CustomEvent) => {
      console.log("Page: Received resetAnyTimer event", event.detail)
      // Reset whichever timer is currently visible (priority order: Dark > Social > Work)
      if (showDarkTimer) {
        console.log("Page: Resetting dark timer via !resettimer")
        window.dispatchEvent(new CustomEvent("resetDarkTimer", { detail: event.detail }))
      } else if (showSocialTimer) {
        console.log("Page: Resetting social timer via !resettimer")
        window.dispatchEvent(new CustomEvent("resetSocialTimer", { detail: event.detail }))
      } else if (showWorkTimer) {
        console.log("Page: Resetting work timer via !resettimer")
        window.dispatchEvent(new CustomEvent("resetWorkTimer", { detail: event.detail }))
      } else {
        console.log("Page: No timer visible to reset")
      }
    }

    window.addEventListener("startDarkTimer", handleStartDarkTimer as EventListener)
    window.addEventListener("startWorkTimer", handleStartWorkTimer as EventListener)
    window.addEventListener("startSocialTimer", handleStartSocialTimer as EventListener)
    window.addEventListener("hideDarkTimer", handleHideDarkTimer as EventListener)
    window.addEventListener("hideWorkTimer", handleHideWorkTimer as EventListener)
    window.addEventListener("hideSocialTimer", handleHideSocialTimer as EventListener)
    window.addEventListener("hideAnyTimer", handleHideAnyTimer as EventListener)
    window.addEventListener("resetAnyTimer", handleResetAnyTimer as EventListener)

    return () => {
      window.removeEventListener("startDarkTimer", handleStartDarkTimer as EventListener)
      window.removeEventListener("startWorkTimer", handleStartWorkTimer as EventListener)
      window.removeEventListener("startSocialTimer", handleStartSocialTimer as EventListener)
      window.removeEventListener("hideDarkTimer", handleHideDarkTimer as EventListener)
      window.removeEventListener("hideWorkTimer", handleHideWorkTimer as EventListener)
      window.removeEventListener("hideSocialTimer", handleHideSocialTimer as EventListener)
      window.removeEventListener("hideAnyTimer", handleHideAnyTimer as EventListener)
      window.removeEventListener("resetAnyTimer", handleResetAnyTimer as EventListener)
    }
  }, [showDarkTimer, showWorkTimer, showSocialTimer])

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

    // Hide all timers when spinning
    if (showDarkTimer) setShowDarkTimer(false)
    if (showWorkTimer) setShowWorkTimer(false)
    if (showSocialTimer) setShowSocialTimer(false)

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

    // Restore timers based on connection status (highest priority first)
    if (darkTimerConnected) {
      setShowDarkTimer(true)
    } else if (socialTimerConnected) {
      setShowSocialTimer(true)
    } else if (workTimerConnected) {
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

  // Determine which upper-left element to show with flip transition
  const getUpperLeftElement = () => {
    if (isVisible) {
      return (
        <div className="absolute left-8 top-6">
          {/* Flip Container */}
          <div
            className="relative transition-transform duration-700 ease-in-out"
            style={{
              transformStyle: "preserve-3d",
              transform: showResult ? "rotateX(180deg)" : "rotateX(0deg)",
              width: "600px",
              height: "200px",
            }}
          >
            {/* Front Side - Spinning Wheel */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateX(0deg)",
              }}
            >
              <SpinningWheel
                tricks={tricks}
                isSpinning={isSpinning}
                onSpinComplete={(trick) => {
                  console.log("Spin completed with trick:", trick)
                  setSelectedTrick(trick)
                  setIsSpinning(false)

                  // Give 3 seconds to read the selected trick before flipping
                  setTimeout(() => {
                    console.log("About to flip to result display")
                    setShowResult(true)
                  }, 3000) // Changed from 500ms to 3000ms (3 seconds)

                  // Hide result after 2 minutes
                  setTimeout(() => {
                    setShowResult(false)
                    setIsVisible(false)
                  }, 123000) // Adjusted to account for the 3 second delay
                }}
              />
            </div>

            {/* Back Side - Result Display */}
            <div
              className="absolute inset-0"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateX(180deg)",
              }}
            >
              {selectedTrick && (
                <div>
                  <ResultDisplay trick={selectedTrick} />
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Determine which right-side element to show (Dark Timer > Social Timer > Work Timer)
  const getRightSideElement = () => {
    if (showDarkTimer) {
      return (
        <DarkTimer
          isVisible={showDarkTimer}
          onConnectionChange={setDarkTimerConnected}
          onHide={() => setShowDarkTimer(false)}
        />
      )
    }

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

        {/* Upper Left Elements (DJ Spinner with flip transition) */}
        {getUpperLeftElement()}

        {/* Right Side Elements (Dark Timer > Social Timer > Work Timer) */}
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
            <h3 className="text-xl font-bold text-black mb-2">🌑 Dark Timer</h3>
            <p className="text-black/70">
              {showDarkTimer ? (darkTimerConnected ? "Ready for commands" : "Connecting...") : "Hidden"}
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
        </div>
        <div className="text-center mt-4">
          <h3 className="text-xl font-bold text-black mb-2">🎵 DJ Spinner</h3>
          <p className="text-black/70">{chatConnected ? "Ready for chat commands" : "Manual mode only"}</p>
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
        showDarkTimer={showDarkTimer}
        setShowDarkTimer={setShowDarkTimer}
        darkTimerConnected={darkTimerConnected}
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
