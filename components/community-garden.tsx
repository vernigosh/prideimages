"use client"

import { useState, useEffect, useRef, type CSSProperties } from "react"
import FlowerCelebration from "./flower-celebration" // Import FlowerCelebration component
import { GardenLegendCelebration } from "./garden-legend-celebration" // Import the new Garden Legend celebration component
import { BeeParadeCelebration } from "./bee-parade-celebration" // Import the new Bee Parade celebration component
import { MasterGardenerCelebration } from "./master-gardener-celebration" // Import the new Master Gardener celebration component
import { NaturesGuardianCelebration } from "./natures-guardian-celebration" // Import the new Nature's Guardian celebration component
import { GardenEliteCelebration } from "./garden-elite-celebration" // Import the new Garden Elite celebration component
import { OVERLAY_FONT_STANDARD, OVERLAY_LINE_HEIGHT_STANDARD, OVERLAY_WEIGHT_LABEL } from "@/lib/overlay-typography"
import { DarkGardenFlames } from "./garden/dark-garden-flames"
import { DARK_FLOWER_FILTER, DARK_GARDEN_TINT, DARK_TRANSITION_MS } from "@/lib/garden/dark-garden"

interface Flower {
  id: string
  type: "rose" | "tulip" | "sunflower" | "daisy" | "lily" | "wildflower"
  color: "pink" | "green" | "mixed"
  x: number // Position along the bottom (0-100%)
  plantedBy: string
  plantedAt: number
  stage: "sprout" | "blooming" | "small" | "medium" | "fully-mature"
  lastWatered: number
  specificType?: string // For tulip colors, etc.
}

export interface GardenActivitySettings {
  offsetX: number // px offset from horizontal center (positive = right)
  offsetY: number // px from the bottom of the garden band
  width: number // px
  fontSize: number
  lifetimeMs: number
  backgroundOpacity: number // 0-1 (0 = no card background)
  highlightEnabled: boolean // power-up the specific flower tied to a plant activity
  highlightMs: number // duration of the targeted flower power-up effect
  highlightIntensity: "low" | "medium" | "high" // strength of the power-up treatment
}

export const DEFAULT_GARDEN_ACTIVITY_SETTINGS: GardenActivitySettings = {
  offsetX: 0,
  offsetY: 328,
  width: 640,
  fontSize: OVERLAY_FONT_STANDARD, // 32 (standard)
  lifetimeMs: 6000,
  backgroundOpacity: 0,
  highlightEnabled: true,
  highlightMs: 1300, // ~1200-1400ms classic power-up
  highlightIntensity: "medium",
}

// Maps the intensity setting to the peak brightness/saturation used by the
// power-up. The animation keyframes read these via CSS custom properties.
function intensityFactors(intensity: GardenActivitySettings["highlightIntensity"]) {
  switch (intensity) {
    case "low":
      return { brightness: 1.25, saturate: 1.4 }
    case "high":
      return { brightness: 1.6, saturate: 2.2 }
    default:
      return { brightness: 1.4, saturate: 1.9 }
  }
}

// Respect the viewer's OS-level reduced-motion preference for the flower effect.
function gardenPrefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
}

// A single centralized garden activity item. Only `message` is shown; the
// optional `flowerId` is what lets the power-up effect target the exact flower
// referenced by THIS message when it becomes the visible item.
interface GardenActivity {
  id: string
  type?: "plant" | "water" | "pick" | "rain" | "bunny"
  username?: string
  message: string
  timestamp: number
  flowerId?: string
  flowerType?: string
}

// Optional metadata a caller can attach to an activity for sprite targeting.
type GardenActivityMeta = Pick<GardenActivity, "type" | "username" | "flowerId" | "flowerType">

let gardenActivitySeq = 0
function nextActivityId(): string {
  gardenActivitySeq += 1
  return `ga_${Date.now().toString(36)}_${gardenActivitySeq}`
}

// An activity older than this when it first becomes visible is treated as stale
// (e.g. surviving a remount) and will not fire its flower effect.
const STALE_ACTIVITY_MS = 4000

// A temporary visual copy of a flower that has already been removed from garden
// state (picked, or eaten by the bunny) but must remain on screen at its original
// position to play the power-up + fade-away. Tied to the activity id that owns it,
// so the animation only starts when that activity's message becomes visible.
interface DepartingFlower {
  key: string // unique render key: `${activityId}_${flower.id}`
  activityId: string // the Garden Activity whose visibility starts the animation
  flower: Flower // snapshot captured before removal (position, type, stage, etc.)
  phase: "waiting" | "animating" | "leaving"
}

// The color power-up lasts about five seconds and completes three full cycles.
const POWERUP_DURATION_MS = 5000
const POWERUP_COLOR_CYCLES = 3
const DEPART_LEAVE_MS = 1260

function powerUpDuration(_highlightMs: number): number {
  return POWERUP_DURATION_MS
}

function powerUpCycleDuration(highlightMs: number): number {
  return powerUpDuration(highlightMs) / POWERUP_COLOR_CYCLES
}

// Shared garden baseline: the bottom offset (px) of the single container that
// parents every ground actor (flowers, departing snapshots, the bunny — all
// positioned `bottom-2` inside it). Previously 38px to clear the old scrolling
// chat ticker, which no longer exists. Lowered to a small NEGATIVE value so the
// visible stem bases meet the canvas bottom edge: the flower/bunny webp sprites
// carry transparent padding beneath the stems, so aligning the image bounding box
// to 0 would float the visible stems above the edge. The negative offset lets that
// transparent padding clip against the overflow-hidden root, seating the visible
// pixels on the bottom. Changing only this value keeps all relative spacing intact.
const GARDEN_BASELINE_BOTTOM_PX = -10

interface CommunityGardenProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
  onFlowerLegendsUpdate?: (legends: Array<{ username: string; count: number }>) => void
  activitySettings?: Partial<GardenActivitySettings>
  /** Dark Vernigosh visual treatment. Driven by the existing dark-timer state in
   *  app/page.tsx — this component never derives it, so there is only ever one
   *  source of truth for whether Dark Vernigosh is running. */
  darkMode?: boolean
}

const flowerTypes = {
  rose: { name: "Rose", growthTime: 45000 }, // 45 seconds to sprout->blooming
  tulip: { name: "Tulip", growthTime: 45000 },
  sunflower: { name: "Sunflower", growthTime: 45000 },
  daisy: { name: "Daisy", growthTime: 45000 },
  lily: { name: "Lily", growthTime: 45000 },
  wildflower: { name: "Wildflower", growthTime: 45000 },
}

const flowerImages = {
  rose: "/garden/flowers/rose-bush.webp",
  tulip: "/garden/flowers/red-tulip.webp",
  sunflower: "/garden/flowers/sunflower.webp",
  daisy: "/garden/flowers/oxeye-daisy.webp",
  lily: "/garden/flowers/lily-of-the-valley.webp",
  wildflower: [
    "/garden/flowers/azure-bluet-1.webp",
    "/garden/flowers/azure-bluet-2.webp",
    "/garden/flowers/azure-bluet-3.webp",
    "/garden/flowers/cornflower.webp",
    "/garden/flowers/allium.webp",
    "/garden/flowers/blue-orchid.webp",
    "/garden/flowers/cyan-flower.webp",
    "/garden/flowers/peony.webp",
    "/garden/flowers/poppy.webp",
    "/garden/flowers/lilac.webp",
  ],
}

const wildflowerImages = [
  "/garden/flowers/azure-bluet-1.webp",
  "/garden/flowers/azure-bluet-2.webp",
  "/garden/flowers/azure-bluet-3.webp",
  "/garden/flowers/cornflower.webp",
  "/garden/flowers/allium.webp",
  "/garden/flowers/blue-orchid.webp",
  "/garden/flowers/cyan-flower.webp",
  "/garden/flowers/peony.webp",
  "/garden/flowers/poppy.webp",
  "/garden/flowers/lilac.webp",
]

const flowerRarity = {
  // Common flowers (60% total probability)
  daisy: 25,
  wildflower: 20,
  lily: 15,

  // Medium rarity (30% total probability)
  tulip: 30,

  // Rare tall flowers (10% total probability)
  sunflower: 5,
  rose: 5,
}

// Send chat message via StreamElements bot
async function sendChatMessage(message: string) {
  try {
    await fetch("/api/send-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
  } catch (error) {
    console.error("Failed to send chat message:", error)
  }
}

export function CommunityGarden({ isVisible, onConnectionChange, onHide, onFlowerLegendsUpdate, activitySettings, darkMode = false }: CommunityGardenProps) {
  // Precomputed once per render and shared by every flower and departing flower,
  // so toggling Dark Vernigosh costs one style value rather than per-sprite work.
  const darkSpriteStyle: CSSProperties = {
    filter: darkMode ? DARK_FLOWER_FILTER : "none",
    transition: `filter ${DARK_TRANSITION_MS}ms ease-in-out`,
  }
  const activityCfg: GardenActivitySettings = { ...DEFAULT_GARDEN_ACTIVITY_SETTINGS, ...activitySettings }
  const activityCfgRef = useRef(activityCfg)
  activityCfgRef.current = activityCfg
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [gardenStats, setGardenStats] = useState({
    totalFlowers: 0,
    activeGardeners: 0,
    lastActivity: "",
    waterLevel: 100, // Garden health
  })
  const [recentActivity, setRecentActivity] = useState<GardenActivity[]>([])
  // Ids of flowers currently playing the power-up effect (tied to the visible message).
  const [highlightedFlowerIds, setHighlightedFlowerIds] = useState<string[]>([])
  const highlightTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  // Temporary on-screen copies of flowers that were removed by a pick or bunny-eat.
  const [departingFlowers, setDepartingFlowers] = useState<DepartingFlower[]>([])
  const departTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  // Tracks which visible-activity id has already triggered its effect (fires once).
  const poweredActivityIdRef = useRef<string | null>(null)
  // Mirror of flowers for stable reads inside stable (empty-dep) event handlers.
  const flowersRef = useRef<Flower[]>(flowers)
  flowersRef.current = flowers
  const [bunnyActive, setBunnyActive] = useState(false)
  const [bunnyPhase, setBunnyPhase] = useState<"arriving" | "exploring" | "eating" | "playing" | "leaving">("arriving")
  const [bunnyOpacity, setBunnyOpacity] = useState(0)
  const [lastBunnyVisit, setLastBunnyVisit] = useState(Date.now() - 5 * 60 * 1000) // Start 5 minutes ago so bunny can appear immediately
  const [bunnyEatenCount, setBunnyEatenCount] = useState(0)
  const [bunnyPosition, setBunnyPosition] = useState(50)
  const [bunnyStartTime, setBunnyStartTime] = useState<number | null>(null) // Track when bunny visit started
  const growthIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [rainTimeoutRef, setRainTimeoutRef] = useState<NodeJS.Timeout | null>(null) // Use state for rain timeout
  const [lastWaterTime, setLastWaterTime] = useState(0) // New state variable for tracking the last water time
  const [userFlowerCounts, setUserFlowerCounts] = useState<{ [username: string]: number }>({}) // New state for user flower totals
  const [userPickedTotals, setUserPickedTotals] = useState<{ [username: string]: number }>({}) // New state for lifetime picked totals
  const [gardenSaturation, setGardenSaturation] = useState(100) // Start at 100% saturation
  const [showFlowerCelebration, setShowFlowerCelebration] = useState(false) // Add flower celebration tracking state
  const [celebrationUsername, setCelebrationUsername] = useState("") // Add flower celebration tracking state
  const [showGardenLegendCelebration, setShowGardenLegendCelebration] = useState(false) // Add state for Garden Legend celebration
  const [legendCelebrationUsername, setLegendCelebrationUsername] = useState("") // Add state for Garden Legend celebration
  const [showBeeParadeCelebration, setShowBeeParadeCelebration] = useState(false) // Add state for Bee Parade celebration
  const [beeParadeUsername, setBeeParadeUsername] = useState("") // Add state for Bee Parade celebration
  const [showMasterGardenerCelebration, setShowMasterGardenerCelebration] = useState(false) // Add state for Master Gardener celebration
  const [masterGardenerUsername, setMasterGardenerUsername] = useState("") // Add state for Master Gardener celebration
  const [showNaturesGuardianCelebration, setShowNaturesGuardianCelebration] = useState(false) // Add state for Nature's Guardian celebration
  const [naturesGuardianUsername, setNaturesGuardianUsername] = useState("") // Add state for Nature's Guardian celebration
  const [showGardenEliteCelebration, setShowGardenEliteCelebration] = useState(false) // Add state for Garden Elite celebration
  const [gardenEliteUsername, setGardenEliteUsername] = useState("") // Add state for Garden Elite celebration

  // Update flower legends (10+ flowers) for stream credits
  useEffect(() => {
    if (onFlowerLegendsUpdate) {
      const legends = Object.entries(userPickedTotals)
        .filter(([_, count]) => count >= 10)
        .map(([username, count]) => ({ username, count }))
        .sort((a, b) => b.count - a.count)
      onFlowerLegendsUpdate(legends)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPickedTotals])

  // Test function to spawn 20 flowers
  const handleTestSpawn = () => {
    const testFlowers: Flower[] = []
    const now = Date.now()

    for (let i = 0; i < 20; i++) {
      const flowerTypeKeys = Object.keys(flowerTypes) as Array<keyof typeof flowerTypes>
      const flowerType = flowerTypeKeys[Math.floor(Math.random() * flowerTypeKeys.length)]
      const specificType =
        flowerType === "tulip" ? ["red", "orange", "pink", "white"][Math.floor(Math.random() * 4)] : ""

      // Create flowers at different stages for testing
      const stages: Flower["stage"][] = ["sprout", "blooming", "small", "medium", "fully-mature"]
      const randomStage = stages[Math.floor(Math.random() * stages.length)]

      const newFlower: Flower = {
        id: `test-${now}-${i}`,
        type: flowerType,
        color: "mixed",
        x: 5 + (90 / 19) * i, // Evenly distribute across available space (5% to 95%)
        plantedBy: `TestUser${i}`,
        plantedAt: now - Math.random() * 300000, // Random age up to 5 minutes
        stage: randomStage,
        lastWatered: now,
        specificType,
      }
      testFlowers.push(newFlower)
    }

    setFlowers(testFlowers)
    setGardenStats((prev) => ({
      ...prev,
      totalFlowers: 20,
      lastActivity: "Test spawned 20 flowers!",
    }))
    addActivity(`🧪 TEST SPAWNED 20 FLOWERS AT DIFFERENT STAGES!`, 5000)
  }

  const triggerBunnyVisit = (matureFlowers: Flower[], isManualTest = false) => {
    const now = Date.now()

    if (!isManualTest) {
      if (now - lastBunnyVisit < 20 * 60 * 1000) {
        return
      }
    }

    if (bunnyActive) {
      return
    }

    addActivity("🐰 A WILD BUNNY APPEARS IN THE GARDEN!", 4000)

    // Calculate how many flowers to eat
    const maxToEat = Math.min(5, Math.ceil(matureFlowers.length / 2))
    const flowersToEat = Math.floor(Math.random() * maxToEat) + 1
    setBunnyEatenCount(flowersToEat)

    const bunnyX = Math.random() * 90 + 5
    setBunnyPosition(bunnyX)

    // Start the bunny visit
    setBunnyActive(true)
    setBunnyPhase("arriving")
    setBunnyOpacity(0)
    setBunnyStartTime(now)
    setLastBunnyVisit(now)
  }

  const triggerBunnyVisitForWeeds = () => {
    const now = Date.now()

    if (bunnyActive) {
      return
    }

    addActivity("🐰 A WILD BUNNY APPEARS IN THE GARDEN!", 4000)
    addActivity("🌱 NO MATURE FLOWERS AVAILABLE - BUNNY WILL EAT WEEDS INSTEAD!", 4000)

    // Set bunny to eat 0 flowers since there are no mature ones
    setBunnyEatenCount(0)

    const bunnyX = Math.random() * 90 + 5
    setBunnyPosition(bunnyX)

    // Start the bunny visit
    setBunnyActive(true)
    setBunnyPhase("arriving")
    setBunnyOpacity(0)
    setBunnyStartTime(now)
    setLastBunnyVisit(now)
  }

  useEffect(() => {
    if (!bunnyActive || !bunnyStartTime) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - bunnyStartTime
      const phase1Duration = 10000 // arriving - changed from 5000 to 10000
      const phase2Duration = 15000 // eating/exploring power-up extended to 3x
      const phase3Duration = 10000 // playing/leaving - changed from 5000 to 10000

      if (elapsed < phase1Duration) {
        setBunnyPhase("arriving")
        setBunnyOpacity(Math.min(1, elapsed / 1000))
      } else if (elapsed < phase1Duration + phase2Duration) {
        if (bunnyPhase !== "eating") {
          setBunnyPhase("eating")
          setBunnyOpacity(1)

          if (bunnyEatenCount > 0) {
            // Capture the EXACT flowers about to be eaten (by unique id) before they
            // leave garden state, so temporary copies can animate at their spots.
            const matureFlowers = flowersRef.current.filter((f) => f.stage === "fully-mature")
            const eatenSnapshots = matureFlowers.slice(0, bunnyEatenCount).map((f) => ({ ...f }))
            const eatenIds = new Set(eatenSnapshots.map((f) => f.id))

            const bunnyActivityId = addActivity(
              `🐰 THE BUNNY IS MUNCHING ON ${bunnyEatenCount} DELICIOUS FLOWERS!`,
              4000,
              { type: "bunny", username: "Bunny" },
            )
            // All eaten copies animate simultaneously when the message appears.
            spawnDepartingFlowers(eatenSnapshots, bunnyActivityId)

            // Remove exactly those flowers from garden state.
            setFlowers((currentFlowers) => currentFlowers.filter((f) => !eatenIds.has(f.id)))
          } else {
            addActivity("🐰 THE BUNNY IS HAPPILY MUNCHING ON GARDEN WEEDS!", 4000)
          }
        }
      } else if (elapsed < phase1Duration + phase2Duration + phase3Duration) {
        setBunnyPhase("playing")
      } else {
        // Bunny visit complete
        setBunnyActive(false)
        setBunnyPhase("arriving")
        setBunnyOpacity(0)
        setBunnyStartTime(null)
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [bunnyActive, bunnyStartTime, bunnyPhase, bunnyEatenCount])

  useEffect(() => {
    if (!isVisible) return

    growthIntervalRef.current = setInterval(() => {
      setFlowers((prevFlowers) => {
        return prevFlowers.map((flower) => {
          if (flower.stage === "fully-mature") return flower

          const timeSincePlanted = Date.now() - flower.plantedAt

          let newStage: Flower["stage"] = "sprout"
          if (timeSincePlanted > 150000)
            newStage = "fully-mature" // 2.5+ minutes
          else if (timeSincePlanted > 90000)
            newStage = "medium" // 1.5-2.5 minutes
          else if (timeSincePlanted > 60000)
            newStage = "small" // 1-1.5 minutes
          else if (timeSincePlanted > 45000)
            newStage = "blooming" // 45s-1 minute
          else newStage = "sprout" // 0-45s

          // Per-flower name labels removed by design; routine activity is
          // surfaced through the centralized activity feed (addActivity) instead.

          return { ...flower, stage: newStage }
        })
      })
    }, 5000) // Check every 5 seconds

    return () => {
      if (growthIntervalRef.current) clearInterval(growthIntervalRef.current)
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const bunnyCheckInterval = setInterval(() => {
      // Only check if bunny is not already active
      if (bunnyActive) {
        return
      }

      const now = Date.now()
      const timeSinceLastBunny = now - lastBunnyVisit
      const twentyMinutes = 20 * 60 * 1000 // 20 minutes

      if (timeSinceLastBunny > twentyMinutes) {
        setFlowers((currentFlowers) => {
          const matureFlowers = currentFlowers.filter((f) => f.stage === "fully-mature")

          if (matureFlowers.length > 0) {
            triggerBunnyVisit(matureFlowers)
          } else {
            triggerBunnyVisitForWeeds()
          }

          return currentFlowers // Return unchanged flowers
        })
      }
    }, 10000) // Reduced from 30 seconds to 10 seconds for more frequent checks during testing

    return () => {
      clearInterval(bunnyCheckInterval)
    }
  }, [isVisible, bunnyActive, lastBunnyVisit])

  // Gradually reduce saturation over time
  useEffect(() => {
    if (!isVisible) return

    const saturationInterval = setInterval(() => {
      const now = Date.now()
      const timeSinceWater = now - lastWaterTime
      const graceTime = 5 * 60 * 1000 // 5 minutes of full saturation
      const fadeTime = 5 * 60 * 1000 // 5 minutes to fade from 100% to 20%

      if (timeSinceWater <= graceTime) {
        // Keep at 100% for first 5 minutes
        setGardenSaturation(100)
      } else {
        // After 5 minutes, fade from 100% to 20% over next 5 minutes
        const fadeProgress = (timeSinceWater - graceTime) / fadeTime
        const saturationPercent = Math.max(20, 100 - fadeProgress * 80)
        setGardenSaturation(saturationPercent)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(saturationInterval)
  }, [isVisible, lastWaterTime])

  // Chat command handlers
  useEffect(() => {
    const handlePlantFlower = (event: CustomEvent) => {
      const { username } = event.detail

      const getRandomFlowerType = () => {
        const totalWeight = Object.values(flowerRarity).reduce((sum, weight) => sum + weight, 0)
        let random = Math.random() * totalWeight

        for (const [flowerType, weight] of Object.entries(flowerRarity)) {
          random -= weight
          if (random <= 0) {
            return flowerType as keyof typeof flowerTypes
          }
        }

        // Fallback to daisy if something goes wrong
        return "daisy" as keyof typeof flowerTypes
      }

      const randomFlowerType = getRandomFlowerType()

      console.log(`Community Garden: ${username} planting ${randomFlowerType}`)

      // Check if user has planted 2 flowers recently (allow 2 flowers per user per 5-minute window)
      const userFlowers = flowers.filter((f) => f.plantedBy === username && Date.now() - f.plantedAt < 300000)
      if (userFlowers.length >= 2) {
        console.log("Community Garden: User has reached flower limit")
        addActivity(
          `🌸 ${username.toUpperCase()}, YOU'VE USED YOUR 2-FLOWER ALLOWANCE! WAIT 5 MINUTES FOR A FRESH START!`,
          7000,
        )
        return
      }

      // Check if garden is full
      if (flowers.length >= 20) {
        console.log("Community Garden: Garden is full")
        addActivity(`🌸 GARDEN IS FULL! TRY HARVESTING SOME FLOWERS FIRST.`, 7000)

        // Trigger bee parade celebration if not already shown recently
        const now = Date.now()
        const lastBeeParade = localStorage.getItem("lastBeeParade")
        const timeSinceLastParade = lastBeeParade ? now - Number.parseInt(lastBeeParade) : Number.POSITIVE_INFINITY

        if (timeSinceLastParade > 300000) {
          // 5 minutes cooldown
          console.log("Community Garden: Triggering bee parade for full garden")
          localStorage.setItem("lastBeeParade", now.toString())
          window.dispatchEvent(new CustomEvent("showBeeParade"))
        }

        return
      }

      let specificType = ""
      let wildflowerVariant = ""
      if (randomFlowerType === "tulip") {
        const tulipColors = ["red", "orange", "pink", "white"]
        specificType = tulipColors[Math.floor(Math.random() * tulipColors.length)]
      } else if (randomFlowerType === "wildflower") {
        // Select a random wildflower variant
        const randomIndex = Math.floor(Math.random() * wildflowerImages.length)
        wildflowerVariant = wildflowerImages[randomIndex]
        specificType = wildflowerVariant // Store the image path as specificType
      }

      const usedPositions = flowers.map((f) => f.x)
      let newX: number

      const isPeony = randomFlowerType === "wildflower" && wildflowerVariant.includes("peony")
      const isTallFlower = randomFlowerType === "rose" || randomFlowerType === "sunflower" || isPeony

      if (isTallFlower) {
        // Place on left edge (5-25%) or right edge (75-95%)
        const useLeftEdge = Math.random() < 0.5
        newX = useLeftEdge
          ? Math.random() * 20 + 5 // 5% to 25%
          : Math.random() * 20 + 75 // 75% to 95%
      } else {
        // Other flowers can appear anywhere (5% to 95%)
        newX = Math.random() * 90 + 5
      }

      // Try to avoid overlapping
      let attempts = 0
      while (attempts < 10 && usedPositions.some((pos) => Math.abs(pos - newX) < 8)) {
        if (isTallFlower) {
          const useLeftEdge = Math.random() < 0.5
          newX = useLeftEdge ? Math.random() * 20 + 5 : Math.random() * 20 + 75
        } else {
          newX = Math.random() * 90 + 5
        }
        attempts++
      }

      const newFlower: Flower = {
        id: `${username}-${Date.now()}`,
        type: randomFlowerType,
        color: "mixed",
        x: newX,
        plantedBy: username,
        plantedAt: Date.now(),
        stage: "sprout",
        lastWatered: Date.now(),
        specificType,
      }

      setFlowers((prev) => [...prev, newFlower])

      // Update user's session flower count (this will reset to 0 when they pick)
      setUserFlowerCounts((prev) => ({
        ...prev,
        [username]: (prev[username] || 0) + 1,
      }))

      const userFlowerCount = (userFlowerCounts[username] || 0) + 1 // +1 for the flower they just planted

      setGardenStats((prev) => ({
        ...prev,
        totalFlowers: prev.totalFlowers + 1,
        lastActivity: `${username} planted a ${flowerTypes[newFlower.type].name}!`,
      }))

      // Clean session-based messaging. The flowerId is carried on the activity so
      // the sprite power-up fires when THIS message becomes visible (queue-safe).
      const plantMeta: GardenActivityMeta = {
        type: "plant",
        username,
        flowerId: newFlower.id,
        flowerType: flowerTypes[newFlower.type].name,
      }
      if (userFlowerCount === 1) {
        addActivity(`🌱 ${username.toUpperCase()} PLANTED FLOWER #${userFlowerCount}! PLANT 1 MORE!`, 5000, plantMeta)
      } else {
        addActivity(`🌸 ${username.toUpperCase()} PLANTED FLOWER #${userFlowerCount}! PLOT COMPLETE!`, 5000, plantMeta)
      }
    }

    const handleWaterGarden = (event: CustomEvent) => {
      const { username } = event.detail
      console.log(`Community Garden: ${username} watering the garden - rainTimeoutRef.current is:`, rainTimeoutRef)

      const now = Date.now()
      setLastWaterTime(now)
      setGardenSaturation(100) // Reset saturation to 100%

      // Water all flowers
      setFlowers((prev) => prev.map((flower) => ({ ...flower, lastWatered: now })))
      setGardenStats((prev) => ({
        ...prev,
        waterLevel: Math.min(100, prev.waterLevel + 10),
        lastActivity: `${username} watered the garden!`,
      }))
      // Water targets the whole garden, so no single flowerId is attached.
      addActivity(`💧 ${username.toUpperCase()} WATERED THE ENTIRE GARDEN!`, 5000, { type: "water", username })

      console.log("Starting rain animation...")
      // Clear any existing rain timeout before setting a new one
      if (rainTimeoutRef) {
        clearTimeout(rainTimeoutRef)
      }

      // Set rainTimeoutRef to a non-null value to trigger the rain visual effect
      const newTimeout = setTimeout(() => {
        console.log("Rain animation timer created")
      }, 100) // Small delay just to create the timeout
      setRainTimeoutRef(newTimeout)

      // Clear the rain effect after 5 seconds
      setTimeout(() => {
        console.log("Stopping rain animation...")
        if (rainTimeoutRef) {
          clearTimeout(rainTimeoutRef)
          setRainTimeoutRef(null) // Set to null when cleared
        }
      }, 5000)
    }

    const handlePickFlowers = (event: CustomEvent) => {
      const { username } = event.detail
      console.log(`Community Garden: ${username} picking their own flowers`)

      const now = Date.now()
      const userFlowers = flowers.filter((f) => f.plantedBy === username)
      const userMatureFlowers = userFlowers.filter((f) => f.stage === "fully-mature")
      const userPickableFlowers = userMatureFlowers.filter((f) => now - f.plantedAt >= 300000) // 5+ minutes old

      if (userFlowers.length === 0) {
        addActivity(`🌱 ${username.toUpperCase()}, YOU HAVEN'T PLANTED ANY FLOWERS YET!`, 7000)
        return
      }

      if (userMatureFlowers.length === 0) {
        addActivity(`🌱 ${username.toUpperCase()}, YOUR FLOWERS AREN'T READY TO PICK YET!`, 7000)
        return
      }

      if (userPickableFlowers.length === 0) {
        addActivity(
          `⏰ ${username.toUpperCase()}, YOUR ${userMatureFlowers.length} FLOWERS NEED TO AGE 5+ MINUTES BEFORE PICKING!`,
          7000,
        )
        return
      }

      // Count flowers by type for inventory tracking
      const flowerCounts = userPickableFlowers.reduce(
        (counts, flower) => {
          counts[flower.type] = (counts[flower.type] || 0) + 1
          return counts
        },
        {} as { [key: string]: number },
      )

      // Dispatch flower picked events for each type
      Object.entries(flowerCounts).forEach(([flowerType, amount]) => {
        window.dispatchEvent(
          new CustomEvent("flowerPicked", {
            detail: { username, flowerType, amount },
          }),
        )
      })

      // Update lifetime picked total
      const newPickedTotal = (userPickedTotals[username] || 0) + userPickableFlowers.length

      if (newPickedTotal >= 10 && (userPickedTotals[username] || 0) < 10) {
        window.dispatchEvent(new CustomEvent("showFlowerCelebration", { detail: { username } }))
      }

      if (newPickedTotal >= 20 && (userPickedTotals[username] || 0) < 20) {
        window.dispatchEvent(new CustomEvent("showGardenLegendCelebration", { detail: { username } }))
      }

      if (newPickedTotal >= 30 && (userPickedTotals[username] || 0) < 30) {
        window.dispatchEvent(new CustomEvent("showMasterGardener", { detail: { username } }))
      }

      if (newPickedTotal >= 40 && (userPickedTotals[username] || 0) < 40) {
        window.dispatchEvent(new CustomEvent("showGardenElite", { detail: { username } }))
      }

      // The celebration only fires on the session crossing edge.
      if (newPickedTotal >= 50 && (userPickedTotals[username] || 0) < 50) {
        window.dispatchEvent(new CustomEvent("showNaturesGuardian", { detail: { username } }))
      }

      // The board save fires on EVERY pick at or above the threshold, not just the
      // crossing edge. Session totals reset each stream by design, so if we only
      // saved at the crossing we would permanently record the value someone happened
      // to land on when passing 50 and lose every pick after it. The endpoint keeps
      // the higher of the stored and incoming counts, so repeat calls only ever
      // raise a guardian's all-time best.
      if (newPickedTotal >= 50) {
        fetch("/api/guardians/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, flowerCount: newPickedTotal }),
        }).catch((err) => console.error("[v0] Failed to save guardian:", err))
      }

      if (newPickedTotal >= 60 && (userPickedTotals[username] || 0) < 60) {
        window.dispatchEvent(new CustomEvent("showEasterEgg", { detail: { username } }))
      }

      setUserPickedTotals((prev) => ({
        ...prev,
        [username]: newPickedTotal,
      }))

      // Reset user's session flower count since they picked their flowers
      setUserFlowerCounts((prev) => ({
        ...prev,
        [username]: 0,
      }))

      // Snapshot the exact flowers being picked (by unique id) BEFORE they leave
      // garden state, so temporary copies can play the power-up at their spots.
      const pickedSnapshots = userPickableFlowers.map((f) => ({ ...f }))

      // Show picking message with lifetime total. The returned activity id links
      // the departing copies to this message so the effect starts when it shows.
      const pickActivityId = addActivity(
        `🌸 ${username.toUpperCase()} PICKED ${userPickableFlowers.length} FLOWERS! TOTAL PICKED: ${newPickedTotal}! USE !FLOWERS TO CHECK INVENTORY!`,
        5000,
        { type: "pick", username },
      )
      spawnDepartingFlowers(pickedSnapshots, pickActivityId)

      // Remove only the user's pickable flowers
      setFlowers((prev) =>
        prev.filter((f) => !(f.plantedBy === username && f.stage === "fully-mature" && now - f.plantedAt >= 300000)),
      )
      setGardenStats((prev) => ({
        ...prev,
        lastActivity: `${username} picked ${userPickableFlowers.length} of their own flowers!`,
      }))
    }

    const handlePickOldFlowers = (event: CustomEvent) => {
      const { username } = event.detail
      console.log(`Community Garden: ${username} picking old flowers`)

      const now = Date.now()
      const thirtyMinutesAgo = now - 30 * 60 * 1000 // 30 minutes in milliseconds
      const oldFlowers = flowers.filter((f) => f.plantedAt < thirtyMinutesAgo)

      if (oldFlowers.length === 0) {
        addActivity(`🧹 ${username.toUpperCase()}, NO FLOWERS OLDER THAN 30 MINUTES FOUND!`, 7000)
        return
      }

      // Remove flowers older than 30 minutes
      setFlowers((prev) => prev.filter((f) => f.plantedAt >= thirtyMinutesAgo))
      setGardenStats((prev) => ({
        ...prev,
        lastActivity: `${username} picked ${oldFlowers.length} old flowers!`,
      }))
      addActivity(
        `🧹 ${username.toUpperCase()} PICKED ${oldFlowers.length} OLD FLOWERS TO MAKE ROOM FOR NEW GROWTH!`,
        5000,
      )
    }

    const handleResetGarden = (event: CustomEvent) => {
      console.log("Community Garden: Resetting garden", event.detail)
      resetGarden()
    }

    const handleHideGarden = (event: CustomEvent) => {
      console.log("Community Garden: Hiding garden", event.detail)
      onHide()
    }

    const handleSpawnTestFlowers = () => {
      handleTestSpawn()
    }

    const handleTestBunnyVisit = () => {
      if (bunnyActive) {
        addActivity("🐰 BUNNY IS ALREADY VISITING THE GARDEN!", 3000)
        return
      }

      const matureFlowers = flowers.filter((f) => f.stage === "fully-mature")

      if (matureFlowers.length > 0) {
        triggerBunnyVisit(matureFlowers, true)
      } else {
        triggerBunnyVisitForWeeds()
      }
    }

    const handleMatureAllFlowers = (event: CustomEvent) => {
      const { username } = event.detail
      setFlowers((prev) => prev.map((flower) => ({ ...flower, stage: "fully-mature" as const })))
      addActivity(`✨ ${username.toUpperCase()} USED GARDEN BLESSING - ALL FLOWERS ARE NOW MATURE!`, 5000)
    }

    const handleRainbowRain = (event: CustomEvent) => {
      const { username } = event.detail
      addActivity(`🌈 ${username.toUpperCase()} TRIGGERED RAINBOW RAIN!`, 5000)

      // Trigger rainbow rain effect (enhanced version of regular rain)
      if (rainTimeoutRef) {
        clearTimeout(rainTimeoutRef)
      }

      const newTimeout = setTimeout(() => {
        console.log("Rainbow rain animation timer created")
      }, 100)
      setRainTimeoutRef(newTimeout)

      setTimeout(() => {
        if (rainTimeoutRef) {
          clearTimeout(rainTimeoutRef)
          setRainTimeoutRef(null)
        }
      }, 8000) // Longer duration for rainbow rain
    }

    const handleShowFlowerCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showFlowerCelebration event for", username)
      setCelebrationUsername(username)
      setShowFlowerCelebration(true)
      sendChatMessage(`Congratulations ${username}! You picked your 10th flower and earned the Budding Gardener achievement!`)
    }

    const handleShowGardenLegendCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showGardenLegendCelebration event for", username)
      setLegendCelebrationUsername(username)
      setShowGardenLegendCelebration(true)
      sendChatMessage(`Amazing! ${username} picked 20 flowers and become a Garden Legend!`)
    }

    const handleShowBeeParadeCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showBeeParadeCelebration event for", username)
      setBeeParadeUsername(username)
      setShowBeeParadeCelebration(true)
      sendChatMessage(`The garden is FULL! Time for a Bee Parade!`)
    }

    const handleShowMasterGardenerCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showMasterGardener event for", username)
      setMasterGardenerUsername(username)
      setShowMasterGardenerCelebration(true)
      sendChatMessage(`Incredible! ${username} picked 30 flowers and become a Master Gardener!`)
    }

    const handleShowNaturesGuardianCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showNaturesGuardian event for", username)
      setNaturesGuardianUsername(username)
      setShowNaturesGuardianCelebration(true)
      sendChatMessage(`ALL HAIL ${username}! With 50 flowers picked, they have been inducted into the GUILD OF GUARDIANS! Their name shall be forever honored in the stream credits!`)
    }

    const handleShowGardenEliteCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showGardenElite event for", username)
      setGardenEliteUsername(username)
      setShowGardenEliteCelebration(true)
      sendChatMessage(`Outstanding! ${username} picked 40 flowers and joined the Garden Elite!`)
    }

    const handleRequestLeaderboard = (event: CustomEvent) => {
      console.log("Community Garden: Received requestLeaderboard event", event.detail)
      // Dispatch leaderboard data to the leaderboard component
      window.dispatchEvent(
        new CustomEvent("showLeaderboard", {
          detail: { userPickedTotals },
        }),
      )
    }

    window.addEventListener("plantFlower", handlePlantFlower as EventListener)
    window.addEventListener("waterGarden", handleWaterGarden as EventListener)
    window.addEventListener("pickFlowers", handlePickFlowers as EventListener)
    window.addEventListener("pickOldFlowers", handlePickOldFlowers as EventListener)
    window.addEventListener("resetGarden", handleResetGarden as EventListener)
    window.addEventListener("hideGarden", handleHideGarden as EventListener)
    window.addEventListener("spawnTestFlowers", handleSpawnTestFlowers)
    window.addEventListener("testBunnyVisit", handleTestBunnyVisit)
    window.addEventListener("matureAllFlowers", handleMatureAllFlowers as EventListener)
    window.addEventListener("triggerRainbowRain", handleRainbowRain as EventListener)
    window.addEventListener("showFlowerCelebration", handleShowFlowerCelebration as EventListener)
    window.addEventListener("manualShowFlowerCelebration", handleShowFlowerCelebration as EventListener)
    window.addEventListener("showGardenLegendCelebration", handleShowGardenLegendCelebration as EventListener) // Add event listener for Garden Legend celebration
    window.addEventListener("showBeeParadeCelebration", handleShowBeeParadeCelebration as EventListener) // Add event listener for Bee Parade celebration
    window.addEventListener("showMasterGardener", handleShowMasterGardenerCelebration as EventListener) // Add event listener for Master Gardener celebration
    window.addEventListener("showNaturesGuardian", handleShowNaturesGuardianCelebration as EventListener) // Add event listener for Nature's Guardian celebration
    window.addEventListener("showGardenElite", handleShowGardenEliteCelebration as EventListener) // Add event listener for Garden Elite celebration
    window.addEventListener("requestLeaderboard", handleRequestLeaderboard as EventListener)

    // Set connected status
    onConnectionChange(isVisible)

    return () => {
      window.removeEventListener("plantFlower", handlePlantFlower as EventListener)
      window.removeEventListener("waterGarden", handleWaterGarden as EventListener)
      window.removeEventListener("pickFlowers", handlePickFlowers as EventListener)
      window.removeEventListener("pickOldFlowers", handlePickOldFlowers as EventListener)
      window.removeEventListener("resetGarden", handleResetGarden as EventListener)
      window.removeEventListener("hideGarden", handleHideGarden as EventListener)
      window.removeEventListener("spawnTestFlowers", handleSpawnTestFlowers)
      window.removeEventListener("testBunnyVisit", handleTestBunnyVisit)
      window.removeEventListener("matureAllFlowers", handleMatureAllFlowers as EventListener)
      window.removeEventListener("triggerRainbowRain", handleRainbowRain as EventListener)
      window.removeEventListener("showFlowerCelebration", handleShowFlowerCelebration as EventListener)
      window.removeEventListener("manualShowFlowerCelebration", handleShowFlowerCelebration as EventListener)
      window.removeEventListener("showGardenLegendCelebration", handleShowGardenLegendCelebration as EventListener) // Remove event listener for Garden Legend celebration
      window.removeEventListener("showBeeParadeCelebration", handleShowBeeParadeCelebration as EventListener) // Remove event listener for Bee Parade celebration
      window.removeEventListener("showMasterGardener", handleShowMasterGardenerCelebration as EventListener) // Remove event listener for Master Gardener celebration
      window.removeEventListener("showNaturesGuardian", handleShowNaturesGuardianCelebration as EventListener) // Remove event listener for Nature's Guardian celebration
      window.removeEventListener("showGardenElite", handleShowGardenEliteCelebration as EventListener) // Remove event listener for Garden Elite celebration
      window.removeEventListener("requestLeaderboard", handleRequestLeaderboard as EventListener)
      if (rainTimeoutRef) clearTimeout(rainTimeoutRef)
    }
  }, [isVisible, onConnectionChange, onHide, flowers])

  const addActivity = (activity: string, duration = 5000, meta?: GardenActivityMeta): string => {
    // Show one routine message at a time (newest wins); history stays bounded to 5.
    const item: GardenActivity = {
      id: nextActivityId(),
      message: activity,
      timestamp: Date.now(),
      type: meta?.type,
      username: meta?.username,
      flowerId: meta?.flowerId,
      flowerType: meta?.flowerType,
    }
    setRecentActivity((prev) => [item, ...prev.slice(0, 4)])

    // Lifetime is configurable via settings; falls back to the per-call duration.
    const effective = activityCfgRef.current.lifetimeMs > 0 ? activityCfgRef.current.lifetimeMs : duration
    setTimeout(() => {
      setRecentActivity((current) => current.filter((i) => i.id !== item.id))
    }, effective)
    // Returned so callers can associate departing-flower copies with this activity.
    return item.id
  }

  // Register temporary visual copies of flowers that were just removed (picked or
  // eaten). They render in the "waiting" phase and stay perfectly still until their
  // owning activity becomes the visible message, at which point the effect starts.
  const spawnDepartingFlowers = (snapshots: Flower[], activityId: string) => {
    if (!activityCfgRef.current.highlightEnabled) return
    if (snapshots.length === 0) return
    setDepartingFlowers((prev) => [
      ...prev,
      ...snapshots.map((f) => ({ key: `${activityId}_${f.id}`, activityId, flower: f, phase: "waiting" as const })),
    ])
  }

  // Start the power-up on every departing copy tied to `activityId`: switch them to
  // "animating", then to "leaving" (fade/shrink) after the color animation, then
  // remove them. All copies for one bunny/pick event animate simultaneously.
  const startDepartingAnimation = (activityId: string) => {
    setDepartingFlowers((prev) => {
      if (!prev.some((d) => d.activityId === activityId && d.phase === "waiting")) return prev
      return prev.map((d) => (d.activityId === activityId && d.phase === "waiting" ? { ...d, phase: "animating" } : d))
    })
    const dur = powerUpDuration(activityCfgRef.current.highlightMs)
    const toLeave = setTimeout(() => {
      setDepartingFlowers((prev) =>
        prev.map((d) => (d.activityId === activityId && d.phase === "animating" ? { ...d, phase: "leaving" } : d)),
      )
      const toRemove = setTimeout(() => {
        setDepartingFlowers((prev) => prev.filter((d) => d.activityId !== activityId))
        departTimersRef.current.delete(toRemove)
      }, DEPART_LEAVE_MS)
      departTimersRef.current.add(toRemove)
      departTimersRef.current.delete(toLeave)
    }, dur)
    departTimersRef.current.add(toLeave)
  }

  // Play the power-up effect on one specific flower sprite. Additive and
  // self-clearing; re-triggering the same flower refreshes its timer rather
  // than stacking. Duration mirrors the configured highlight duration so the
  // clear timer and the CSS animation stay in sync.
  const powerUpFlower = (flowerId: string) => {
    if (!activityCfgRef.current.highlightEnabled) return
    setHighlightedFlowerIds((prev) => (prev.includes(flowerId) ? prev : [...prev, flowerId]))
    const existing = highlightTimersRef.current.get(flowerId)
    if (existing) clearTimeout(existing)
    const t = setTimeout(() => {
      setHighlightedFlowerIds((prev) => prev.filter((id) => id !== flowerId))
      highlightTimersRef.current.delete(flowerId)
    }, powerUpDuration(activityCfgRef.current.highlightMs))
    highlightTimersRef.current.set(flowerId, t)
  }

  // Queue-safe synchronization: the effect fires only when an activity carrying a
  // flowerId becomes the VISIBLE (newest, index 0) message — never when it is
  // merely created or queued. Each visible activity triggers exactly once.
  //
  // Bounded consumed-tracking: `poweredActivityIdRef` holds only the single last
  // activated id (never grows). A timestamp-age check is the explicit mount-time
  // baseline — any activity older than STALE_ACTIVITY_MS (e.g. one restored or
  // still present at first mount) is marked consumed WITHOUT firing, so effects
  // cannot replay after a remount or unrelated rerender.
  useEffect(() => {
    const visible = recentActivity[0]
    if (!visible) {
      poweredActivityIdRef.current = null
      return
    }
    if (visible.id === poweredActivityIdRef.current) return
    poweredActivityIdRef.current = visible.id
    const isFresh = Date.now() - visible.timestamp <= STALE_ACTIVITY_MS
    if (!isFresh) return
    // Planted flower still lives in garden state → highlight it in place.
    if (visible.flowerId) powerUpFlower(visible.flowerId)
    // Picked / eaten flowers were removed → start their temporary-copy animations
    // now that this activity's message is the one on screen.
    startDepartingAnimation(visible.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentActivity])

  // Clear power-up + departing-flower timers on unmount.
  useEffect(() => {
    const departTimers = departTimersRef.current
    return () => {
      highlightTimersRef.current.forEach((t) => clearTimeout(t))
      highlightTimersRef.current.clear()
      departTimers.forEach((t) => clearTimeout(t))
      departTimers.clear()
    }
  }, [])

  // Test + clear controls for the centralized activity panel (from settings).
  useEffect(() => {
    const handleActivityTest = (e: Event) => {
      const kind = (e as CustomEvent<{ kind?: string }>).detail?.kind
      if (kind === "water") addActivity("💧 TESTGARDENER WATERED THE ENTIRE GARDEN!", 5000, { type: "water", username: "TestGardener" })
      else if (kind === "pick") addActivity("🌸 TESTGARDENER PICKED 3 OF THEIR OWN FLOWERS!", 5000, { type: "pick", username: "TestGardener" })
      else if (kind === "plant-burst") {
        // Rapid three-activity test: queue three plant activities back-to-back,
        // each carrying a DISTINCT flower id. Because effects only fire when an
        // activity becomes the visible message, the 2nd and 3rd flowers must stay
        // normal until their own message surfaces — verifying queue-safe timing.
        const flowers = flowersRef.current
        const targets = flowers.slice(-3)
        for (let i = 0; i < 3; i++) {
          const target = targets[targets.length - 1 - i] ?? flowers[flowers.length - 1]
          addActivity(`🌱 BURSTGARDENER PLANTED FLOWER #${i + 1}!`, 5000, {
            type: "plant",
            username: "BurstGardener",
            flowerId: target?.id,
          })
        }
      } else {
        // Attach the newest flower's id so the power-up fires when this message
        // becomes visible (queue-safe) rather than being triggered imperatively.
        const newest = flowersRef.current[flowersRef.current.length - 1]
        addActivity("🌱 TESTGARDENER PLANTED FLOWER #1! PLANT 1 MORE!", 5000, {
          type: "plant",
          username: "TestGardener",
          flowerId: newest?.id,
        })
      }
    }
    const handleActivityClear = () => setRecentActivity([])
    window.addEventListener("gardenActivityTest", handleActivityTest as EventListener)
    window.addEventListener("clearGardenActivity", handleActivityClear as EventListener)
    return () => {
      window.removeEventListener("gardenActivityTest", handleActivityTest as EventListener)
      window.removeEventListener("clearGardenActivity", handleActivityClear as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getFlowerDisplay = (flower: Flower) => {
    if (flower.stage === "sprout") {
      return (
        <img
          src="/garden/stages/sprout.webp"
          alt="Sprout"
          className="pixelated animate-bounce"
          style={{
            imageRendering: "pixelated",
            animationDuration: "3s",
            height: "80px", // Changed from 160px to 80px (50% smaller)
            width: "auto",
          }}
        />
      )
    }

    if (flower.stage === "blooming") {
      return (
        <img
          src="/garden/stages/sparkle.gif"
          alt="Blooming"
          className="pixelated animate-pulse"
          style={{
            imageRendering: "pixelated",
            maxHeight: "180px",
            width: "auto",
          }}
        />
      )
    }

    // Get flower-specific sizes (25% larger than original, but with natural variation)
    const getFlowerSize = (flowerType: string, stage: "small" | "medium" | "fully-mature") => {
      // Based on the original image dimensions and natural flower heights
      const baseSizes = {
        // Very tall flowers (naturally towering)
        sunflower: { small: 225, medium: 285, mature: 375 }, // Sunflowers tower over everything
        rose: { small: 210, medium: 270, mature: 360 }, // Rose bushes are tall and dense

        // Medium height flowers
        tulip: { small: 180, medium: 225, mature: 285 }, // Tulips are medium height
        daisy: { small: 172, medium: 217, mature: 270 }, // Oxeye daisies are medium
        poppy: { small: 165, medium: 210, mature: 262 }, // Poppies are delicate but medium

        // Shorter flowers (natural groundcover)
        lily: { small: 150, medium: 195, mature: 240 }, // Lily of the valley are short
        azure_bluet: { small: 135, medium: 180, mature: 225 }, // Azure bluets are tiny
        cornflower: { small: 142, medium: 187, mature: 232 }, // Cornflowers slightly taller
        allium: { small: 165, medium: 210, mature: 255 }, // Alliums medium-short
        blue_orchid: { small: 150, medium: 195, mature: 240 }, // Blue orchids medium-short
        cyan_flower: { small: 135, medium: 180, mature: 225 }, // Cyan flowers short
        peony: { small: 165, medium: 210, mature: 255 }, // Peonies medium-short
        lilac: { small: 165, medium: 210, mature: 255 }, // Lilacs medium-short
        wildflower: { small: 150, medium: 195, mature: 240 }, // Default wildflower
      }

      // Default for wildflowers or unknown types (medium size)
      const defaultSizes = { small: 110, medium: 140, mature: 170 }

      // Handle cases where flower.type might not be in baseSizes directly (e.g., specific wildflower images)
      const typeKey =
        Object.keys(baseSizes).find((key) => flowerType.toLowerCase().includes(key)) || flowerType.toLowerCase()

      if (baseSizes[typeKey as keyof typeof baseSizes]) {
        return baseSizes[typeKey as keyof typeof baseSizes]
      }
      return defaultSizes
    }

    if (flower.stage === "small") {
      let imageSrc = ""
      let flowerKey = flower.type
      if (flower.type === "wildflower") {
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowerImages.length
        imageSrc = wildflowerImages[randomIndex]
        // Extract flower name from path for sizing
        flowerKey = imageSrc.split("/").pop()?.split(".")[0] || "wildflower"
      } else {
        imageSrc = flowerImages[flower.type] || flowerImages.wildflower[0]
      }

      const sizes = getFlowerSize(flowerKey, "small")

      return (
        <img
          src={imageSrc || "/placeholder.svg"}
          alt="Small"
          className="pixelated"
          style={{
            imageRendering: "pixelated",
            maxHeight: "120px", // Fits well in container
            width: "auto", // Let width scale naturally
          }}
        />
      )
    }

    if (flower.stage === "medium") {
      let imageSrc = ""
      let flowerKey = flower.type
      if (flower.type === "wildflower") {
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowerImages.length
        imageSrc = wildflowerImages[randomIndex]
        // Extract flower name from path for sizing
        flowerKey = imageSrc.split("/").pop()?.split(".")[0] || "wildflower"
      } else {
        imageSrc = flowerImages[flower.type] || flowerImages.wildflower[0]
      }

      const sizes = getFlowerSize(flowerKey, "medium")

      return (
        <img
          src={imageSrc || "/placeholder.svg"}
          alt="Medium"
          className="pixelated"
          style={{
            imageRendering: "pixelated",
            maxHeight: "180px", // Fits well in container
            width: "auto", // Let width scale naturally
          }}
        />
      )
    }

    // Fully mature flowers - largest size, harvestable
    if (flower.stage === "fully-mature") {
      let imageSrc = ""
      let flowerKey = flower.type
      if (flower.type === "wildflower") {
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowerImages.length
        imageSrc = wildflowerImages[randomIndex]
        // Extract flower name from path for sizing
        flowerKey = imageSrc.split("/").pop()?.split(".")[0] || "wildflower"
      } else {
        imageSrc = flowerImages[flower.type] || flowerImages.wildflower[0]
      }

      return (
        <img
          src={imageSrc || "/placeholder.svg"}
          alt={flowerTypes[flower.type].name}
          className="pixelated"
          style={{
            imageRendering: "pixelated",
            maxHeight: "280px", // Fits within 320px container with room for bottom margin
            width: "auto", // Let width scale naturally
          }}
        />
      )
    }
    return null
  }

  const resetGarden = () => {
    setFlowers([])
    setUserPickedTotals({})
    setLastBunnyVisit(Date.now() - 6 * 60 * 1000) // Set to 6 minutes ago so bunny can spawn immediately
    setLastWaterTime(0)
    setGardenSaturation(100)
    setBunnyActive(false)
    setBunnyStartTime(null)
    setGardenStats({
      totalFlowers: 0,
      activeGardeners: 0,
      lastActivity: "Garden reset - ready for new growth!",
      waterLevel: 100,
    })
    setRecentActivity([])
    setShowFlowerCelebration(false) // Reset celebration state
    setCelebrationUsername("") // Reset celebration state
    setShowGardenLegendCelebration(false) // Reset celebration state
    setLegendCelebrationUsername("") // Reset celebration state
    setShowBeeParadeCelebration(false) // Reset celebration state
    setBeeParadeUsername("") // Reset celebration state
    setShowMasterGardenerCelebration(false) // Reset celebration state
    setMasterGardenerUsername("") // Reset celebration state
    setShowNaturesGuardianCelebration(false) // Reset celebration state
    setNaturesGuardianUsername("") // Reset celebration state
    setShowGardenEliteCelebration(false) // Reset celebration state
    setGardenEliteUsername("") // Reset celebration state
  }

  if (!isVisible) return null

  return (
    <>
      <FlowerCelebration
        isVisible={showFlowerCelebration}
        username={celebrationUsername}
        onHide={() => setShowFlowerCelebration(false)}
      />

      <GardenLegendCelebration
        isVisible={showGardenLegendCelebration}
        username={legendCelebrationUsername}
        onHide={() => setShowGardenLegendCelebration(false)}
      />

      <BeeParadeCelebration
        isVisible={showBeeParadeCelebration}
        username={beeParadeUsername}
        onHide={() => setShowBeeParadeCelebration(false)}
      />

      <MasterGardenerCelebration
        isVisible={showMasterGardenerCelebration}
        username={masterGardenerUsername}
        onHide={() => setShowMasterGardenerCelebration(false)}
      />

      <NaturesGuardianCelebration
        isVisible={showNaturesGuardianCelebration}
        username={naturesGuardianUsername}
        onHide={() => setShowNaturesGuardianCelebration(false)}
      />

      <GardenEliteCelebration
        isVisible={showGardenEliteCelebration}
        username={gardenEliteUsername}
        onHide={() => setShowGardenEliteCelebration(false)}
      />

      <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ bottom: `${GARDEN_BASELINE_BOTTOM_PX}px` }}>
        {/* Floating Activity Text - centered above garden */}
        {recentActivity.length > 0 && (
          <div
            className="absolute left-1/2 z-20 pointer-events-none"
            style={{
              bottom: `${activityCfg.offsetY}px`,
              width: `${activityCfg.width}px`,
              transform: `translateX(calc(-50% + ${activityCfg.offsetX}px))`,
            }}
          >
            <div
              className="mx-auto text-center"
              style={
                activityCfg.backgroundOpacity > 0
                  ? {
                      backgroundColor: `rgba(10, 10, 12, ${activityCfg.backgroundOpacity})`,
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      padding: "14px 22px",
                    }
                  : undefined
              }
            >
              <span
                className="text-white font-sans uppercase animate-pulse text-balance"
                style={{
                  fontSize: `${activityCfg.fontSize}px`,
                  lineHeight: OVERLAY_LINE_HEIGHT_STANDARD,
                  letterSpacing: 0,
                  fontWeight: OVERLAY_WEIGHT_LABEL,
                }}
              >
                {recentActivity[0].message}
              </span>
            </div>
          </div>
        )}

        {/* Main Garden Area - transparent background, no soil strip */}
        <div
          className="relative"
          style={{
            height: "320px", // Reverted to original 320px height
            overflow: "visible",
            filter: `saturate(${gardenSaturation}%)`,
            transition: "filter 2s ease-in-out",
          }}
        >
          {/* Dark Vernigosh mood tint. First in DOM with no z-index, so it paints
              beneath the flames, flowers, rain, and bunny and never obscures them.
              Always mounted so the glow can animate both in and out. */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background: DARK_GARDEN_TINT,
              opacity: darkMode ? 1 : 0,
              transition: `opacity ${DARK_TRANSITION_MS}ms ease-in-out`,
            }}
          />

          {/* Ambient flames, behind the flowers. Self-unmounting when inactive. */}
          <DarkGardenFlames active={darkMode} />

          {/* Rain Effect - scrolls across when watered */}
          {rainTimeoutRef && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 50,
                background: "transparent",
              }}
            >
              <img
                src="/garden/effects/rain.gif"
                alt="Rain"
                className="absolute top-0 pixelated"
                style={{
                  imageRendering: "pixelated",
                  width: "600px",
                  height: "100%",
                  objectFit: "cover",
                  left: "-600px",
                  animation: "rainSlide 5s linear forwards",
                }}
              />
            </div>
          )}

          {/* Chill Bunny Animation - fades in/out at random position */}
          {bunnyActive && (
            <div
              className="absolute bottom-2 transform -translate-x-1/2 pointer-events-none transition-opacity duration-2000 ease-in-out"
              style={{
                left: `${bunnyPosition}%`,
                opacity: bunnyOpacity,
                zIndex: 60,
              }}
            >
              <img
                src={
                  bunnyPhase === "eating"
                    ? "/garden/effects/pixelbunnyeating.gif"
                    : bunnyPhase === "arriving"
                      ? "/garden/effects/bunnyhoppingbackandforth.gif"
                      : bunnyPhase === "exploring"
                        ? "/garden/effects/bunnyhoppingbackandforth.gif"
                        : bunnyPhase === "playing"
                          ? "/garden/effects/bunnyhoppingbackandforth.gif"
                          : "/garden/effects/bunnyhoppingbackandforth.gif" // leaving phase
                }
                alt="Garden Bunny"
                className="pixelated"
                style={{
                  imageRendering: "pixelated",
                  width: "auto", // Let width scale naturally
                  height: "200px", // Increased from 110px to 200px
                  transform: bunnyPhase === "playing" ? "scaleX(-1)" : "scaleX(1)", // Flip bunny during playing phase
                  filter: bunnyPhase === "leaving" ? "brightness(0.7)" : "brightness(1)", // Dim bunny when leaving
                }}
              />
            </div>
          )}

          {/* Flowers */}
          {flowers.map((flower) => {
            // Calculate real-time stage for tooltip
            const now = Date.now()
            const timeSincePlanted = now - flower.plantedAt
            let currentStage: Flower["stage"] = "sprout"
            if (timeSincePlanted > 150000) currentStage = "fully-mature"
            else if (timeSincePlanted > 90000) currentStage = "medium"
            else if (timeSincePlanted > 60000) currentStage = "small"
            else if (timeSincePlanted > 45000) currentStage = "blooming"
            else currentStage = "sprout"

            const isPoweredUp = highlightedFlowerIds.includes(flower.id)
            const reduceMotion = gardenPrefersReducedMotion()
            // Power-up is applied directly to the sprite wrapper: no halo, ring, or
            // detached shape. Motion path cycles color/brightness and a tiny scale;
            // reduced-motion path holds a static brightness/saturation boost only.
            const powerUpClass = isPoweredUp ? (reduceMotion ? "gardenPowerUpStatic" : "gardenPowerUp") : ""
            const pu = intensityFactors(activityCfg.highlightIntensity)
            const powerUpStyle = isPoweredUp
              ? ({
                  animationDuration: `${powerUpCycleDuration(activityCfg.highlightMs)}ms`,
                  // Consumed by the keyframes / static class below.
                  ["--pu-bright" as string]: `${pu.brightness}`,
                  ["--pu-sat" as string]: `${pu.saturate}`,
                } as CSSProperties)
              : undefined
            return (
              <div
                key={flower.id}
                className="absolute bottom-2 transform -translate-x-1/2 transition-all duration-1000"
                style={{ left: `${flower.x}%` }}
                title={`${flowerTypes[flower.type].name}${flower.specificType ? ` (${flower.specificType})` : ""} by ${flower.plantedBy} (${currentStage}) - ${Math.floor(timeSincePlanted / 1000)}s old`}
              >
                {/* Dedicated wrapper for the Dark Vernigosh filter. Kept separate
                    from the power-up element because the power-up animates `filter`
                    via keyframes — setting both on one element would let the
                    animation clobber the crimson treatment. Nested filters compose,
                    so a flower can be powered up and crimson at the same time. */}
                <div style={darkSpriteStyle}>
                  <div className={powerUpClass} style={powerUpStyle}>
                    {getFlowerDisplay(flower)}
                  </div>
                </div>
                {/* Show sparkles only on non-fully-mature flowers */}
                {flower.stage !== "fully-mature" && (
                  <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>
                )}
              </div>
            )
          })}

          {/* Departing flowers: temporary copies of picked / eaten flowers, held at
              their original positions so the power-up + fade-away can play after the
              real flower has already left garden state. No halo or ring is used. */}
          {departingFlowers.map((d) => {
            const reduceMotion = gardenPrefersReducedMotion()
            const pu = intensityFactors(activityCfg.highlightIntensity)
            const animating = d.phase === "animating"
            const leaving = d.phase === "leaving"
            const effectClass = animating ? (reduceMotion ? "gardenPowerUpStatic" : "gardenPowerUp") : ""
            const effectStyle = animating
              ? ({
                  animationDuration: `${powerUpCycleDuration(activityCfg.highlightMs)}ms`,
                  ["--pu-bright" as string]: `${pu.brightness}`,
                  ["--pu-sat" as string]: `${pu.saturate}`,
                } as CSSProperties)
              : undefined
            return (
              <div
                key={d.key}
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2"
                style={{
                  left: `${d.flower.x}%`,
                  // Match the live flower's -translate-x-1/2 anchor, then fade/shrink on leave.
                  transform: `translateX(-50%) scale(${leaving ? 0.85 : 1})`,
                  opacity: leaving ? 0 : 1,
                  transition: `opacity ${DEPART_LEAVE_MS}ms ease, transform ${DEPART_LEAVE_MS}ms ease`,
                }}
              >
                {/* Same crimson wrapper as the live flowers, so a flower picked or
                    eaten during Dark Vernigosh doesn't snap back to its normal
                    colours for its fade-away. */}
                <div style={darkSpriteStyle}>
                  <div className={effectClass} style={effectStyle}>
                    {getFlowerDisplay(d.flower)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Global CSS for flower sizing and rain animation */}
      <style jsx global>{`
        @keyframes rainSlide {
          0% {
            left: -600px;
            opacity: 1;
          }
          100% {
            left: 100vw;
            opacity: 0.8;
          }
        }
        /* Restrained classic power-up: the sprite briefly cycles a few bright
           colors, gains brightness/saturation, grows a hair (max ~1.05), and
           returns to its EXACT original state at 100%. Peak brightness/saturation
           come from --pu-bright / --pu-sat (driven by the intensity setting). A
           silhouette-following glow uses drop-shadow so it hugs the sprite rather
           than forming a detached disc. No white/black flash, no strobe. */
        @keyframes gardenPowerUp {
          0% {
            filter: brightness(1) saturate(1) hue-rotate(0deg);
            transform: scale(1);
          }
          20% {
            filter: brightness(var(--pu-bright, 1.4)) saturate(calc(var(--pu-sat, 1.9) * 0.95))
              hue-rotate(35deg) drop-shadow(0 0 4px rgba(255, 220, 90, 0.8));
            transform: scale(1.04);
          }
          42% {
            filter: brightness(calc(var(--pu-bright, 1.4) * 0.95)) saturate(var(--pu-sat, 1.9))
              hue-rotate(145deg) drop-shadow(0 0 4px rgba(80, 230, 255, 0.8));
            transform: scale(1.05);
          }
          64% {
            filter: brightness(var(--pu-bright, 1.4)) saturate(calc(var(--pu-sat, 1.9) * 0.97))
              hue-rotate(255deg) drop-shadow(0 0 4px rgba(255, 100, 220, 0.8));
            transform: scale(1.04);
          }
          82% {
            filter: brightness(calc(var(--pu-bright, 1.4) * 0.92)) saturate(calc(var(--pu-sat, 1.9) * 0.85))
              hue-rotate(65deg);
            transform: scale(1.02);
          }
          100% {
            filter: brightness(1) saturate(1) hue-rotate(0deg);
            transform: scale(1);
          }
        }
        .gardenPowerUp {
          animation-name: gardenPowerUp;
          animation-duration: 1300ms;
          animation-timing-function: ease-in-out;
          animation-iteration-count: 3;
          transform-origin: center bottom;
          will-change: filter, transform;
        }
        /* Reduced-motion: a static, non-animated brightness/saturation lift that
           still makes the referenced flower obvious, with no movement or hue cycling. */
        .gardenPowerUpStatic {
          filter: brightness(var(--pu-bright, 1.35)) saturate(var(--pu-sat, 1.6))
            drop-shadow(0 0 4px rgba(255, 220, 120, 0.85));
        }
        @media (prefers-reduced-motion: reduce) {
          .gardenPowerUp {
            animation: none;
            filter: brightness(var(--pu-bright, 1.35)) saturate(var(--pu-sat, 1.6))
              drop-shadow(0 0 4px rgba(255, 220, 120, 0.85));
          }
        }
      `}</style>
    </>
  )
}
