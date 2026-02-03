"use client"

import { useState, useEffect, useRef } from "react"
import FlowerCelebration from "./flower-celebration" // Import FlowerCelebration component
import { GardenLegendCelebration } from "./garden-legend-celebration" // Import the new Garden Legend celebration component
import { BeeParadeCelebration } from "./bee-parade-celebration" // Import the new Bee Parade celebration component
import { MasterGardenerCelebration } from "./master-gardener-celebration" // Import the new Master Gardener celebration component
import { NaturesGuardianCelebration } from "./natures-guardian-celebration" // Import the new Nature's Guardian celebration component
import { GardenEliteCelebration } from "./garden-elite-celebration" // Import the new Garden Elite celebration component

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

interface CommunityGardenProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
  onFlowerLegendsUpdate?: (legends: Array<{ username: string; count: number }>) => void
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

export function CommunityGarden({ isVisible, onConnectionChange, onHide, onFlowerLegendsUpdate }: CommunityGardenProps) {
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [gardenStats, setGardenStats] = useState({
    totalFlowers: 0,
    activeGardeners: 0,
    lastActivity: "",
    waterLevel: 100, // Garden health
  })
  const [recentActivity, setRecentActivity] = useState<string[]>([])
  const [bunnyActive, setBunnyActive] = useState(false)
  const [bunnyPhase, setBunnyPhase] = useState<"arriving" | "exploring" | "eating" | "playing" | "leaving">("arriving")
  const [bunnyOpacity, setBunnyOpacity] = useState(0)
  const [lastBunnyVisit, setLastBunnyVisit] = useState(Date.now() - 5 * 60 * 1000) // Start 5 minutes ago so bunny can appear immediately
  const [bunnyEatenCount, setBunnyEatenCount] = useState(0)
  const [bunnyPosition, setBunnyPosition] = useState(50)
  const [bunnyStartTime, setBunnyStartTime] = useState<number | null>(null) // Track when bunny visit started
  const growthIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [rainTimeoutRef, setRainTimeoutRef] = useState<NodeJS.Timeout | null>(null) // Use state for rain timeout
  const [flowerReveals, setFlowerReveals] = useState<{ [key: string]: { type: string; x: number; timestamp: number } }>(
    {},
  )
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
      const phase2Duration = 5000 // eating/exploring - changed from 10000 to 5000
      const phase3Duration = 10000 // playing/leaving - changed from 5000 to 10000

      if (elapsed < phase1Duration) {
        setBunnyPhase("arriving")
        setBunnyOpacity(Math.min(1, elapsed / 1000))
      } else if (elapsed < phase1Duration + phase2Duration) {
        if (bunnyPhase !== "eating") {
          setBunnyPhase("eating")
          setBunnyOpacity(1)

          if (bunnyEatenCount > 0) {
            addActivity(`🐰 THE BUNNY IS MUNCHING ON ${bunnyEatenCount} DELICIOUS FLOWERS!`, 4000)

            // Remove flowers from garden
            setFlowers((currentFlowers) => {
              const matureFlowers = currentFlowers.filter((f) => f.stage === "fully-mature")
              const flowersToRemove = matureFlowers.slice(0, bunnyEatenCount)
              const remainingFlowers = currentFlowers.filter((f) => !flowersToRemove.includes(f))
              return remainingFlowers
            })
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
          const oldStage = flower.stage

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

          // Trigger reveal when flower reaches small stage (after sparkle)
          if (oldStage === "blooming" && newStage === "small") {
            const flowerName = flowerTypes[flower.type].name.toUpperCase()

            setFlowerReveals((prev) => ({
              ...prev,
              [flower.id]: {
                type: `${flower.plantedBy.toUpperCase()}'S ${flowerName}!`,
                x: flower.x,
                timestamp: Date.now(),
              },
            }))

            // Remove reveal after 3 seconds
            setTimeout(() => {
              setFlowerReveals((prev) => {
                const newReveals = { ...prev }
                delete newReveals[flower.id]
                return newReveals
              })
            }, 3000)
          }

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

      // Clean session-based messaging
      if (userFlowerCount === 1) {
        addActivity(`🌱 ${username.toUpperCase()} PLANTED FLOWER #${userFlowerCount}! PLANT 1 MORE!`, 5000)
      } else {
        addActivity(`🌸 ${username.toUpperCase()} PLANTED FLOWER #${userFlowerCount}! PLOT COMPLETE!`, 5000)
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
      addActivity(`💧 ${username.toUpperCase()} WATERED THE ENTIRE GARDEN!`, 5000)

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

      if (newPickedTotal >= 50 && (userPickedTotals[username] || 0) < 50) {
        window.dispatchEvent(new CustomEvent("showNaturesGuardian", { detail: { username } }))
        // Save guardian to database
        fetch("/api/guardians/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, flowerCount: newPickedTotal }),
        }).catch((err) => console.error("Failed to save guardian:", err))
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

      // Show picking message with lifetime total
      addActivity(
        `🌸 ${username.toUpperCase()} PICKED ${userPickableFlowers.length} FLOWERS! TOTAL PICKED: ${newPickedTotal}! USE !FLOWERS TO CHECK INVENTORY!`,
        5000,
      )

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
    }

    const handleShowGardenLegendCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showGardenLegendCelebration event for", username)
      setLegendCelebrationUsername(username)
      setShowGardenLegendCelebration(true)
    }

    const handleShowBeeParadeCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showBeeParadeCelebration event for", username)
      setBeeParadeUsername(username)
      setShowBeeParadeCelebration(true)
    }

    const handleShowMasterGardenerCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showMasterGardener event for", username)
      setMasterGardenerUsername(username)
      setShowMasterGardenerCelebration(true)
    }

    const handleShowNaturesGuardianCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showNaturesGuardian event for", username)
      setNaturesGuardianUsername(username)
      setShowNaturesGuardianCelebration(true)
    }

    const handleShowGardenEliteCelebration = (event: CustomEvent) => {
      const { username } = event.detail
      console.log("Page: Received showGardenElite event for", username)
      setGardenEliteUsername(username)
      setShowGardenEliteCelebration(true)
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

  const addActivity = (activity: string, duration = 5000) => {
    setRecentActivity((prev) => [activity, ...prev.slice(0, 4)])

    // Clear banner after specified duration
    setTimeout(() => {
      setRecentActivity((current) => current.filter((item) => item !== activity))
    }, duration)
  }

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

      <div className="fixed left-0 right-0 z-10" style={{ bottom: "38px" }}>
        {/* Floating Activity Text - centered above garden */}
        {recentActivity.length > 0 && (
          <div
            className="fixed left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
            style={{ bottom: "328px" }} // Moving activity text down 5px: 333px -> 328px
          >
            <div className="text-center">
              <span className="text-2xl font-black text-white font-sans uppercase animate-pulse">
                {recentActivity[0]}
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

          {/* Flower Reveals - centered horizontally above garden */}
          {Object.keys(flowerReveals).map((flowerId) => (
            <div
              key={flowerId}
              className="fixed transform -translate-x-1/2 z-30 pointer-events-none"
              style={{ bottom: "358px", left: `${flowerReveals[flowerId].x}%` }} // Moving flower reveals down 5px: 363px -> 358px
            >
              <span className="text-2xl font-black text-white font-sans uppercase animate-pulse">
                {flowerReveals[flowerId].type}
              </span>
            </div>
          ))}

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

            return (
              <div
                key={flower.id}
                className="absolute bottom-2 transform -translate-x-1/2 transition-all duration-1000"
                style={{ left: `${flower.x}%` }}
                title={`${flowerTypes[flower.type].name}${flower.specificType ? ` (${flower.specificType})` : ""} by ${flower.plantedBy} (${currentStage}) - ${Math.floor(timeSincePlanted / 1000)}s old`}
              >
                {getFlowerDisplay(flower)}
                {/* Show sparkles only on non-fully-mature flowers */}
                {flower.stage !== "fully-mature" && (
                  <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>
                )}
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
      `}</style>
    </>
  )
}
