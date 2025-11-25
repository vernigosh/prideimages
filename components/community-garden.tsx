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

export function CommunityGarden({ isVisible, onConnectionChange, onHide }: CommunityGardenProps) {
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
  const [lastBunnyVisit, setLastBunnyVisit] = useState(Date.now() - 19 * 60 * 1000) // Start 19 minutes ago so bunny can appear in 1 minute
  const [bunnyEatenCount, setBunnyEatenCount] = useState(0)
  const [bunnyPosition, setBunnyPosition] = useState(50)
  const [bunnyStartTime, setBunnyStartTime] = useState<number | null>(null) // Track when bunny visit started
  const growthIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const rainTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [flowerReveals, setFlowerReveals] = useState<{ [key: string]: { type: string; x: number; timestamp: number } }>(
    {},
  )
  const [lastWaterTime, setLastWaterTime] = useState(0) // New state variable for tracking the last water time
  const [userFlowerCounts, setUserFlowerCounts] = useState<{ [username: string]: number }>({}) // New state for user flower totals
  const [userPickedTotals, setUserPickedTotals] = useState<{ [username: string]: number }>({}) // New state for lifetime picked totals
  const [gardenSaturation, setGardenSaturation] = useState(100) // Start at 100% saturation

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

  const triggerBunnyVisit = (matureFlowers: Flower[], isManualTest = false) => {
    const now = Date.now()

    // Skip timing checks for manual tests
    if (!isManualTest) {
      if (now - lastBunnyVisit < 19 * 60 * 1000) {
        const timeSince = Math.floor((now - lastBunnyVisit) / 1000)
        return
      }
    }

    if (bunnyActive) {
      return
    }

    const maxToEat = Math.min(5, Math.ceil(matureFlowers.length / 2))
    const flowersToEat = Math.floor(Math.random() * maxToEat) + 1
    setBunnyEatenCount(flowersToEat)

    const bunnyX = Math.random() * 67 + 18
    setBunnyPosition(bunnyX)

    setBunnyActive(true)
    setBunnyPhase("arriving")
    setBunnyOpacity(0)
    setBunnyStartTime(now)
    setLastBunnyVisit(now)
  }

  useEffect(() => {
    if (!bunnyActive || !bunnyStartTime) return

    const checkBunnyPhase = () => {
      const elapsed = Date.now() - bunnyStartTime

      if (elapsed >= 27500) {
        if (bunnyPhase !== "leaving") {
          setBunnyPhase("leaving")
          setBunnyOpacity(0)

          setTimeout(() => {
            setBunnyActive(false)
            setBunnyStartTime(null)
            setBunnyPhase("arriving")
            setBunnyOpacity(0)
          }, 2000)
        }
      } else if (elapsed >= 19500) {
        if (bunnyPhase !== "playing") {
          setBunnyPhase("playing")
        }
      } else if (elapsed >= 12500) {
        if (bunnyPhase !== "eating") {
          setBunnyPhase("eating")

          setFlowers((prev) => {
            const mature = prev.filter((f) => f.stage === "fully-mature")
            const toKeep = prev.filter((f) => f.stage !== "fully-mature")
            const shuffled = [...mature].sort(() => Math.random() - 0.5)
            const toRemove = shuffled.slice(0, bunnyEatenCount)
            const remaining = shuffled.slice(bunnyEatenCount)

            return [...toKeep, ...remaining]
          })
        }
      } else if (elapsed >= 500) {
        if (bunnyPhase !== "exploring") {
          setBunnyPhase("exploring")
          setBunnyOpacity(1)
        }
      }
    }

    const phaseInterval = setInterval(checkBunnyPhase, 500)

    return () => {
      clearInterval(phaseInterval)
    }
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
          if (timeSincePlanted > 150000) newStage = "fully-mature"
          else if (timeSincePlanted > 90000) newStage = "medium"
          else if (timeSincePlanted > 60000) newStage = "small"
          else if (timeSincePlanted > 45000) newStage = "blooming"
          else newStage = "sprout"

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

  useEffect(() => {
    if (!isVisible) return

    const bunnyCheckInterval = setInterval(() => {
      if (bunnyActive) return

      const now = Date.now()
      const timeSinceLastBunny = now - lastBunnyVisit
      const twentyMinutes = 20 * 60 * 1000

      if (timeSinceLastBunny > twentyMinutes) {
        const matureFlowers = flowers.filter((f) => f.stage === "fully-mature")

        if (matureFlowers.length > 0) {
          triggerBunnyVisit(matureFlowers)
        }
      }
    }, 30000)

    return () => {
      clearInterval(bunnyCheckInterval)
    }
  }, [isVisible, bunnyActive, lastBunnyVisit, flowers])

  useEffect(() => {
    if (!isVisible) return

    const saturationInterval = setInterval(() => {
      const now = Date.now()
      const timeSinceWater = now - lastWaterTime
      const graceTime = 5 * 60 * 1000
      const fadeTime = 5 * 60 * 1000

      if (timeSinceWater <= graceTime) {
        setGardenSaturation(100)
      } else {
        const fadeProgress = (timeSinceWater - graceTime) / fadeTime
        const saturationPercent = Math.max(20, 100 - fadeProgress * 80)
        setGardenSaturation(saturationPercent)
      }
    }, 30000)

    return () => clearInterval(saturationInterval)
  }, [isVisible, lastWaterTime])

  useEffect(() => {
    if (!isVisible) return

    const handlePlantFlower = (event: CustomEvent) => {
      const { username } = event.detail

      const flowerTypeKeys = Object.keys(flowerTypes) as Array<keyof typeof flowerTypes>
      const randomFlowerType = flowerTypeKeys[Math.floor(Math.random() * flowerTypeKeys.length)]

      const now = Date.now()
      const userFlowers = flowers.filter((f) => f.plantedBy === username && now - f.plantedAt < 300000)
      if (userFlowers.length >= 2) {
        addActivity(
          `🌸 ${username.toUpperCase()}, YOU'VE USED YOUR 2-FLOWER ALLOWANCE! WAIT 5 MINUTES FOR A FRESH START!`,
          7000,
        )
        return
      }

      if (flowers.length >= 20) {
        addActivity(`🌸 GARDEN IS FULL! TRY HARVESTING SOME FLOWERS FIRST.`, 7000)
        return
      }

      const usedPositions = flowers.map((f) => f.x)
      let newX = Math.random() * 67 + 18

      let attempts = 0
      while (attempts < 10 && usedPositions.some((pos) => Math.abs(pos - newX) < 8)) {
        newX = Math.random() * 67 + 18
        attempts++
      }

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

      setUserFlowerCounts((prev) => ({
        ...prev,
        [username]: (prev[username] || 0) + 1,
      }))

      const userFlowerCount = (userFlowerCounts[username] || 0) + 1

      setGardenStats((prev) => ({
        ...prev,
        totalFlowers: prev.totalFlowers + 1,
        lastActivity: `${username} planted a ${flowerTypes[newFlower.type].name}!`,
      }))

      if (userFlowerCount === 1) {
        addActivity(`🌱 ${username.toUpperCase()} PLANTED FLOWER #${userFlowerCount}! PLANT 1 MORE!`, 5000)
      } else {
        addActivity(`🌸 ${username.toUpperCase()} PLANTED FLOWER #${userFlowerCount}! PLOT COMPLETE!`, 5000)
      }
    }

    const handleWaterGarden = (event: CustomEvent) => {
      const { username } = event.detail

      const now = Date.now()
      const waterCooldown = 2 * 60 * 1000

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

      setLastWaterTime(now)
      setGardenSaturation(100)

      setFlowers((prev) => prev.map((flower) => ({ ...flower, lastWatered: now })))
      setGardenStats((prev) => ({
        ...prev,
        waterLevel: Math.min(100, prev.waterLevel + 10),
        lastActivity: `${username} watered the garden!`,
      }))
      addActivity(`💧 ${username.toUpperCase()} WATERED THE ENTIRE GARDEN!`, 5000)

      if (rainTimeoutRef.current) clearTimeout(rainTimeoutRef.current)

      rainTimeoutRef.current = setTimeout(() => {}, 5000)
    }

    const handlePickFlowers = (event: CustomEvent) => {
      const { username } = event.detail

      const now = Date.now()
      const userFlowers = flowers.filter((f) => f.plantedBy === username)
      const userMatureFlowers = userFlowers.filter((f) => f.stage === "fully-mature")
      const userPickableFlowers = userMatureFlowers.filter((f) => now - f.plantedAt >= 300000)

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

      const newPickedTotal = (userPickedTotals[username] || 0) + userPickableFlowers.length
      setUserPickedTotals((prev) => ({
        ...prev,
        [username]: newPickedTotal,
      }))

      setUserFlowerCounts((prev) => ({
        ...prev,
        [username]: 0,
      }))

      addActivity(
        `🌸 ${username.toUpperCase()} PICKED ${userPickableFlowers.length} FLOWERS! TOTAL PICKED: ${newPickedTotal}!`,
        5000,
      )

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

      const now = Date.now()
      const thirtyMinutesAgo = now - 30 * 60 * 1000
      const oldFlowers = flowers.filter((f) => f.plantedAt < thirtyMinutesAgo)

      if (oldFlowers.length === 0) {
        addActivity(`🧹 ${username.toUpperCase()}, NO FLOWERS OLDER THAN 30 MINUTES FOUND!`, 7000)
        return
      }

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
      resetGarden()
    }

    const handleHideGarden = (event: CustomEvent) => {
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

      if (matureFlowers.length === 0) {
        const now = Date.now()
        const testMatureFlowers: Flower[] = []

        const testFlowerData = [
          { type: "rose", user: "TestUser0" },
          { type: "sunflower", user: "TestUser1" },
          { type: "rose", user: "TestUser2" },
          { type: "sunflower", user: "TestUser3" },
        ] as const

        for (let i = 0; i < 4; i++) {
          testMatureFlowers.push({
            id: `test-mature-${now}-${i}-${testFlowerData[i].type}`,
            type: testFlowerData[i].type,
            color: "mixed",
            x: 25 + i * 15,
            plantedBy: testFlowerData[i].user,
            plantedAt: now - 400000,
            stage: "fully-mature",
            lastWatered: now,
          })
        }
        setFlowers((prev) => [...prev, ...testMatureFlowers])

        setTimeout(() => {
          triggerBunnyVisit(testMatureFlowers, true)
        }, 500)
      } else {
        triggerBunnyVisit(matureFlowers, true)
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
            height: "80px",
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

    const getFlowerSize = (flowerType: string, stage: "small" | "medium" | "fully-mature") => {
      const baseSizes = {
        sunflower: { small: 180, medium: 220, mature: 280 },
        lilac: { small: 160, medium: 200, mature: 250 },
        allium: { small: 150, medium: 190, mature: 240 },
        rose: { small: 140, medium: 180, mature: 220 },
        peony: { small: 145, medium: 185, mature: 230 },
        tulip: { small: 120, medium: 150, mature: 190 },
        daisy: { small: 115, medium: 145, mature: 180 },
        poppy: { small: 110, medium: 140, mature: 175 },
        lily: { small: 100, medium: 130, mature: 160 },
        cornflower: { small: 95, medium: 125, mature: 155 },
        "blue-orchid": { small: 90, medium: 120, mature: 150 },
        "azure-bluet": { small: 70, medium: 90, mature: 120 },
        "cyan-flower": { small: 75, medium: 95, mature: 125 },
      }

      const defaultSizes = { small: 110, medium: 140, mature: 170 }

      return baseSizes[flower.type as keyof typeof baseSizes] || defaultSizes
    }

    if (flower.stage === "small") {
      let imageSrc = ""
      let flowerKey = flower.type
      if (flower.type === "wildflower") {
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowerImages.length
        imageSrc = wildflowerImages[randomIndex]
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
            maxHeight: "120px",
            width: "auto",
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
            maxHeight: "180px",
            width: "auto",
          }}
        />
      )
    }

    if (flower.stage === "fully-mature") {
      let imageSrc = ""
      let flowerKey = flower.type
      if (flower.type === "wildflower") {
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowerImages.length
        imageSrc = wildflowerImages[randomIndex]
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
            maxHeight: "280px",
            width: "auto",
          }}
        />
      )
    }
    return null
  }

  const resetGarden = () => {
    setFlowers([])
    setUserPickedTotals({})
    setLastBunnyVisit(Date.now())
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
  }

  if (!isVisible) return null

  return (
    <>
      <div className="fixed left-0 right-0 z-10" style={{ bottom: "72px" }}>
        {recentActivity.length > 0 && (
          <div
            className="fixed left-1/2 transform -translate-x-1/2 z-20 pointer-events-none"
            style={{ bottom: "362px" }}
          >
            <div className="text-center">
              <span className="text-2xl font-black text-white font-sans uppercase animate-pulse">
                {recentActivity[0]}
              </span>
            </div>
          </div>
        )}

        <div
          className="relative"
          style={{
            height: "320px",
            overflow: "visible",
            filter: `saturate(${gardenSaturation}%)`,
            transition: "filter 2s ease-in-out",
          }}
        >
          {rainTimeoutRef.current && (
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
                          : "/garden/effects/bunnyhoppingbackandforth.gif"
                }
                alt="Garden Bunny"
                className="pixelated"
                style={{
                  imageRendering: "pixelated",
                  width: "auto",
                  height: "200px",
                  transform: bunnyPhase === "playing" ? "scaleX(-1)" : "scaleX(1)",
                  filter: bunnyPhase === "leaving" ? "brightness(0.7)" : "brightness(1)",
                }}
              />
            </div>
          )}

          {Object.keys(flowerReveals).map((flowerId) => (
            <div
              key={flowerId}
              className="fixed left-1/2 transform -translate-x-1/2 z-30 pointer-events-none"
              style={{ bottom: "392px", left: `${flowerReveals[flowerId].x}%` }}
            >
              <span className="text-2xl font-black text-white font-sans uppercase animate-pulse">
                {flowerReveals[flowerId].type}
              </span>
            </div>
          ))}

          {flowers.map((flower) => {
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
                {flower.stage !== "fully-mature" && (
                  <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

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
