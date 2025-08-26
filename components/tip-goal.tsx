"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useStreamElements } from "./streamelements-service"

interface TipGoalProps {
  onConnectionChange: (connected: boolean) => void
}

export function TipGoal({ onConnectionChange }: TipGoalProps) {
  const { goalData, recentTippers, isConnected } = useStreamElements()
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastGoalReached, setLastGoalReached] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const actualCurrent = 41.9 // Current tips from StreamElements
  const actualTarget = 2500 // Goal for third deck
  const savedAmount = 1400 // Already saved separately
  const totalProgress = actualCurrent + savedAmount // Combined progress

  const progressPercentage = Math.round((actualCurrent / actualTarget) * 100)
  const totalProgressPercentage = Math.round((totalProgress / actualTarget) * 100)
  const remainingAmount = Math.max(actualTarget - totalProgress, 0)
  const isGoalReached = totalProgress >= actualTarget

  useEffect(() => {
    const showTipGoal = () => {
      console.log("[v0] Showing tip goal popup automatically")
      setIsVisible(true)
      setTimeout(() => {
        console.log("[v0] Hiding tip goal popup after 60 seconds")
        setIsVisible(false)
      }, 60000)
    }

    const handleForceTipGoalShow = (event: CustomEvent) => {
      console.log("[v0] Manual tip goal test triggered by:", event.detail?.username || "Unknown")
      showTipGoal()
    }

    console.log("[v0] Setting up tip goal auto-display")
    showTipGoal()

    const interval = setInterval(
      () => {
        console.log("[v0] Auto-showing tip goal (5 minute interval)")
        showTipGoal()
      },
      5 * 60 * 1000,
    )

    window.addEventListener("forceTipGoalShow", handleForceTipGoalShow as EventListener)

    return () => {
      console.log("[v0] Cleaning up tip goal interval")
      clearInterval(interval)
      window.removeEventListener("forceTipGoalShow", handleForceTipGoalShow as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    onConnectionChange(isConnected)

    const handleStreamElementsTip = (event: CustomEvent) => {
      const { username, amount } = event.detail
      console.log("[v0] New tip received:", { username, amount })

      setIsVisible(true)
      setTimeout(() => {
        setIsVisible(false)
      }, 60000)
    }

    window.addEventListener("streamelements-tip", handleStreamElementsTip as EventListener)

    return () => {
      window.removeEventListener("streamelements-tip", handleStreamElementsTip as EventListener)
    }
  }, [isVisible, isConnected, onConnectionChange])

  useEffect(() => {
    if (isGoalReached && !lastGoalReached && actualCurrent > 0) {
      setShowCelebration(true)
      setLastGoalReached(true)

      setTimeout(() => {
        setShowCelebration(false)
      }, 5000)
    } else if (!isGoalReached) {
      setLastGoalReached(false)
    }
  }, [isGoalReached, lastGoalReached, actualCurrent])

  if (!isVisible) return null

  return (
    <div className="fixed top-8 left-8 z-50">
      <Card className="w-[500px] bg-[#ffb8ad] border-2 border-white shadow-2xl">
        <CardContent className="p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold font-sans text-gray-900 mb-2">Third Deck Fund</h2>
            <div className="text-gray-800 text-2xl font-sans font-bold">
              <span className="font-bold">${totalProgress.toFixed(2)}</span> /{" "}
              <span className="font-bold">${actualTarget}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={totalProgressPercentage} className="h-6 bg-white/20 [&>div]:bg-pink-500" />
            <div className="flex justify-between text-lg text-gray-800 mt-2 font-sans font-bold">
              <span className="font-bold">{totalProgressPercentage}%</span>
              <span className="font-bold">${remainingAmount} to go</span>
            </div>
          </div>

          {/* Goal Status */}
          {isGoalReached ? (
            <div className="text-center mb-4">
              <div className="text-3xl animate-bounce">🎉</div>
              <div className="text-gray-900 font-bold font-sans text-xl">GOAL REACHED!</div>
              <div className="text-gray-800 text-lg font-sans font-bold">Third deck incoming!</div>
            </div>
          ) : (
            <div className="text-center mb-4">
              <div className="text-gray-800 text-lg font-sans font-bold">
                If you'd like to tip, find the tip button below!
              </div>
            </div>
          )}

          {/* Recent Tippers */}
          {recentTippers.length > 0 && (
            <div className="border-t border-white/20 pt-4">
              <div className="text-gray-800 text-base mb-3 font-sans font-bold">Recent supporters:</div>
              <div className="flex flex-wrap gap-2">
                {recentTippers.map((tipper, index) => (
                  <span
                    key={index}
                    className="bg-white/30 text-gray-900 text-base px-3 py-2 rounded-full font-sans font-bold"
                  >
                    {tipper.name} <span className="font-bold">${tipper.amount}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Celebration Overlay */}
          {showCelebration && (
            <div className="absolute inset-0 bg-[#ffb8ad] rounded-lg flex items-center justify-center animate-pulse">
              <div className="text-center text-gray-900">
                <div className="text-5xl mb-3">🎉🎊🎉</div>
                <div className="text-3xl font-bold font-sans">THIRD DECK FUNDED!</div>
                <div className="text-2xl font-sans font-bold">
                  <span className="font-bold">${actualTarget}</span> achieved!
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
