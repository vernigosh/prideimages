"use client"

import { useEffect, useState } from "react"
import { Shield } from "lucide-react"

interface Guardian {
  id: string
  username: string
  achieved_at: string
  flower_count: number
}

interface BoardOfGuardiansProps {
  isVisible: boolean
  onHide: () => void
}

export function BoardOfGuardians({ isVisible, onHide }: BoardOfGuardiansProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isVisible) {
      fetchGuardians()
      // Auto-hide after 20 seconds
      const timer = setTimeout(() => {
        onHide()
      }, 20000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onHide])

  const fetchGuardians = async () => {
    try {
      const response = await fetch("/api/guardians")
      const data = await response.json()
      if (data.guardians) {
        setGuardians(data.guardians)
      }
    } catch (error) {
      console.error("Error fetching guardians:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div
        className="rounded-xl p-8 w-[520px] max-h-[80vh] overflow-y-auto pointer-events-auto"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          border: "3px solid #ffd700",
          boxShadow: "0 0 30px rgba(255, 215, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Shield className="w-10 h-10 text-yellow-400" />
          <h2
            className="text-4xl font-black text-center font-sans uppercase"
            style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffec80 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Guild of Guardians
          </h2>
          <Shield className="w-10 h-10 text-yellow-400" />
        </div>

        <p className="text-center text-yellow-200 mb-6 font-sans text-lg">
          Protectors of the Gardenverse (50+ Flowers)
        </p>

        {loading ? (
          <p className="text-center text-white font-sans">Loading guardians...</p>
        ) : guardians.length === 0 ? (
          <p className="text-center text-gray-400 font-sans text-lg">
            No guardians yet. Be the first to pick 50 flowers!
          </p>
        ) : (
          <div className="space-y-3">
            {guardians.map((guardian, index) => (
              <div
                key={guardian.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{
                  backgroundColor: index === 0 ? "rgba(255, 215, 0, 0.2)" : "rgba(255, 255, 255, 0.1)",
                  border: index === 0 ? "2px solid #ffd700" : "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="text-2xl font-black font-sans"
                    style={{ color: index === 0 ? "#ffd700" : "#ffffff" }}
                  >
                    #{index + 1}
                  </span>
                  <div>
                    <span
                      className="text-xl font-bold font-sans block"
                      style={{ color: index === 0 ? "#ffd700" : "#ffffff" }}
                    >
                      {guardian.username}
                    </span>
                    <span className="text-sm text-gray-400 font-sans">
                      {new Date(guardian.achieved_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-400 font-sans">
                    {guardian.flower_count}
                  </span>
                  <span className="text-sm text-gray-400 font-sans block">flowers</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-500 mt-6 text-sm font-sans">
          {guardians.length} Guardian{guardians.length !== 1 ? "s" : ""} in the Hall of Fame
        </p>
      </div>
    </div>
  )
}

export default BoardOfGuardians
