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
import { GardenLegendCelebration } from "@/components/garden-legend-celebration" // Import GardenLegendCelebration component
import { MasterGardenerCelebration } from "@/components/master-gardener-celebration" // Import MasterGardenerCelebration component
import { NaturesGuardianCelebration } from "@/components/natures-guardian-celebration" // Import NaturesGuardianCelebration component
import { GardenEliteCelebration } from "@/components/garden-elite-celebration" // Import GardenEliteCelebration component

interface Blurb {
  id: string
  text: string
  enabled: boolean
}

const initialTricks = [
  // Basic FX & Transitions
  { name: "Backspin + Echo", definition: "Reverse the track with echo for dramatic exit" },
  { name: "Beatmatching (Manual)", definition: "Sync BPMs with pitch fader + ears only" },
  { name: "Big Echo Out", definition: "End track with heavy echo/delay fadeout" },
  { name: "Double Drop", definition: "Two tracks hit their peak at once" },
  { name: "Filter Sweep", definition: "High/low pass sweep for tension" },
  { name: "Flanger", definition: "Metallic whoosh effect" },
  { name: "Hot Cue Juggling", definition: "Play with hot cues for variation" },
  { name: "Loop Roll", definition: "Rolling loop with shrinking lengths" },
  { name: "EQ-Only Transition", definition: "Blend tracks using EQ only (no faders)" },

  // Advanced / Performance Tricks
  { name: "Quick Cut", definition: "Hard, instant switch to new track" },
  { name: "Reverb Throw", definition: "Reverb burst before cutting a track" },
  { name: "Try Scratching", definition: "Attempt a scratch (any style you can manage)" },
  { name: "Slip Mode Tricks", definition: "Manipulate track while timeline keeps running" },
  { name: "Stutter Effect (Echo)", definition: "Use echo to create glitchy stutters" },
  { name: "Vinyl Brake", definition: "Slow stop/spindown for dramatic exit" },
  { name: "Reverse Build", definition: "Reverse loop + FX to build tension" },
  { name: "Left-Handed Mix", definition: "Do the whole transition with your non-dominant hand" },
  { name: "Silent Drop", definition: "Kill all sound briefly before the drop" },
  { name: "Drum Cut", definition: "Cut the drums out for half a bar, then slam them back" },
  { name: "Rhythmic Fader Cuts", definition: "Chop volume fader rhythmically for stutter effect" },
  { name: "Different Genre/BPM Track", definition: "Drop something totally outside your usual set" },
  {
    name: "Reverb Silence Drop",
    definition: "Stop outgoing track with platter + reverb, creating beats of reverb silence before new song drops",
  },

  // CDJ-3000 Specific
  { name: "Slip Roll", definition: "Loop roll in slip mode for glitchy rolls" },
  { name: "Loop Shortening", definition: "Shrink loop lengths to build energy" },
  { name: "Tease New Song", definition: "Tease a vocal, synth, or beat from next track" },
  { name: "Beat Jump Trick", definition: "Use beat jumps to shift phrasing or stutter tracks" },

  // 3-CDJ Specific Techniques
  { name: "Triangle Mix", definition: "Cycle between three tracks in rotation for continuous flow" },
  { name: "Echo Chain Cascade", definition: "Chain echo effects across all three decks for cascading delay patterns" },
  { name: "ABC Rotation Blend", definition: "Seamlessly transition A→B→C→A in a continuous circle" },
  { name: "3rd Deck Texture", definition: "Keep a loop running on deck 3 while mixing normally on decks 1 & 2" },

  // V10 Mixer Specific
  { name: "Send FX", definition: "Use send effects without altering dry signal" },
  { name: "Use Big Knobs", definition: "Perform using V10's big parameter knobs" },
  { name: "Apply Filter to Master", definition: "Affect whole output with master filter" },
  { name: "Mix Only Using Trim", definition: "Transition using trims only" },
  { name: "Isolated Send FX", definition: "Send only one channel into FX return" },
  { name: "Per-Channel Filter Play", definition: "Filter one channel against a clean one" },

  // FX Specials (V10 Beat FX)
  { name: "Delay", definition: "Use delay for repeats or freeze feedback into transition" },
  { name: "Reverb", definition: "Wash out a sound or swell into a breakdown" },
  { name: "Spiral", definition: "Pitch-swept delay for trippy transitions" },
  { name: "Helix", definition: "Layered feedback build-up for dramatic tension" },
  { name: "Phaser", definition: "Psychedelic sweep across mids/highs" },

  // Genre-Specific (House / Techno / Trance)
  { name: "Bass Line Swap", definition: "Swap basslines while keeping drums" },
  { name: "Extend Breakdown", definition: "Stretch breakdown with loops/effects" },
  { name: "Extra Sauce", definition: "Add FX to buildup for more tension" },
  { name: "Kick Swap", definition: "Switch one kick with another mid-mix" },
  { name: "Snare Build Extension", definition: "Loop snares/claps to fake out drop" },
  { name: "Long Transition (32+ Bars)", definition: "Seamless extended blend" },
  { name: "Polyrhythm Loop", definition: "Off-grid loop for hypnotic layered rhythms" },
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
  const [textColor, setTextColor] = useState("#ffffff") // Reverted back to white as user preferred
  const [shadowColor, setShadowColor] = useState("#000000") // Changed back to black shadow
  const [shadowSize, setShadowSize] = useState(0) // Reverted shadow size to 0 for version 99 styling
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

  // Garden Legend Celebration settings
  const [showGardenLegendCelebration, setShowGardenLegendCelebration] = useState(false)
  const [legendCelebrationUsername, setLegendCelebrationUsername] = useState("")

  // Master Gardener Celebration settings
  const [showMasterGardenerCelebration, setShowMasterGardenerCelebration] = useState(false)
  const [masterGardenerUsername, setMasterGardenerUsername] = useState("")

  // Nature's Guardian Celebration settings
  const [showNaturesGuardianCelebration, setShowNaturesGuardianCelebration] = useState(false)
  const [naturesGuardianUsername, setNaturesGuardianUsername] = useState("")

  // Garden Elite Celebration settings
  const [showGardenEliteCelebration, setShowGardenEliteCelebration] = useState(false)
  const [gardenEliteUsername, setGardenEliteUsername] = useState("")

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

    const handleShowGardenLegend = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showGardenLegend event for", username)
      setLegendCelebrationUsername(username)
      setShowGardenLegendCelebration(true)
    }

    const handleHideGardenLegend = (event: CustomEvent) => {
      console.log("[v0] Page: Received hideGardenLegend event", event.detail)
      console.log("[v0] Page: Current showGardenLegendCelebration state:", showGardenLegendCelebration)
      setShowGardenLegendCelebration(false)
      console.log("[v0] Page: Set showGardenLegendCelebration to false")
      setLegendCelebrationUsername("")
      console.log("[v0] Page: Cleared legendCelebrationUsername to force re-render")
    }

    const handleShowMasterGardener = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showMasterGardener event for", username)
      setMasterGardenerUsername(username)
      setShowMasterGardenerCelebration(true)
    }

    const handleShowNaturesGuardian = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showNaturesGuardian event for", username)
      setNaturesGuardianUsername(username)
      setShowNaturesGuardianCelebration(true)
    }

    const handleShowGardenElite = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log("[v0] Page: Received showGardenElite event", customEvent.detail)
      setGardenEliteUsername(customEvent.detail.username)
      setShowGardenEliteCelebration(true)
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
    window.addEventListener("showGardenLegend", handleShowGardenLegend as EventListener)
    window.addEventListener("hideGardenLegend", handleHideGardenLegend as EventListener)
    window.addEventListener("showMasterGardener", handleShowMasterGardener as EventListener)
    window.addEventListener("showNaturesGuardian", handleShowNaturesGuardian as EventListener)
    window.addEventListener("showGardenElite", handleShowGardenElite as EventListener)

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
      window.removeEventListener("showGardenLegend", handleShowGardenLegend as EventListener)
      window.removeEventListener("hideGardenLegend", handleHideGardenLegend as EventListener)
      window.removeEventListener("showMasterGardener", handleShowMasterGardener as EventListener)
      window.removeEventListener("showNaturesGuardian", handleShowNaturesGuardian as EventListener)
      window.removeEventListener("showGardenElite", handleShowGardenElite as EventListener)
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
    if (showGardenLegendCelebration) setShowGardenLegendCelebration(false)
    if (showMasterGardenerCelebration) setShowMasterGardenerCelebration(false)
    if (showNaturesGuardianCelebration) setShowNaturesGuardianCelebration(false)
    if (showGardenEliteCelebration) setShowGardenEliteCelebration(false)

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
    } else if (showGardenLegendCelebration) {
      setShowGardenLegendCelebration(true)
    } else if (showMasterGardenerCelebration) {
      setShowMasterGardenerCelebration(true)
    } else if (showNaturesGuardianCelebration) {
      setShowNaturesGuardianCelebration(true)
    } else if (showGardenEliteCelebration) {
      setShowGardenEliteCelebration(true)
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

        {/* Garden Legend Celebration - Always at bottom when visible */}
        {showGardenLegendCelebration && (
          <GardenLegendCelebration
            isVisible={showGardenLegendCelebration}
            username={legendCelebrationUsername}
            onHide={() => {
              console.log("[v0] Page: Garden Legend onHide callback triggered")
              setShowGardenLegendCelebration(false)
              setLegendCelebrationUsername("")
            }}
          />
        )}

        {/* Master Gardener Celebration - Always at bottom when visible */}
        {showMasterGardenerCelebration && (
          <MasterGardenerCelebration
            isVisible={showMasterGardenerCelebration}
            username={masterGardenerUsername}
            onHide={() => {
              console.log("[v0] Page: Master Gardener onHide callback triggered")
              setShowMasterGardenerCelebration(false)
              setMasterGardenerUsername("")
            }}
          />
        )}

        {/* Nature's Guardian Celebration - Always at bottom when visible */}
        {showNaturesGuardianCelebration && (
          <NaturesGuardianCelebration
            isVisible={showNaturesGuardianCelebration}
            username={naturesGuardianUsername}
            onHide={() => {
              console.log("[v0] Page: Nature's Guardian onHide callback triggered")
              setShowNaturesGuardianCelebration(false)
              setNaturesGuardianUsername("")
            }}
          />
        )}

        {/* Garden Elite Celebration - Always at bottom when visible */}
        {showGardenEliteCelebration && (
          <GardenEliteCelebration
            isVisible={showGardenEliteCelebration}
            username={gardenEliteUsername}
            onHide={() => {
              console.log("[v0] Page: Garden Elite onHide callback triggered")
              setShowGardenEliteCelebration(false)
              setGardenEliteUsername("")
            }}
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
          {/* Add garden legend celebration status */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">👑 Garden Legend Celebration</h3>
            <p className="text-black/70">
              {showGardenLegendCelebration ? `Celebrating ${legendCelebrationUsername}!` : "Hidden"}
            </p>
          </div>
          {/* Add master gardener celebration status */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">🌱 Master Gardener Celebration</h3>
            <p className="text-black/70">
              {showMasterGardenerCelebration ? `Celebrating ${masterGardenerUsername}!` : "Hidden"}
            </p>
          </div>
          {/* Add nature's guardian celebration status */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">🌿 Nature's Guardian Celebration</h3>
            <p className="text-black/70">
              {showNaturesGuardianCelebration ? `Celebrating ${naturesGuardianUsername}!` : "Hidden"}
            </p>
          </div>
          {/* Add garden elite celebration status */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-black mb-2">🏅 Garden Elite Celebration</h3>
            <p className="text-black/70">
              {showGardenEliteCelebration ? `Celebrating ${gardenEliteUsername}!` : "Hidden"}
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
