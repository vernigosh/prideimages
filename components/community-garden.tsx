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
  const bunnyTimeoutsRef = useRef<NodeJS.Timeout[]>([]) // Track all bunny timeouts
  const [flowerReveals, setFlowerReveals] = useState<{ [key: string]: { type: string; x: number; timestamp: number } }>(
    {},
  )
  const [lastWaterTime, setLastWaterTime] = useState(0) // New state variable for tracking the last water time
  const [userFlowerCounts, setUserFlowerCounts] = useState<{ [username: string]: number }>({}) // New state for user flower totals
  const [userPickedTotals, setUserPickedTotals] = useState<{ [username: string]: number }>({}) // New state for lifetime picked totals

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
        x: 18 + (67 / 19) * i, // Evenly distribute across available space (18% to 85%)
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

  const triggerBunnyVisit = (matureFlowers: Flower[]) => {
    const now = Date.now()

    // Enhanced safety check with detailed logging
    if (now - lastBunnyVisit < 19 * 60 * 1000) {
      const timeSince = Math.floor((now - lastBunnyVisit) / 1000)
      console.log(`🐰 BUNNY VISIT BLOCKED - Only ${timeSince}s since last visit (need 1140s)`)
      return
    }

    if (bunnyActive) {
      console.log("🐰 BUNNY VISIT BLOCKED - Bunny already active")
      return
    }

    // Clear any existing bunny timeouts to prevent overlapping animations
    bunnyTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
    bunnyTimeoutsRef.current = []

    console.log("🐰 BUNNY VISIT STARTING - All checks passed")
    console.log(`🐰 Mature flowers available: ${matureFlowers.length}`)

    setBunnyActive(true)
    setBunnyPhase("arriving")
    setBunnyOpacity(0)

    // Calculate how many flowers to eat (1-5 or up to half the mature flowers)
    const maxToEat = Math.min(5, Math.ceil(matureFlowers.length / 2))
    const flowersToEat = Math.floor(Math.random() * maxToEat) + 1
    setBunnyEatenCount(flowersToEat)
    console.log(`🐰 Bunny will eat ${flowersToEat} flowers`)

    // Pick a random position along the flower bed - avoid edges for bunny
    const bunnyX = Math.random() * 67 + 18 // 18% to 85% to avoid edges and allow for bunny size
    setBunnyPosition(bunnyX)
    console.log(`🐰 Bunny position: ${bunnyX.toFixed(1)}%`)

    // Just one initial message with shorter duration
    addActivity(`🐰 A WILD BUNNY APPEARS IN THE GARDEN!`, 4000)

    // Remove the "appears" message after 4 seconds (instead of default 15)
    const timeout1 = setTimeout(() => {
      setRecentActivity((current) => current.filter((item) => !item.includes("A WILD BUNNY APPEARS")))
    }, 4000)
    bunnyTimeoutsRef.current.push(timeout1)

    // Phase 1: Fade in and explore for much longer (12 seconds)
    const timeout2 = setTimeout(() => {
      console.log("🐰 Phase: EXPLORING")
      setBunnyPhase("exploring")
      setBunnyOpacity(1)
    }, 500)
    bunnyTimeoutsRef.current.push(timeout2)

    // Phase 2: Start eating (after 12.5 seconds total)
    const timeout3 = setTimeout(() => {
      console.log("🐰 Phase: EATING")
      setBunnyPhase("eating")

      // Add message about eating
      const munchingMessage = `🐰 THE BUNNY IS MUNCHING ON ${flowersToEat} DELICIOUS FLOWERS!`
      addActivity(munchingMessage, 4000)

      // Remove the munching message after 4 seconds
      const timeout3a = setTimeout(() => {
        setRecentActivity((current) => current.filter((item) => !item.includes("THE BUNNY IS MUNCHING")))
      }, 4000)
      bunnyTimeoutsRef.current.push(timeout3a)

      // Remove random mature flowers
      setFlowers((prev) => {
        const mature = prev.filter((f) => f.stage === "fully-mature")
        const toKeep = prev.filter((f) => f.stage !== "fully-mature")
        const shuffled = [...mature].sort(() => Math.random() - 0.5)
        const toRemove = shuffled.slice(0, flowersToEat)
        const remaining = shuffled.slice(flowersToEat)

        console.log(`🐰 BEFORE EATING:`)
        console.log(`🐰 - Total flowers: ${prev.length}`)
        console.log(`🐰 - Mature flowers: ${mature.length}`)
        console.log(`🐰 - Non-mature flowers: ${toKeep.length}`)
        console.log(
          `🐰 EATING ${toRemove.length} MATURE FLOWERS:`,
          toRemove.map((f) => `${f.type} by ${f.plantedBy} (${f.stage})`),
        )
        console.log(`🐰 AFTER EATING: ${toKeep.length + remaining.length} flowers remain (${remaining.length} mature)`)

        return [...toKeep, ...remaining]
      })
    }, 12500)
    bunnyTimeoutsRef.current.push(timeout3)

    // Phase 3: Play around after eating (after 19.5 seconds total)
    const timeout4 = setTimeout(() => {
      console.log("🐰 Phase: PLAYING")
      setBunnyPhase("playing")
    }, 19500)
    bunnyTimeoutsRef.current.push(timeout4)

    // Phase 4: Start leaving (after 27.5 seconds total)
    const timeout5 = setTimeout(() => {
      console.log("🐰 Phase: LEAVING")
      setBunnyPhase("leaving")
      setBunnyOpacity(0)

      // Clean up after fade out completes
      const timeout5a = setTimeout(() => {
        console.log("🐰 BUNNY VISIT COMPLETE - Bunny has left the garden")
        setBunnyActive(false)
        // Clear the timeouts array since this visit is complete
        bunnyTimeoutsRef.current = []
      }, 2000)
      bunnyTimeoutsRef.current.push(timeout5a)
    }, 27500)
    bunnyTimeoutsRef.current.push(timeout5)

    console.log(`🐰 Bunny visit scheduled with ${bunnyTimeoutsRef.current.length} timeouts`)
  }

  // New 5-stage growth system: 0-45s sprout, 45s-60s blooming, 60s-90s small, 90s-150s medium, 150s+ fully-mature
  useEffect(() => {
    if (!isVisible) return

    console.log("🌱 Growth interval starting")

    growthIntervalRef.current = setInterval(() => {
      setFlowers((prevFlowers) => {
        const now = Date.now()
        const timeSinceLastBunny = now - lastBunnyVisit
        const twentyMinutes = 20 * 60 * 1000 // 1,200,000 milliseconds

        // Enhanced bunny timing logs
        const minutesSince = Math.floor(timeSinceLastBunny / 60000)
        const secondsSince = Math.floor((timeSinceLastBunny % 60000) / 1000)

        if (minutesSince >= 19) {
          // Only log when we're close to trigger time
          console.log(
            `🐰 Bunny check: ${minutesSince}m ${secondsSince}s since last visit (need 20m), bunnyActive: ${bunnyActive}`,
          )
        }

        // Only trigger bunny if enough time has passed AND bunny is not active
        if (timeSinceLastBunny > twentyMinutes && !bunnyActive) {
          const matureFlowers = prevFlowers.filter((f) => f.stage === "fully-mature")
          console.log(`🐰 TRIGGER CONDITIONS MET: ${matureFlowers.length} mature flowers available`)

          if (matureFlowers.length > 0) {
            console.log("🐰 TRIGGERING BUNNY VISIT - 20+ minutes elapsed")

            // Immediately update lastBunnyVisit to prevent multiple triggers
            setLastBunnyVisit(now)

            // Trigger the bunny visit with a small delay
            setTimeout(() => triggerBunnyVisit(matureFlowers), 100)
          } else {
            console.log("🐰 No mature flowers available for bunny visit")
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
            let flowerName = flowerTypes[flower.type].name.toUpperCase()

            // For wildflowers, get the specific type name
            if (flower.type === "wildflower") {
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

              const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
              const randomIndex = seedValue % wildflowerImages.length
              const imagePath = wildflowerImages[randomIndex]
              const specificType = imagePath.split("/").pop()?.split(".")[0] || "wildflower"

              // Convert filename to display name
              const displayNames: { [key: string]: string } = {
                "azure-bluet-1": "AZURE BLUET",
                "azure-bluet-2": "AZURE BLUET",
                "azure-bluet-3": "AZURE BLUET",
                cornflower: "CORNFLOWER",
                allium: "ALLIUM",
                "blue-orchid": "BLUE ORCHID",
                "cyan-flower": "CYAN FLOWER",
                peony: "PEONY",
                poppy: "POPPY",
                lilac: "LILAC",
              }

              flowerName = displayNames[specificType] || "WILDFLOWER"
            }

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
      console.log("🌱 Growth interval stopping")
      if (growthIntervalRef.current) clearInterval(growthIntervalRef.current)
      // Clean up bunny timeouts when component unmounts
      bunnyTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      bunnyTimeoutsRef.current = []
    }
  }, [isVisible, bunnyActive, lastBunnyVisit]) // Dependencies ensure proper updates

  // Chat command handlers
  useEffect(() => {
    const handlePlantFlower = (event: CustomEvent) => {
      const { username } = event.detail

      // Randomize flower type
      const flowerTypeKeys = Object.keys(flowerTypes) as Array<keyof typeof flowerTypes>
      const randomFlowerType = flowerTypeKeys[Math.floor(Math.random() * flowerTypeKeys.length)]

      console.log(`Community Garden: ${username} planting ${randomFlowerType}`)

      const now = Date.now()
      // Check if user has planted 2 flowers recently (allow 2 flowers per user per 5-minute window)
      const userFlowers = flowers.filter((f) => f.plantedBy === username && now - f.plantedAt < 300000)
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
        return
      }

      // Find available position - avoid logo area and right edge
      const usedPositions = flowers.map((f) => f.x)
      let newX = Math.random() * 67 + 18 // 18% to 85% to avoid logo area and right edge overflow

      // Try to avoid overlapping
      let attempts = 0
      while (attempts < 10 && usedPositions.some((pos) => Math.abs(pos - newX) < 8)) {
        newX = Math.random() * 67 + 18
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
      console.log(`Community Garden: ${username} watering the garden - showRainEffect currently:`, showRainEffect)

      const now = Date.now()
      const waterCooldown = 2 * 60 * 1000 // 2 minutes in milliseconds

      // Check global water cooldown
      if (now - lastWaterTime < waterCooldown) {
        const remainingTime = Math.ceil((waterCooldown - (now - lastWaterTime)) / 1000)
        const minutes = Math.floor(remainingTime / 60)
        const seconds = remainingTime % 60
        const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

        addActivity(
          `💧 ${username.toUpperCase()}, GARDEN WAS RECENTLY WATERED! WAIT ${timeString} TO WATER AGAIN.`,
          7000,
        )
        return
      }

      // Set the last water time
      setLastWaterTime(now)

      // Water all flowers
      setFlowers((prev) => prev.map((flower) => ({ ...flower, lastWatered: now })))
      setGardenStats((prev) => ({
        ...prev,
        waterLevel: Math.min(100, prev.waterLevel + 10),
        lastActivity: `${username} watered the garden!`,
      }))
      addActivity(`💧 ${username.toUpperCase()} WATERED THE ENTIRE GARDEN!`, 5000)

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
        addActivity(`🌱 ${username.toUpperCase()}, YOU HAVEN'T PLANTED ANY FLOWERS YET!`, 7000)
        return
      }

      if (userMatureFlowers.length === 0) {
        addActivity(`🌱 ${username.toUpperCase()}, YOUR FLOWERS AREN'T READY TO PICK YET!`, 7000)
        return
      }

      if (userPickableFlowers.length === 0) {
        addActivity(
          `⏰ ${username.toUpperCase()}, YOUR ${userMatureFlowers.length} MATURE FLOWERS ARE STILL TOO YOUNG TO PICK!`,
          7000,
        )
        return
      }

      // Update lifetime picked total
      const newPickedTotal = (userPickedTotals[username] || 0) + userPickableFlowers.length
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
        `🌸 ${username.toUpperCase()} PICKED ${userPickableFlowers.length} FLOWERS! TOTAL PICKED: ${newPickedTotal}!`,
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
      setFlowers([])
      setUserFlowerCounts({}) // Reset user flower counts
      setUserPickedTotals({}) // Reset user picked totals
      setLastBunnyVisit(Date.now()) // Reset bunny timer
      setLastWaterTime(0) // Reset water cooldown
      setBunnyActive(false)
      // Clear any active bunny timeouts
      bunnyTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      bunnyTimeoutsRef.current = []
      setGardenStats({
        totalFlowers: 0,
        activeGardeners: 0,
        lastActivity: "Garden reset - ready for new growth!",
        waterLevel: 100,
      })
      setRecentActivity([])
      console.log("🐰 Garden reset - bunny timer reset to now")
    }

    const handleHideGarden = (event: CustomEvent) => {
      console.log("Community Garden: Hiding garden", event.detail)
      onHide()
    }

    const handleSpawnTestFlowers = () => {
      handleTestSpawn()
    }

    const handleTestBunnyVisit = () => {
      console.log("🐰 MANUAL TEST: Triggering bunny visit")
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
            x: 25 + i * 15, // Spread them out: 25%, 40%, 55%, 70% (safer spacing)
            plantedBy: testFlowerData[i].user,
            plantedAt: now - 400000, // Old enough to be mature
            stage: "fully-mature",
            lastWatered: now,
          })
        }
        setFlowers((prev) => [...prev, ...testMatureFlowers])
        console.log(`🐰 TEST: Created ${testMatureFlowers.length} test mature flowers`)

        // Trigger bunny after flowers are added
        setTimeout(() => {
          console.log("🐰 TEST: Triggering bunny with test flowers")
          triggerBunnyVisit(testMatureFlowers)
        }, 100)
      } else {
        console.log(`🐰 TEST: Using existing ${matureFlowers.length} mature flowers`)
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

  if (!isVisible) return null

  return (
    <>
      <div className="fixed left-0 right-0 z-10" style={{ bottom: "72px" }}>
        {/* Floating Activity Text - centered above garden */}
        {recentActivity.length > 0 && (
          <div
            className="fixed left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
            style={{ bottom: "362px" }} // Updated position
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
                  height: "200px", // Increased from 110px to 200px
                }}
              />
            </div>
          )}

          {/* Flower Reveals - centered horizontally above garden */}
          {Object.keys(flowerReveals).map((flowerId) => (
            <div
              key={flowerId}
              className="fixed left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
              style={{ bottom: "392px", left: `${flowerReveals[flowerId].x}%` }} // Updated position
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
