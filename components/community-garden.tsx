"use client"

import { useState, useEffect, useRef } from "react"

interface Flower {
  id: string
  type: "rose" | "tulip" | "sunflower" | "daisy" | "lily" | "wildflower"
  color: "pink" | "green" | "mixed"
  x: number // Position along the bottom (0-100%)
  plantedBy: string
  plantedAt: number
  stage: "sprout" | "blooming" | "mature" | "fully-mature"
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
  const growthIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
      const stages: Flower["stage"][] = ["sprout", "blooming", "mature", "fully-mature"]
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
    addActivity(`🧪 Test spawned 20 flowers at different stages!`)
  }

  // New 4-stage growth system: 0-45s sprout, 45s-60s blooming, 60s-3min mature, 3-5min fully-mature
  useEffect(() => {
    if (!isVisible) return

    growthIntervalRef.current = setInterval(() => {
      setFlowers((prevFlowers) =>
        prevFlowers.map((flower) => {
          if (flower.stage === "fully-mature") return flower

          const timeSincePlanted = Date.now() - flower.plantedAt

          // New timing: 0-45s sprout, 45s-60s blooming, 60s-180s mature, 180s-300s fully-mature
          let newStage: Flower["stage"] = "sprout"
          if (timeSincePlanted > 180000)
            newStage = "fully-mature" // 3+ minutes
          else if (timeSincePlanted > 60000)
            newStage = "mature" // 1+ minutes
          else if (timeSincePlanted > 45000)
            newStage = "blooming" // 45+ seconds
          else newStage = "sprout" // 0-45 seconds

          return { ...flower, stage: newStage }
        }),
      )
    }, 5000) // Check every 5 seconds

    return () => {
      if (growthIntervalRef.current) clearInterval(growthIntervalRef.current)
    }
  }, [isVisible])

  // Chat command handlers
  useEffect(() => {
    const handlePlantFlower = (event: CustomEvent) => {
      const { username, flowerType, color } = event.detail
      console.log(`Community Garden: ${username} planting ${flowerType} (${color})`)

      const now = Date.now()

      // Check if user has planted recently (5 minute cooldown)
      const recentPlant = flowers.find((f) => f.plantedBy === username && now - f.plantedAt < 300000)
      if (recentPlant) {
        console.log("Community Garden: User on cooldown")
        addActivity(`⏰ ${username}, please wait before planting again!`)
        return
      }

      // Check if garden is full
      if (flowers.length >= 20) {
        console.log("Community Garden: Garden is full")
        addActivity(`🌸 Garden is full! Try harvesting some flowers first.`)
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
      if (flowerType === "tulip") {
        const tulipColors = ["red", "orange", "pink", "white"]
        specificType = tulipColors[Math.floor(Math.random() * tulipColors.length)]
      }

      const newFlower: Flower = {
        id: `${username}-${now}`,
        type: flowerType || "wildflower",
        color: color || "mixed",
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
      addActivity(`🌱 ${username} planted a ${flowerTypes[newFlower.type].name}!`)
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
      addActivity(`💧 ${username} watered the entire garden!`)
    }

    const handleHarvestGarden = (event: CustomEvent) => {
      const { username } = event.detail
      console.log(`Community Garden: ${username} harvesting mature flowers`)

      const now = Date.now()
      const fullyMatureFlowers = flowers.filter((f) => f.stage === "fully-mature")
      const harvestableFlowers = fullyMatureFlowers.filter((f) => now - f.plantedAt >= 300000) // 5+ minutes old

      if (fullyMatureFlowers.length === 0) {
        addActivity(`🌱 ${username}, no flowers are ready to harvest yet!`)
        return
      }

      if (harvestableFlowers.length === 0) {
        addActivity(`⏰ Found ${fullyMatureFlowers.length} mature flowers, but they're still too young to pick!`)
        return
      }

      // Show the nice message format you wanted
      if (harvestableFlowers.length < fullyMatureFlowers.length) {
        addActivity(
          `🌸 Found ${fullyMatureFlowers.length} mature flowers, but only ${harvestableFlowers.length} were ready to pick!`,
        )
      } else {
        addActivity(`🌸 ${username} harvested ${harvestableFlowers.length} beautiful flowers!`)
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
    }
  }, [isVisible, onConnectionChange, onHide, flowers])

  const addActivity = (activity: string) => {
    setRecentActivity((prev) => [activity, ...prev.slice(0, 4)])

    // Clear banner after 5 seconds
    setTimeout(() => {
      setRecentActivity((current) => current.filter((item) => item !== activity))
    }, 5000)
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

    if (flower.stage === "mature") {
      // Use one of the existing flower images at 100px for mature stage
      const matureImages = [
        "/garden/flowers/azure-bluet-1.webp",
        "/garden/flowers/cornflower.webp",
        "/garden/flowers/allium.webp",
      ]
      const seedValue = flower.id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
      const imageSrc = matureImages[seedValue % matureImages.length]

      return (
        <img
          src={imageSrc || "/placeholder.svg"}
          alt="Mature"
          className="w-24 h-24 pixelated hover:scale-105 transition-transform duration-300"
          style={{ imageRendering: "pixelated" }}
        />
      )
    }

    // Fully mature flowers - 150x150px, harvestable
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
    <div className="fixed bottom-14 left-0 right-0 z-10">
      {/* Temporary Garden Stats Banner - only shows for 5 seconds after actions */}
      {recentActivity.length > 0 && (
        <div
          className="h-12 flex items-center justify-between px-4 text-sm font-bold border-2 border-black rounded-t-lg mx-4 animate-slide-up"
          style={{ backgroundColor: "rgba(255, 184, 173, 0.95)" }}
        >
          <div className="flex items-center gap-4">
            <span>🌸 Community Garden</span>
            <span>🌱 {flowers.length}/20 flowers</span>
            <span className="text-xs">!plant rose | !water | !harvest</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="animate-pulse">{recentActivity[0]}</span>
          </div>
        </div>
      )}

      {/* Main Garden Area - transparent background, no soil strip */}
      <div className="h-36 relative overflow-hidden">
        {/* Flowers */}
        {flowers.map((flower) => (
          <div
            key={flower.id}
            className="absolute bottom-0 transform -translate-x-1/2 transition-all duration-1000"
            style={{ left: `${flower.x}%` }}
            title={`${flowerTypes[flower.type].name}${flower.specificType ? ` (${flower.specificType})` : ""} by ${flower.plantedBy} (${flower.stage}) - ${Math.floor((Date.now() - flower.plantedAt) / 1000)}s old`}
          >
            {getFlowerDisplay(flower)}
            {flower.stage === "fully-mature" && (
              <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>
            )}
          </div>
        ))}
      </div>

      {/* Test Button - positioned at bottom center */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-20">
        <button
          className="px-4 py-2 bg-blue-500 text-white font-bold border-2 border-black rounded hover:bg-blue-600"
          onClick={handleTestSpawn}
        >
          🧪 Spawn 20 Test Flowers
        </button>
      </div>
    </div>
  )
}
