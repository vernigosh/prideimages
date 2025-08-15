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
  const [flowerReveals, setFlowerReveals] = useState<{ [key: string]: { type: string; x: number; timestamp: number } }>(
    {},
  )
  const growthIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const rainTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // New 5-stage growth system: 0-45s sprout, 45s-60s blooming, 60s-90s small, 90s-150s medium, 150s+ fully-mature
  useEffect(() => {
    if (!isVisible) return

    growthIntervalRef.current = setInterval(() => {
      setFlowers((prevFlowers) =>
        prevFlowers.map((flower) => {
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

          // Trigger reveal when flower reaches medium stage
          if (oldStage === "small" && newStage === "medium") {
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
        }),
      )
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
      console.log(`Community Garden: ${username} watering the garden`)

      const now = Date.now()
      // Water all flowers
      setFlowers((prev) => prev.map((flower) => ({ ...flower, lastWatered: now })))
      setGardenStats((prev) => ({
        ...prev,
        waterLevel: Math.min(100, prev.waterLevel + 10),
        lastActivity: `${username} watered the garden!`,
      }))
      addActivity(`💧 ${username.toUpperCase()} WATERED THE ENTIRE GARDEN!`)

      // Show rain effect for 8 seconds with proper scrolling
      setShowRainEffect(true)
      if (rainTimeoutRef.current) clearTimeout(rainTimeoutRef.current)
      rainTimeoutRef.current = setTimeout(() => {
        setShowRainEffect(false)
      }, 8000) // 8 seconds to complete the scroll animation
    }

    const handleHarvestGarden = (event: CustomEvent) => {
      const { username } = event.detail
      console.log(`Community Garden: ${username} harvesting mature flowers`)

      const now = Date.now()
      const fullyMatureFlowers = flowers.filter((f) => f.stage === "fully-mature")
      const harvestableFlowers = fullyMatureFlowers.filter((f) => now - f.plantedAt >= 300000) // 5+ minutes old

      if (fullyMatureFlowers.length === 0) {
        addActivity(`🌱 ${username.toUpperCase()}, NO FLOWERS ARE READY TO HARVEST YET!`)
        return
      }

      if (harvestableFlowers.length === 0) {
        addActivity(`⏰ FOUND ${fullyMatureFlowers.length} MATURE FLOWERS, BUT THEY'RE STILL TOO YOUNG TO PICK!`)
        return
      }

      // Show the nice message format you wanted
      if (harvestableFlowers.length < fullyMatureFlowers.length) {
        addActivity(
          `🌸 FOUND ${fullyMatureFlowers.length} MATURE FLOWERS, BUT ONLY ${harvestableFlowers.length} WERE READY TO PICK!`,
        )
      } else {
        addActivity(`🌸 ${username.toUpperCase()} HARVESTED ${harvestableFlowers.length} BEAUTIFUL FLOWERS!`)
      }

      // Remove harvestable flowers
      setFlowers((prev) => prev.filter((f) => !(f.stage === "fully-mature" && now - f.plantedAt >= 300000)))
      setGardenStats((prev) => ({
        ...prev,
        lastActivity: `${username} harvested ${harvestableFlowers.length} flowers!`,
      }))
    }

    const handleResetGarden = (event: CustomEvent) => {
      console.log("Community Garden: Resetting garden", event.detail)
      setFlowers([])
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

    window.addEventListener("plantFlower", handlePlantFlower as EventListener)
    window.addEventListener("waterGarden", handleWaterGarden as EventListener)
    window.addEventListener("harvestGarden", handleHarvestGarden as EventListener)
    window.addEventListener("resetGarden", handleResetGarden as EventListener)
    window.addEventListener("hideGarden", handleHideGarden as EventListener)
    window.addEventListener("spawnTestFlowers", handleSpawnTestFlowers)

    // Set connected status
    onConnectionChange(isVisible)

    return () => {
      window.removeEventListener("plantFlower", handlePlantFlower as EventListener)
      window.removeEventListener("waterGarden", handleWaterGarden as EventListener)
      window.removeEventListener("harvestGarden", handleHarvestGarden as EventListener)
      window.removeEventListener("resetGarden", handleResetGarden as EventListener)
      window.removeEventListener("hideGarden", handleHideGarden as EventListener)
      window.removeEventListener("spawnTestFlowers", handleSpawnTestFlowers)
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
          className="w-16 h-16 pixelated animate-bounce"
          style={{ imageRendering: "pixelated", animationDuration: "3s" }}
        />
      )
    }

    if (flower.stage === "blooming") {
      return (
        <img
          src="/garden/stages/sparkle.gif"
          alt="Blooming"
          className="w-24 h-24 pixelated animate-pulse"
          style={{ imageRendering: "pixelated" }}
        />
      )
    }

    if (flower.stage === "small") {
      // Small flower - 28x28px (between blooming and medium)
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
      if (flower.type === "wildflower") {
        const wildflowers = flowerImages.wildflower as string[]
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowers.length
        imageSrc = wildflowers[randomIndex]
      } else {
        imageSrc = flowerImages[flower.type] || flowerImages.wildflower[0]
      }

      return (
        <img
          src={imageSrc || "/placeholder.svg"}
          alt="Small"
          className="w-28 h-28 pixelated hover:scale-105 transition-transform duration-300"
          style={{ imageRendering: "pixelated" }}
        />
      )
    }

    if (flower.stage === "medium") {
      // Medium flower - 32x32px (between small and fully-mature)
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
      if (flower.type === "wildflower") {
        const wildflowers = flowerImages.wildflower as string[]
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowers.length
        imageSrc = wildflowers[randomIndex]
      } else {
        imageSrc = flowerImages[flower.type] || flowerImages.wildflower[0]
      }

      return (
        <img
          src={imageSrc || "/placeholder.svg"}
          alt="Medium"
          className="w-32 h-32 pixelated hover:scale-105 transition-transform duration-300"
          style={{ imageRendering: "pixelated" }}
        />
      )
    }

    // Fully mature flowers - 36x36px (150% larger than medium), harvestable
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
      if (flower.type === "wildflower") {
        const wildflowers = flowerImages.wildflower as string[]
        const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const randomIndex = seedValue % wildflowers.length
        imageSrc = wildflowers[randomIndex]
      } else {
        imageSrc = flowerImages[flower.type] || flowerImages.wildflower[0]
      }

      return (
        <img
          src={imageSrc || "/placeholder.svg"}
          alt={flowerTypes[flower.type].name}
          className="w-36 h-36 pixelated hover:scale-105 transition-transform duration-300"
          style={{ imageRendering: "pixelated" }}
        />
      )
    }
    return null
  }

  if (!isVisible) return null

  return (
    <>
      {/* CSS for rain animation */}
      <style jsx>{`
        @keyframes rainScroll {
          0% {
            transform: translateX(-100%);
            opacity: 1;
          }
          100% {
            transform: translateX(100vw);
            opacity: 0.8;
          }
        }
        .rain-animation {
          animation: rainScroll 8s linear forwards;
        }
      `}</style>

      <div className="fixed bottom-20 left-0 right-0 z-10">
        {/* Floating Activity Text - centered above garden */}
        {recentActivity.length > 0 && (
          <div className="fixed bottom-56 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
            <div className="text-center">
              <span className="text-2xl font-black text-white font-sans uppercase animate-pulse">
                {recentActivity[0]}
              </span>
            </div>
          </div>
        )}

        {/* Main Garden Area - transparent background, no soil strip */}
        <div className="h-36 relative overflow-hidden">
          {/* Rain Effect - scrolls across when watered */}
          {showRainEffect && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              <img
                src="/garden/effects/rain.gif"
                alt="Rain"
                className="absolute top-0 left-0 h-full w-auto rain-animation pixelated"
                style={{
                  imageRendering: "pixelated",
                  minWidth: "200px", // Ensure rain has some width
                }}
              />
            </div>
          )}

          {/* Flower Reveals - centered horizontally above garden */}
          {Object.entries(flowerReveals).map(([flowerId, reveal]) => (
            <div
              key={flowerId}
              className="fixed bottom-60 left-1/2 transform -translate-x-1/2 transition-all duration-1000 pointer-events-none z-30"
            >
              <div className="text-center animate-bounce">
                <span className="text-xl font-black text-white font-sans uppercase bg-black bg-opacity-50 px-2 py-1 rounded">
                  {reveal.type}
                </span>
              </div>
            </div>
          ))}

          {/* Flowers */}
          {flowers.map((flower) => (
            <div
              key={flower.id}
              className="absolute bottom-0 transform -translate-x-1/2 transition-all duration-1000"
              style={{ left: `${flower.x}%` }}
              title={`${flowerTypes[flower.type].name}${flower.specificType ? ` (${flower.specificType})` : ""} by ${flower.plantedBy} (${flower.stage}) - ${Math.floor((Date.now() - flower.plantedAt) / 1000)}s old`}
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
    </>
  )
}
