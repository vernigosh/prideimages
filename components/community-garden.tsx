"use client"

import { useState, useEffect, useRef } from "react"

interface Flower {
  id: string
  type: "rose" | "tulip" | "sunflower" | "daisy" | "lily" | "wildflower"
  color: "pink" | "green" | "mixed"
  x: number // Position along the bottom (0-100%)
  plantedBy: string
  plantedAt: number
  stage: "sprout" | "blooming" | "mature"
  lastWatered: number
  specificType?: string // For tulip colors, etc.
}

interface CommunityGardenProps {
  isVisible: boolean
  onConnectionChange: (connected: boolean) => void
  onHide: () => void
}

const flowerTypes = {
  rose: { name: "Rose", growthTime: 30000 }, // 30 seconds per stage
  tulip: { name: "Tulip", growthTime: 25000 },
  sunflower: { name: "Sunflower", growthTime: 40000 },
  daisy: { name: "Daisy", growthTime: 20000 },
  lily: { name: "Lily", growthTime: 35000 },
  wildflower: { name: "Wildflower", growthTime: 15000 },
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

  // Simplified growth: sprout (stage 1) → blooming/sparkle (stage 2) → mature (stage 3)
  useEffect(() => {
    if (!isVisible) return

    growthIntervalRef.current = setInterval(() => {
      setFlowers((prevFlowers) =>
        prevFlowers.map((flower) => {
          if (flower.stage === "mature") return flower

          const flowerType = flowerTypes[flower.type]
          const timeSincePlanted = Date.now() - flower.plantedAt
          const stageTime = flowerType.growthTime

          // Determine current stage based on time
          let newStage = flower.stage
          if (timeSincePlanted > stageTime * 2) newStage = "mature"
          else if (timeSincePlanted > stageTime) newStage = "blooming"
          else newStage = "sprout"

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

      // Check if user has planted recently (5 minute cooldown)
      const now = Date.now()
      const recentPlant = flowers.find((f) => f.plantedBy === username && now - f.plantedAt < 300000)
      if (recentPlant) {
        console.log("Community Garden: User on cooldown")
        return
      }

      // Find available position - avoid logo area (200x200px in bottom-left at 720p)
      // At 720p (1280px width), 200px = ~15.6%, so start from 18% to be safe
      const usedPositions = flowers.map((f) => f.x)
      let newX = Math.random() * 77 + 18 // 18% to 95% to avoid logo area

      // Try to avoid overlapping (flowers are now 150px wide, so need more spacing)
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

      // Water all flowers (helps them grow faster)
      const now = Date.now()
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

      const matureFlowers = flowers.filter((f) => f.stage === "mature")
      if (matureFlowers.length === 0) {
        console.log("Community Garden: No mature flowers to harvest")
        return
      }

      // Remove mature flowers and add to harvest count
      setFlowers((prev) => prev.filter((f) => f.stage !== "mature"))
      addActivity(`🌸 ${username} harvested ${matureFlowers.length} beautiful flowers!`)
      setGardenStats((prev) => ({
        ...prev,
        lastActivity: `${username} harvested ${matureFlowers.length} flowers!`,
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

    window.addEventListener("plantFlower", handlePlantFlower as EventListener)
    window.addEventListener("waterGarden", handleWaterGarden as EventListener)
    window.addEventListener("harvestGarden", handleHarvestGarden as EventListener)
    window.addEventListener("resetGarden", handleResetGarden as EventListener)
    window.addEventListener("hideGarden", handleHideGarden as EventListener)

    // Set connected status
    onConnectionChange(isVisible)

    return () => {
      window.removeEventListener("plantFlower", handlePlantFlower as EventListener)
      window.removeEventListener("waterGarden", handleWaterGarden as EventListener)
      window.removeEventListener("harvestGarden", handleHarvestGarden as EventListener)
      window.removeEventListener("resetGarden", handleResetGarden as EventListener)
      window.removeEventListener("hideGarden", handleHideGarden as EventListener)
    }
  }, [isVisible, onConnectionChange, onHide, flowers])

  const addActivity = (activity: string) => {
    setRecentActivity((prev) => [activity, ...prev.slice(0, 4)])

    // Clear banner after 5 seconds
    setTimeout(() => {
      setRecentActivity([])
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

    // Mature flowers - 150x150px as requested
    if (flower.stage === "mature") {
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
        // Use flower ID to ensure consistent random selection for each flower
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
            <span>🌱 {flowers.length} flowers</span>
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
            title={`${flowerTypes[flower.type].name}${flower.specificType ? ` (${flower.specificType})` : ""} by ${flower.plantedBy} (${flower.stage})`}
          >
            {getFlowerDisplay(flower)}
            {flower.stage === "mature" && <div className="absolute -top-2 -right-2 text-lg animate-pulse">✨</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
