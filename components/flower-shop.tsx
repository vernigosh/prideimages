"use client"

import { useState, useEffect } from "react"

interface FlowerShopProps {
  isVisible: boolean
  onHide: () => void
}

export function FlowerShop({ isVisible, onHide }: FlowerShopProps) {
  const [selectedUser, setSelectedUser] = useState<string>("")

  useEffect(() => {
    const handleShopCommand = (event: CustomEvent) => {
      const { username } = event.detail
      setSelectedUser(username)
    }

    window.addEventListener("showFlowerShop", handleShopCommand as EventListener)

    return () => {
      window.removeEventListener("showFlowerShop", handleShopCommand as EventListener)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-black font-sans">🌸 Flower Shop</h2>
          <button onClick={onHide} className="text-2xl font-bold text-black hover:text-red-600">
            ✕
          </button>
        </div>

        <div className="text-center p-8">
          <p className="text-lg text-gray-700 mb-4">Flower redemption system coming soon!</p>
          <p className="text-sm text-gray-600">
            Pick flowers in the garden with <code className="bg-gray-800 text-white px-1 rounded">!pick</code>
          </p>
        </div>
      </div>
    </div>
  )
}
