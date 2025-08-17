"use client"

import { useState, useEffect, useRef } from "react"

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
}

const flowerTypes = {
  rose: { name: "Rose", growthTime: 45000 }, // 45 seconds to sprout->blooming
  tulip: { name: "Tulip", growthTime: 45000 },
  sunflower: { name: "Sunflower", growthTime: 45000 },
  daisy: { name: "Daisy", growthTime: 45000 },
  lily: { name: "Lily", growthTime: 45000 },
  wildflower: { name: "Wildflower", growthTime: 45000 },
}

export function CommunityGarden({ isVisible, onConnectionChange, onHide }: CommunityGardenProps) {
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [gardenStats, setGardenStats] = useState({
    totalFlowers: 0,
    activeGardeners: 0,
    lastActivity: "",
    waterLevel: 100, // Garden health
  })
  const [recentActivity, setRecentActivity] = useState<string[]>([])
  const [showRainEffect, setShowRainEffect] = useState(false)
  const [bunnyActive, setBunnyActive] = useState(false)
  const [bunnyPhase, setBunnyPhase] = useState<"arriving" | "exploring" | "eating" | "playing" | "leaving">("arriving")
  const [bunnyOpacity, setBunnyOpacity] = useState(0)
  const [lastBunnyVisit, setLastBunnyVisit] = useState(Date.now())
  const [bunnyEatenCount, setBunnyEatenCount] = useState(0)
  const [bunnyPosition, setBunnyPosition] = useState(50)
  const growthIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const rainTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [flowerReveals, setFlowerReveals] = useState<{ [key: string]: { type: string; x: number; timestamp: number } }>(
    {},
  )

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
        x: 18 + (77 / 19) * i, // Evenly distribute across available space
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
    addActivity(`🧪 TEST SPAWNED 20 FLOWERS AT DIFFERENT STAGES!`)
  }

  const triggerBunnyVisit = (matureFlowers: Flower[]) => {
    setBunnyActive(true)
    setBunnyPhase("arriving")
    setBunnyOpacity(0)
    setLastBunnyVisit(Date.now())

    // Calculate how many flowers to eat (1-5 or up to half the mature flowers)
    const maxToEat = Math.min(5, Math.ceil(matureFlowers.length / 2))
    const flowersToEat = Math.floor(Math.random() * maxToEat) + 1
    setBunnyEatenCount(flowersToEat)

    // Pick a random position along the flower bed (same range as flowers)
    const bunnyX = Math.random() * 77 + 18 // 18% to 95% to match flower positions
    setBunnyPosition(bunnyX)

    // Just one initial message
    addActivity(`🐰 A WILD BUNNY APPEARS IN THE GARDEN!`)

    // New extended chill animation sequence
    // Phase 1: Fade in and explore for much longer (12 seconds)
    setTimeout(() => {
      setBunnyPhase("exploring")
      setBunnyOpacity(1)
    }, 500)

    // Phase 2: Start eating (after 12.5 seconds total)
    setTimeout(() => {
      setBunnyPhase("eating")

      // Remove random mature flowers
      setFlowers((prev) => {
        const mature = prev.filter((f) => f.stage === "fully-mature")
        const toKeep = prev.filter((f) => f.stage !== "fully-mature")
        const shuffled = [...mature].sort(() => Math.random() - 0.5)
        const remaining = shuffled.slice(flowersToEat)
        return [...toKeep, ...remaining]
      })
    }, 12500)

    // Phase 3: Play around after eating (after 19.5 seconds total)
    setTimeout(() => {
      setBunnyPhase("playing")
    }, 19500)

    // Phase 4: Start leaving (after 27.5 seconds total)
    setTimeout(() => {
      setBunnyPhase("leaving")
      setBunnyOpacity(0)

      // Clean up after fade out completes
      setTimeout(() => {
        setBunnyActive(false)
      }, 2000)
    }, 27500)
  }

  // New 5-stage growth system: 0-45s sprout, 45s-60s blooming, 60s-90s small, 90s-150s medium, 150s+ fully-mature
  useEffect(() => {
    if (!isVisible) return

    growthIntervalRef.current = setInterval(() => {
      setFlowers((prevFlowers) => {
        const now = Date.now()
        const timeSinceLastBunny = now - lastBunnyVisit
        if (timeSinceLastBunny > 20 * 60 * 1000 && !bunnyActive) {
          // 20 minutes
          const matureFlowers = prevFlowers.filter((f) => f.stage === "fully-mature")
          if (matureFlowers.length > 0) {
            triggerBunnyVisit(matureFlowers)
          }
        }

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
    }, 5000)

    return () => {
      if (growthIntervalRef.current) clearInterval(growthIntervalRef.current)
    }
  }, [isVisible])

  // Chat command handlers
  useEffect(() => {
    const handlePlantFlower = (event: CustomEvent) => {
      const { username } = event.detail // Remove flowerType and color from destructuring

      // Randomize flower type
      const flowerTypeKeys = Object.keys(flowerTypes) as Array<keyof typeof flowerTypes>
      const randomFlowerType = flowerTypeKeys[Math.floor(Math.random() * flowerTypeKeys.length)]

      console.log(`Community Garden: ${username} planting ${randomFlowerType}`)

      const now = Date.now()
      // Check if user has planted 2 flowers recently (allow 2 flowers per user)
      const userFlowers = flowers.filter((f) => f.plantedBy === username && now - f.plantedAt < 300000)
      if (userFlowers.length >= 2) {
        console.log("Community Garden: User has reached flower limit")
        addActivity(`🌸 ${username.toUpperCase()}, YOU'VE PLANTED YOUR 2 FLOWERS! WAIT 5 MINUTES TO PLANT MORE.`)
        return
      }

      // Check if garden is full
      if (flowers.length >= 20) {
        console.log("Community Garden: Garden is full")
        addActivity(`🌸 GARDEN IS FULL! TRY HARVESTING SOME FLOWERS FIRST.`)
        return
      }

      // Find available position - avoid logo area
      const usedPositions = flowers.map((f) => f.x)
      let newX = Math.random() * 77 + 18 // 18% to 95% to avoid logo area

      // Try to avoid overlapping
      let attempts = 0
      while (attempts < 10 && usedPositions.some((pos) => Math.abs(pos - newX) < 8)) {
        newX = Math.random() * 77 + 18
        attempts++
      }

      // Determine specific flower type for tulips
      let specificType = ""
      if (randomFlowerType === "tulip") {
        const tulipColors = ["red", "orange", "pink", "white"]
        specificType = tulipColors[Math.floor(Math.random() * tulipColors.length)]
      }

      const newFlower: Flower = {
        id: `${username}-${now}`,
        type: randomFlowerType,
        color: "mixed",
        x: newX,
        plantedBy: username,
        plantedAt: now,
        stage: "sprout",
        lastWatered: now,
        specificType,
      }

      setFlowers((prev) => [...prev, newFlower])
      setGardenStats((prev) => ({
        ...prev,
        totalFlowers: prev.totalFlowers + 1,
        lastActivity: `${username} planted a ${flowerTypes[newFlower.type].name}!`,
      }))
      addActivity(`🌱 ${username.toUpperCase()} PLANTED A FLOWER`)
    }

    const handleWaterGarden = (event: CustomEvent) => {
      const { username } = event.detail
      console.log(`Community Garden: ${username} watering the garden - showRainEffect currently:`, showRainEffect)

      const now = Date.now()
      // Water all flowers
      setFlowers((prev) => prev.map((flower) => ({ ...flower, lastWatered: now })))
      setGardenStats((prev) => ({
        ...prev,
        waterLevel: Math.min(100, prev.waterLevel + 10),
        lastActivity: `${username} watered the garden!`,
      }))
      addActivity(`💧 ${username.toUpperCase()} WATERED THE ENTIRE GARDEN!`)

      // Show rain effect for 5 seconds - improved approach
      console.log("Starting rain animation...")
      if (rainTimeoutRef.current) clearTimeout(rainTimeoutRef.current)

      // Force a clean reset
      setShowRainEffect(false)

      // Start the animation after a brief reset
      setTimeout(() => {
        setShowRainEffect(true)

        // Stop after 5 seconds
        rainTimeoutRef.current = setTimeout(() => {
          console.log("Stopping rain animation...")
          setShowRainEffect(false)
        }, 5000)
      }, 50)
    }

    const handlePickFlowers = (event: CustomEvent) => {
      const { username } = event.detail
      console.log(`Community Garden: ${username} picking their own flowers`)

      const now = Date.now()
      const userFlowers = flowers.filter((f) => f.plantedBy === username)
      const userMatureFlowers = userFlowers.filter((f) => f.stage === "fully-mature")
      const userPickableFlowers = userMatureFlowers.filter((f) => now - f.plantedAt >= 300000) // 5+ minutes old

      if (userFlowers.length === 0) {
        addActivity(`🌱 ${username.toUpperCase()}, YOU HAVEN'T PLANTED ANY FLOWERS YET!`)
        return
      }

      if (userMatureFlowers.length === 0) {
        addActivity(`🌱 ${username.toUpperCase()}, YOUR FLOWERS AREN'T READY TO PICK YET!`)
        return
      }

      if (userPickableFlowers.length === 0) {
        addActivity(
          `⏰ ${username.toUpperCase()}, YOUR ${userMatureFlowers.length} MATURE FLOWERS ARE STILL TOO YOUNG TO PICK!`,
        )
        return
      }

      // Show the nice message format for user's own flowers
      if (userPickableFlowers.length < userMatureFlowers.length) {
        addActivity(
          `🌸 ${username.toUpperCase()}, YOU HAVE ${userMatureFlowers.length} MATURE FLOWERS, BUT ONLY ${userPickableFlowers.length} WERE READY TO PICK!`,
        )
      } else {
        addActivity(`🌸 ${username.toUpperCase()} PICKED ${userPickableFlowers.length} OF THEIR OWN BEAUTIFUL FLOWERS!`)
      }

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
        addActivity(`🧹 ${username.toUpperCase()}, NO FLOWERS OLDER THAN 30 MINUTES FOUND!`)
        return
      }

      // Remove flowers older than 30 minutes
      setFlowers((prev) => prev.filter((f) => f.plantedAt >= thirtyMinutesAgo))
      setGardenStats((prev) => ({
        ...prev,
        lastActivity: `${username} picked ${oldFlowers.length} old flowers!`,
      }))
      addActivity(`🧹 ${username.toUpperCase()} PICKED ${oldFlowers.length} OLD FLOWERS TO MAKE ROOM FOR NEW GROWTH!`)
    }

    const handleResetGarden = (event: CustomEvent) => {
      console.log("Community Garden: Resetting garden", event.detail)
      setFlowers([])
      setLastBunnyVisit(Date.now()) // Reset bunny timer
      setBunnyActive(false)
      setGardenStats({
        totalFlowers: 0,
        activeGardeners: 0,
        lastActivity: "Garden reset - ready for new growth!",
        waterLevel: 100,
      })
      setRecentActivity([])
    }

    const handleHideGarden = (event: CustomEvent) => {
      console.log("Community Garden: Hiding garden", event.detail)
      onHide()
    }

    const handleSpawnTestFlowers = () => {
      handleTestSpawn()
    }

    const handleTestBunnyVisit = () => {
      console.log("Manual test: Triggering bunny visit")
      // Create some test mature flowers if none exist
      const matureFlowers = flowers.filter((f) => f.stage === "fully-mature")
      if (matureFlowers.length === 0) {
        // Create test mature flowers - specifically roses and sunflowers to test cropping
        const now = Date.now()
        const testMatureFlowers: Flower[] = []

        // Add 2 roses and 2 sunflowers for cropping test - make sure they have unique IDs
        const testFlowerData = [
          { type: "rose", user: "TestUser0" },
          { type: "sunflower", user: "TestUser1" },
          { type: "rose", user: "TestUser2" },
          { type: "sunflower", user: "TestUser3" },
        ] as const

        for (let i = 0; i < 4; i++) {
          testMatureFlowers.push({
            id: `test-mature-${now}-${i}-${testFlowerData[i].type}`, // More unique ID
            type: testFlowerData[i].type,
            color: "mixed",
            x: 25 + i * 20, // Spread them out: 25%, 45%, 65%, 85%
            plantedBy: testFlowerData[i].user,
            plantedAt: now - 400000, // Old enough to be mature
            stage: "fully-mature",
            lastWatered: now,
          })
        }
        setFlowers((prev) => [...prev, ...testMatureFlowers])

        // Trigger bunny after flowers are added
        setTimeout(() => {
          triggerBunnyVisit(testMatureFlowers)
        }, 100)
      } else {
        triggerBunnyVisit(matureFlowers)
      }
    }

    window.addEventListener("plantFlower", handlePlantFlower as EventListener)
    window.addEventListener("waterGarden", handleWaterGarden as EventListener)
    window.addEventListener("pickFlowers", handlePickFlowers as EventListener)
    window.addEventListener("pickOldFlowers", handlePickOldFlowers as EventListener)
    window.addEventListener("resetGarden", handleResetGarden as EventListener)
    window.addEventListener("hideGarden", handleHideGarden as EventListener)
    window.addEventListener("spawnTestFlowers", handleSpawnTestFlowers)
    window.addEventListener("testBunnyVisit", handleTestBunnyVisit)

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
      if (rainTimeoutRef.current) clearTimeout(rainTimeoutRef.current)
    }
  }, [isVisible, onConnectionChange, onHide, flowers])

  const addActivity = (activity: string) => {
    setRecentActivity((prev) => [activity, ...prev.slice(0, 4)])

    // Clear banner after 15 seconds (increased from 10 seconds)
    setTimeout(() => {
      setRecentActivity((current) => current.filter((item) => item !== activity))
    }, 15000)
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
        sunflower: { small: 180, medium: 220, mature: 280 }, // Sunflowers are the tallest

        // Tall flowers
        lilac: { small: 160, medium: 200, mature: 250 }, // Lilacs grow tall and bushy
        allium: { small: 150, medium: 190, mature: 240 }, // Alliums on tall stems

        // Medium-tall flowers
        rose: { small: 140, medium: 180, mature: 220 }, // Rose bushes are substantial
        peony: { small: 145, medium: 185, mature: 230 }, // Peonies are full and tall

        // Medium height flowers
        tulip: { small: 120, medium: 150, mature: 190 }, // Tulips are medium height
        daisy: { small: 115, medium: 145, mature: 180 }, // Oxeye daisies are medium
        poppy: { small: 110, medium: 140, mature: 175 }, // Poppies are delicate but medium

        // Shorter flowers
        lily: { small: 100, medium: 130, mature: 160 }, // Lily of valley is low-growing
        cornflower: { small: 95, medium: 125, mature: 155 }, // Cornflowers are compact
        "blue-orchid": { small: 90, medium: 120, mature: 150 }, // Orchids are elegant but shorter

        // Small/ground flowers
        "azure-bluet": { small: 70, medium: 90, mature: 120 }, // Very small wildflowers
        "cyan-flower": { small: 75, medium: 95, mature: 125 }, // Small wildflowers
      }

      // Default for wildflowers or unknown types (medium size)
      const defaultSizes = { small: 110, medium: 140, mature: 170 }

      return baseSizes[flowerType as keyof typeof baseSizes] || defaultSizes
    }

    if (flower.stage === "small") {
      const flowerImages = {
        rose: "/garden/flowers/rose-bush.webp",
        tulip: flower.specificType
          ? `/garden/flowers/${flower.specificType}-tulip.webp`
          : "/garden/flowers/red-tulip.webp",
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

      let imageSrc = ""
      let flowerKey = flower.type
      if (flower.type === "wildflower") {
        const wildflowers = flowerImages.wildflower as string[]
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowers.length
        imageSrc = wildflowers[randomIndex]
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
      const flowerImages = {
        rose: "/garden/flowers/rose-bush.webp",
        tulip: flower.specificType
          ? `/garden/flowers/${flower.specificType}-tulip.webp`
          : "/garden/flowers/red-tulip.webp",
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

      let imageSrc = ""
      let flowerKey = flower.type
      if (flower.type === "wildflower") {
        const wildflowers = flowerImages.wildflower as string[]
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowers.length
        imageSrc = wildflowers[randomIndex]
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
      const flowerImages = {
        rose: "/garden/flowers/rose-bush.webp",
        tulip: flower.specificType
          ? `/garden/flowers/${flower.specificType}-tulip.webp`
          : "/garden/flowers/red-tulip.webp",
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

      let imageSrc = ""
      let flowerKey = flower.type
      if (flower.type === "wildflower") {
        const wildflowers = flowerImages.wildflower as string[]
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowers.length
        imageSrc = wildflowers[randomIndex]
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

  // Add this debugging function after the getFlowerSize function
  const debugFlowerPositioning = (flower: Flower, element: HTMLElement | null) => {
    if (element) {
      const rect = element.getBoundingClientRect()
      const flowerKey = flower.type === "wildflower" ? "wildflower" : flower.type
      console.log(`🌸 DEBUG: ${flower.type} (${flower.stage})`, {
        flowerHeight: rect.height,
        flowerWidth: rect.width,
        bottomPosition: window.innerHeight - rect.bottom,
        topPosition: rect.top,
        isClipped: rect.top < 0,
        containerHeight: element.closest('[style*="height: 320px"]')?.getBoundingClientRect().height,
      })
    }
  }

  if (!isVisible) return null

  return (
    <>
      <div className="fixed left-0 right-0 z-10" style={{ bottom: "72px" }}>
        {/* Floating Activity Text - centered above garden */}
        {recentActivity.length > 0 && (
          <div
            className="fixed left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
            style={{ bottom: "476px" }} // Updated position
          >
            <div className="text-center">
              <span className="text-2xl font-black text-white font-sans uppercase animate-pulse">
                {recentActivity[0]}
              </span>
            </div>
          </div>
        )}

        {/* Main Garden Area - transparent background, no soil strip */}
        <div className="relative" style={{ height: "320px", overflow: "visible" }}>
          {/* Rain Effect - scrolls across when watered */}
          {showRainEffect && (
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
                    : "/garden/effects/bunnyhoppingbackandforth.gif"
                }
                alt="Garden Bunny"
                className="pixelated"
                style={{
                  imageRendering: "pixelated",
                  width: "auto", // Let width scale naturally
                  height: "110px", // Set height to 110px (half of rose mature size 220px)
                }}
              />
            </div>
          )}

          {/* Flower Reveals - centered horizontally above garden */}
          {Object.keys(flowerReveals).map((flowerId) => (
            <div
              key={flowerId}
              className="fixed left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
              style={{ bottom: "506px", left: `${flowerReveals[flowerId].x}%` }} // Updated position
            >
              <span className="text-2xl font-black text-white font-sans uppercase animate-pulse">
                {flowerReveals[flowerId].type}
              </span>
            </div>
          ))}

          {/* Flowers */}
          {flowers.map((flower) => (
            <div
              key={flower.id}
              className="absolute bottom-2 transform -translate-x-1/2 transition-all duration-1000"
              style={{ left: `${flower.x}%` }}
              title={`${flowerTypes[flower.type].name}${flower.specificType ? ` (${flower.specificType})` : ""} by ${flower.plantedBy} (${flower.stage}) - ${Math.floor((Date.now() - flower.plantedAt) / 1000)}s old`}
              ref={(el) => {
                // Debug positioning for tall flowers
                if (flower.stage === "fully-mature" && (flower.type === "sunflower" || flower.type === "rose")) {
                  debugFlowerPositioning(flower, el)
                }
              }}
            >
              {getFlowerDisplay(flower)}
              {/* Show sparkles only on non-fully-mature flowers */}
              {flower.stage !== "fully-mature" && (
                <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>
              )}
            </div>
          ))}
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
