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
import { BlurbOverlay } from "@/components/blurb-overlay"
import { CommunityGarden } from "@/components/community-garden"
import { FlowerShop } from "@/components/flower-shop"
import { FlowerCelebration } from "@/components/flower-celebration" // Import FlowerCelebration component
import { FlowerLeaderboard } from "@/components/flower-leaderboard" // Import FlowerLeaderboard component
import BeeParadeCelebration from "@/components/bee-parade-celebration" // Import BeeParadeCelebration component

interface Blurb {
  id: string
  text: string
  enabled: boolean
}

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

// Default blurbs
const initialBlurbs: Blurb[] = [
  { id: "1", text: "🎵 Follow for more house & techno vibes!", enabled: true },
  { id: "2", text: "💫 Drop a follow if you're enjoying the set!", enabled: true },
  { id: "3", text: "🔥 What's your favorite track so far?", enabled: true },
  { id: "4", text: "🎧 CDJ-3000 + V10 mixer setup!", enabled: false },
  { id: "5", text: "✨ Thanks for being part of the community!", enabled: true },
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

  // Blurb settings - Updated default position to top-left
  const [blurbs, setBlurbs] = useState<Blurb[]>(initialBlurbs)
  const [showBlurbs, setShowBlurbs] = useState(false)
  const [blurbIntervalMinutes, setBlurbIntervalMinutes] = useState(2)
  const [blurbDisplaySeconds, setBlurbDisplaySeconds] = useState(8)
  const [blurbPosition, setBlurbPosition] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  >("top-left") // Changed default to top-left
  const [blurbFontSize, setBlurbFontSize] = useState(24)
  const [blurbFontFamily, setBlurbFontFamily] = useState("Roboto, sans-serif") // Added font family
  const [blurbTextColor, setBlurbTextColor] = useState("#ffffff")
  const [blurbBackgroundColor, setBlurbBackgroundColor] = useState("#ff6b9d")
  const [blurbShadowColor, setBlurbShadowColor] = useState("#000000")
  const [blurbShadowSize, setBlurbShadowSize] = useState(2)
  const [blurbFontWeight, setBlurbFontWeight] = useState<"normal" | "bold" | "black">("bold")

  // Dark timer settings
  const [showDarkTimer, setShowDarkTimer] = useState(false)
  const [darkTimerConnected, setDarkTimerConnected] = useState(false)

  // Work timer settings
  const [showWorkTimer, setShowWorkTimer] = useState(false)
  const [workTimerConnected, setWorkTimerConnected] = useState(false)

  // Social timer settings
  const [showSocialTimer, setShowSocialTimer] = useState(false)
  const [socialTimerConnected, setSocialTimerConnected] = useState(false)

  // Garden settings
  const [showGarden, setShowGarden] = useState(false)
  const [gardenConnected, setGardenConnected] = useState(false)

  // Flower Shop settings
  const [showFlowerShop, setShowFlowerShop] = useState(false)

  // Flower Celebration settings
  const [showFlowerCelebration, setShowFlowerCelebration] = useState(false)
  const [celebrationUsername, setCelebrationUsername] = useState("")

  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Bee Parade Celebration settings
  const [showBeeParadeCelebration, setShowBeeParadeCelebration] = useState(false)
  const [beeParadeUsername, setBeeParadeUsername] = useState("")

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

    const handleStartGarden = (event: CustomEvent) => {
      console.log("Page: Received startGarden event", event.detail)
      if (!showGarden) {
        console.log("Page: Enabling community garden")
        setShowGarden(true)
      }
    }

    const handleHideGarden = (event: CustomEvent) => {
      console.log("Page: Received hideGarden event", event.detail)
      setShowGarden(false)
    }

    const handleShowFlowerShop = (event: CustomEvent) => {
      console.log("Page: Received showFlowerShop event", event.detail)
      setShowFlowerShop(true)
    }

    const handleHideFlowerShop = () => {
      setShowFlowerShop(false)
    }

    const handleFlowerCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received flower celebration event for", username)
      setCelebrationUsername(username)
      setShowFlowerCelebration(true)
    }

    const handleShowFlowerCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showFlowerCelebration event for", username)
      setCelebrationUsername(username)
      setShowFlowerCelebration(true)
    }

    const handleRequestLeaderboard = (event: CustomEvent) => {
      console.log("Page: Received requestLeaderboard event", event.detail)
      setShowLeaderboard(true)
    }

    const handleShowLeaderboard = (event: CustomEvent) => {
      console.log("Page: Received showLeaderboard event", event.detail)
      setShowLeaderboard(true)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("leaderboardData", { detail: event.detail }))
      }, 100)
    }

    const handleShowBeeParade = (event: CustomEvent) => {
      console.log("Page: Received showBeeParade event", event.detail)
      setBeeParadeUsername("Garden Community")
      setShowBeeParadeCelebration(true)
    }

    window.addEventListener("startDarkTimer", handleStartDarkTimer as EventListener)
    window.addEventListener("startWorkTimer", handleStartWorkTimer as EventListener)
    window.addEventListener("startSocialTimer", handleStartSocialTimer as EventListener)
    window.addEventListener("hideDarkTimer", handleHideDarkTimer as EventListener)
    window.addEventListener("hideWorkTimer", handleHideWorkTimer as EventListener)
    window.addEventListener("hideSocialTimer", handleHideSocialTimer as EventListener)
    window.addEventListener("hideAnyTimer", handleHideAnyTimer as EventListener)
    window.addEventListener("resetAnyTimer", handleResetAnyTimer as EventListener)
    window.addEventListener("startGarden", handleStartGarden as EventListener)
    window.addEventListener("hideGarden", handleHideGarden as EventListener)
    window.addEventListener("showFlowerShop", handleShowFlowerShop as EventListener)
    window.addEventListener("showFlowerCelebration", handleShowFlowerCelebration as EventListener)
    window.addEventListener("manualShowFlowerCelebration", handleShowFlowerCelebration as EventListener)
    window.addEventListener("requestLeaderboard", handleRequestLeaderboard as EventListener)
    window.addEventListener("showLeaderboard", handleShowLeaderboard as EventListener)
    window.addEventListener("showBeeParade", handleShowBeeParade as EventListener)

    return () => {
      window.removeEventListener("startDarkTimer", handleStartDarkTimer as EventListener)
      window.removeEventListener("startWorkTimer", handleStartWorkTimer as EventListener)
      window.removeEventListener("startSocialTimer", handleStartSocialTimer as EventListener)
      window.removeEventListener("hideDarkTimer", handleHideDarkTimer as EventListener)
      window.removeEventListener("hideWorkTimer", handleHideWorkTimer as EventListener)
      window.removeEventListener("hideSocialTimer", handleHideSocialTimer as EventListener)
      window.removeEventListener("hideAnyTimer", handleHideAnyTimer as EventListener)
      window.removeEventListener("resetAnyTimer", handleResetAnyTimer as EventListener)
      window.removeEventListener("startGarden", handleStartGarden as EventListener)
      window.removeEventListener("hideGarden", handleHideGarden as EventListener)
      window.removeEventListener("showFlowerShop", handleShowFlowerShop as EventListener)
      window.removeEventListener("showFlowerCelebration", handleShowFlowerCelebration as EventListener)
      window.removeEventListener("manualShowFlowerCelebration", handleShowFlowerCelebration as EventListener)
      window.removeEventListener("requestLeaderboard", handleRequestLeaderboard as EventListener)
      window.removeEventListener("showLeaderboard", handleShowLeaderboard as EventListener)
      window.removeEventListener("showBeeParade", handleShowBeeParade as EventListener)
    }
  }, [showDarkTimer, showWorkTimer, showSocialTimer, showGarden])

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

    if (showDarkTimer) setShowDarkTimer(false)
    if (showWorkTimer) setShowWorkTimer(false)
    if (showSocialTimer) setShowSocialTimer(false)
    if (showGarden) setShowGarden(false)
    if (showFlowerShop) setShowFlowerShop(false)
    if (showFlowerCelebration) setShowFlowerCelebration(false)
    if (showLeaderboard) setShowLeaderboard(false)
    if (showBeeParadeCelebration) setShowBeeParadeCelebration(false)

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

    if (darkTimerConnected) {
      setShowDarkTimer(true)
    } else if (socialTimerConnected) {
      setShowSocialTimer(true)
    } else if (workTimerConnected) {
      setShowWorkTimer(true)
    } else if (gardenConnected) {
      setShowGarden(true)
    } else if (showFlowerShop) {
      setShowFlowerShop(true)
    } else if (showFlowerCelebration) {
      setShowFlowerCelebration(true)
    } else if (showLeaderboard) {
      setShowLeaderboard(true)
    } else if (showBeeParadeCelebration) {
      setShowBeeParadeCelebration(true)
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

        {/* Blurb Overlay */}
        <BlurbOverlay
          blurbs={blurbs}
          isEnabled={showBlurbs}
          intervalMinutes={blurbIntervalMinutes}
          displayDurationSeconds={blurbDisplaySeconds}
          position={blurbPosition}
          fontSize={blurbFontSize}
          fontFamily={blurbFontFamily}
          textColor={blurbTextColor}
          backgroundColor={blurbBackgroundColor}
          shadowColor={blurbShadowColor}
          shadowSize={blurbShadowSize}
          fontWeight={blurbFontWeight}
        />

        {/* Upper Left Elements (DJ Spinner with flip transition) */}
        {getUpperLeftElement()}

        {/* Right Side Elements (Timers) */}
        {getRightSideElement()}

        {/* Community Garden - Always at bottom when visible */}
        {showGarden && (
          <CommunityGarden
            isVisible={showGarden}
            onConnectionChange={setGardenConnected}
            onHide={() => setShowGarden(false)}
          />
        )}

        {/* Flower Shop - Always at bottom when visible */}
        {showFlowerShop && <FlowerShop isVisible={showFlowerShop} onHide={() => setShowFlowerShop(false)} />}

        {/* Flower Celebration - Always at bottom when visible */}
        {showFlowerCelebration && (
          <FlowerCelebration
            isVisible={showFlowerCelebration}
            username={celebrationUsername}
            onHide={() => setShowFlowerCelebration(false)}
          />
        )}

        {/* Bee Parade Celebration - Always at bottom when visible */}
        {showBeeParadeCelebration && (
          <BeeParadeCelebration
            isVisible={showBeeParadeCelebration}
            onHide={() => setShowBeeParadeCelebration(false)}
          />
        )}

        {showLeaderboard && <FlowerLeaderboard isVisible={showLeaderboard} onHide={() => setShowLeaderboard(false)} />}
      </div>

      {/* Separator Line */}
      <div className="border-t-4 border-black"></div>

      {/* Status Text - Below the line, above admin */}
      <div className="py-8 text-center" style={{ backgroundColor: "#ffb8ad" }}>
        <h2 className="text-3xl font-bold text-black mb-4">🎮 Unified Stream Overlay 🎮</h2>
        <div className="grid md:grid-cols-6 gap-6 max-w-8xl mx-auto">
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">⏰ Time Display</h3>
            <p className="text-black/70">
              {showTimeOverlay ? `Showing in ${timePosition.replace("-", " ")}` : "Hidden"}
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">💬 Blurbs</h3>
            <p className="text-black/70">
              {showBlurbs
                ? `${blurbs.filter((b) => b.enabled).length} active, every ${blurbIntervalMinutes}min`
                : "Hidden"}
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
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">🌸 Community Garden</h3>
            <p className="text-black/70">
              {showGarden ? (gardenConnected ? "Growing beautifully!" : "Connecting...") : "Hidden"}
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">💐 Flower Shop</h3>
            <p className="text-black/70">{showFlowerShop ? "Visible" : "Hidden"}</p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">🌼 Flower Celebration</h3>
            <p className="text-black/70">{showFlowerCelebration ? `Celebrating ${celebrationUsername}!` : "Hidden"}</p>
          </div>
          {/* Add leaderboard status */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">🏆 Flower Leaderboard</h3>
            <p className="text-black/70">{showLeaderboard ? "Visible" : "Hidden"}</p>
          </div>
          {/* Add bee parade celebration status */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">🐝 Bee Parade Celebration</h3>
            <p className="text-black/70">{showBeeParadeCelebration ? `Celebrating ${beeParadeUsername}!` : "Hidden"}</p>
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
        blurbs={blurbs}
        setBlurbs={setBlurbs}
        showBlurbs={showBlurbs}
        setShowBlurbs={setShowBlurbs}
        blurbIntervalMinutes={blurbIntervalMinutes}
        setBlurbIntervalMinutes={setBlurbIntervalMinutes}
        blurbDisplaySeconds={blurbDisplaySeconds}
        setBlurbDisplaySeconds={setBlurbDisplaySeconds}
        blurbPosition={blurbPosition}
        setBlurbPosition={setBlurbPosition}
        blurbFontSize={blurbFontSize}
        setBlurbFontSize={setBlurbFontSize}
        blurbFontFamily={blurbFontFamily}
        setBlurbFontFamily={setBlurbFontFamily}
        blurbTextColor={blurbTextColor}
        setBlurbTextColor={setBlurbTextColor}
        blurbBackgroundColor={blurbBackgroundColor}
        setBlurbBackgroundColor={setBlurbBackgroundColor}
        blurbShadowColor={blurbShadowColor}
        setBlurbShadowColor={setBlurbShadowColor}
        blurbShadowSize={blurbShadowSize}
        setBlurbShadowSize={setBlurbShadowSize}
        blurbFontWeight={blurbFontWeight}
        setBlurbFontWeight={setBlurbFontWeight}
        showDarkTimer={showDarkTimer}
        setShowDarkTimer={setShowDarkTimer}
        darkTimerConnected={darkTimerConnected}
        showWorkTimer={showWorkTimer}
        setShowWorkTimer={setShowWorkTimer}
        workTimerConnected={workTimerConnected}
        showSocialTimer={showSocialTimer}
        setShowSocialTimer={setShowSocialTimer}
        socialTimerConnected={socialTimerConnected}
        showGarden={showGarden}
        setShowGarden={setShowGarden}
        gardenConnected={gardenConnected}
        showFlowerShop={showFlowerShop}
        setShowFlowerShop={setShowFlowerShop}
        showFlowerCelebration={showFlowerCelebration}
        setShowFlowerCelebration={setShowFlowerCelebration}
        celebrationUsername={celebrationUsername}
        setCelebrationUsername={setCelebrationUsername}
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
