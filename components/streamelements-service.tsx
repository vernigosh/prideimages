"use client"

import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

export interface StreamCredits {
  followers: string[]
  subscribers: Array<{ name: string; months: number; tier: string; gifted: boolean; gifter?: string }>
  giftSubs: Array<{ gifter: string; count: number }>
  tippers: Array<{ name: string; amount: number }>
  cheerers: Array<{ name: string; bits: number }>
  raiders: Array<{ name: string; viewers: number }>
  merchBuyers: Array<{ name: string; items: string[]; amount: number }>
  charityDonors: Array<{ name: string; amount: number }>
  redeemers: Array<{ name: string; redeems: string[] }>
}

export function useStreamElements() {
  const [recentTippers, setRecentTippers] = useState<Array<{ name: string; amount: number }>>([])
  const [streamCredits, setStreamCredits] = useState<StreamCredits>({
    followers: [],
    subscribers: [],
    giftSubs: [],
    tippers: [],
    cheerers: [],
    raiders: [],
    merchBuyers: [],
    charityDonors: [],
    redeemers: [],
  })
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const fetchTokenAndConnect = async () => {
      try {
        const res = await fetch("/api/streamelements-token")
        const data = await res.json()
        if (data.token) {
          connectToStreamElements(data.token)
        } else {
          console.log("[v0] Failed to fetch StreamElements token")
        }
      } catch (err) {
        console.log("[v0] Error fetching StreamElements token:", err)
      }
    }

    const connectToStreamElements = (jwtToken: string) => {
      try {
        // Use Socket.io realtime instead of Astro WebSockets
        const socket = io("https://realtime.streamelements.com", {
          transports: ["websocket"],
        })
        socketRef.current = socket

        socket.on("connect", () => {
          console.log("[v0] Connected to StreamElements Realtime")
          setIsConnected(true)
          
          // Authenticate with JWT token
          socket.emit("authenticate", {
            method: "jwt",
            token: jwtToken,
          })
        })

        socket.on("authenticated", (data: any) => {
          const { channelId } = data
          console.log("[v0] StreamElements authenticated, channel:", channelId)
        })

        socket.on("unauthorized", (error: any) => {
          console.log("[v0] StreamElements auth failed:", error)
        })

        // Listen for all events - these are the main event handlers
        socket.on("event", (eventData: any) => {
          console.log("[v0] StreamElements EVENT received:", JSON.stringify(eventData))
          handleEvent(eventData)
        })

        socket.on("event:test", (eventData: any) => {
          console.log("[v0] StreamElements TEST EVENT received:", JSON.stringify(eventData))
          handleEvent(eventData)
        })

        socket.on("event:update", (eventData: any) => {
          console.log("[v0] StreamElements UPDATE received:", JSON.stringify(eventData))
        })

        socket.on("event:reset", (eventData: any) => {
          console.log("[v0] StreamElements RESET received:", JSON.stringify(eventData))
        })

        // Catch-all for debugging
        socket.onAny((eventName: string, ...args: any[]) => {
          console.log("[v0] StreamElements ANY event:", eventName, JSON.stringify(args))
        })

        socket.on("disconnect", () => {
          console.log("[v0] StreamElements disconnected")
          setIsConnected(false)
        })

        socket.on("connect_error", (error: any) => {
          console.log("[v0] StreamElements connection error:", error.message)
          setIsConnected(false)
        })
      } catch (error) {
        console.error("[v0] Failed to connect to StreamElements:", error)
      }
    }

    const handleEvent = (eventData: any) => {
      // The event structure is: { type: "follow", data: { username, displayName, ... }, ... }
      const eventType = eventData.type
      const data = eventData.data || {}
      
      console.log("[v0] Processing event - type:", eventType, "data:", JSON.stringify(data))

      // Handle follow events
      if (eventType === "follow") {
        const username = data.displayName || data.username || data.name
        if (username) {
          setStreamCredits((prev) => ({
            ...prev,
            followers: prev.followers.includes(username) ? prev.followers : [...prev.followers, username],
          }))
          console.log("[v0] Follow recorded:", username)
        }
      }

      // Handle subscriber events
      if (eventType === "subscriber") {
        const username = data.displayName || data.username || data.name
        if (username) {
          const months = data.amount || 1
          const tier = data.tier || "1000"
          const gifted = data.gifted || false
          const gifter = data.sender || data.gifter
          setStreamCredits((prev) => ({
            ...prev,
            subscribers: [
              ...prev.subscribers.filter((s) => s.name !== username),
              { name: username, months, tier, gifted, gifter },
            ],
          }))
          console.log("[v0] Sub recorded:", username, months, "months")
          
          // Also track gift subs by gifter
          if (gifted && gifter) {
            setStreamCredits((prev) => {
              const existing = prev.giftSubs.find((g) => g.gifter === gifter)
              const newCount = (existing?.count || 0) + 1
              return {
                ...prev,
                giftSubs: [
                  ...prev.giftSubs.filter((g) => g.gifter !== gifter),
                  { gifter, count: newCount },
                ],
              }
            })
            console.log("[v0] Gift sub recorded from:", gifter)
          }
        }
      }

      // Handle cheer/bits events
      if (eventType === "cheer") {
        const username = data.displayName || data.username || data.name
        const bits = data.amount || 0
        if (username && bits > 0) {
          setStreamCredits((prev) => {
            const existing = prev.cheerers.find((c) => c.name === username)
            const newBits = (existing?.bits || 0) + bits
            return {
              ...prev,
              cheerers: [
                ...prev.cheerers.filter((c) => c.name !== username),
                { name: username, bits: newBits },
              ],
            }
          })
          console.log("[v0] Cheer recorded:", username, bits, "bits")
        }
      }

      // Handle tip events
      if (eventType === "tip") {
        const username = data.displayName || data.username || data.name
        const amount = Number.parseFloat(data.amount) || 0
        if (username && amount > 0) {
          setRecentTippers((prev) => [
            { name: username, amount },
            ...prev.slice(0, 4),
          ])
          setStreamCredits((prev) => {
            const existing = prev.tippers.find((t) => t.name === username)
            const newAmount = (existing?.amount || 0) + amount
            return {
              ...prev,
              tippers: [
                ...prev.tippers.filter((t) => t.name !== username),
                { name: username, amount: newAmount },
              ],
            }
          })
          console.log("[v0] Tip recorded:", username, amount)
        }
      }

      // Handle raid events
      if (eventType === "raid") {
        const username = data.displayName || data.username || data.name
        const viewers = data.amount || data.viewers || 0
        if (username) {
          setStreamCredits((prev) => ({
            ...prev,
            raiders: [...prev.raiders, { name: username, viewers }],
          }))
          console.log("[v0] Raid recorded:", username, viewers, "viewers")
        }
      }

      // Handle bulk/community gift sub events
      if (eventType === "communityGiftPurchase") {
        const gifter = data.displayName || data.username || data.name || data.sender
        const count = data.amount || 1
        if (gifter) {
          setStreamCredits((prev) => {
            const existing = prev.giftSubs.find((g) => g.gifter === gifter)
            const newCount = (existing?.count || 0) + count
            return {
              ...prev,
              giftSubs: [
                ...prev.giftSubs.filter((g) => g.gifter !== gifter),
                { gifter, count: newCount },
              ],
            }
          })
          console.log("[v0] Bulk gift sub recorded:", gifter, count, "subs")
        }
      }

      // Handle merch purchase events
      if (eventType === "merch") {
        const username = data.displayName || data.username || data.name
        const amount = data.amount || 0
        const items = data.items?.map((item: any) => item.name) || []
        if (username) {
          setStreamCredits((prev) => {
            const existing = prev.merchBuyers.find((m) => m.name === username)
            if (existing) {
              return {
                ...prev,
                merchBuyers: [
                  ...prev.merchBuyers.filter((m) => m.name !== username),
                  { name: username, items: [...existing.items, ...items], amount: existing.amount + amount },
                ],
              }
            }
            return {
              ...prev,
              merchBuyers: [...prev.merchBuyers, { name: username, items, amount }],
            }
          })
          console.log("[v0] Merch purchase recorded:", username, items.join(", "), "$" + amount)
        }
      }

      // Handle charity donation events
      if (eventType === "charityCampaignDonation") {
        const username = data.displayName || data.username || data.name
        const amount = data.amount || 0
        if (username && amount > 0) {
          setStreamCredits((prev) => {
            const existing = prev.charityDonors.find((c) => c.name === username)
            const newAmount = (existing?.amount || 0) + amount
            return {
              ...prev,
              charityDonors: [
                ...prev.charityDonors.filter((c) => c.name !== username),
                { name: username, amount: newAmount },
              ],
            }
          })
          console.log("[v0] Charity donation recorded:", username, "$" + amount)
        }
      }

      // Handle channel point redeems
      if (eventType === "redemption") {
        const username = data.displayName || data.username || data.name
        const redeemName = data.redemption || data.title || data.reward || "Unknown Redeem"
        if (username) {
          setStreamCredits((prev) => {
            const existing = prev.redeemers.find((r) => r.name === username)
            if (existing) {
              return {
                ...prev,
                redeemers: [
                  ...prev.redeemers.filter((r) => r.name !== username),
                  { name: username, redeems: [...existing.redeems, redeemName] },
                ],
              }
            }
            return {
              ...prev,
              redeemers: [...prev.redeemers, { name: username, redeems: [redeemName] }],
            }
          })
          console.log("[v0] Redeem recorded:", username, redeemName)
        }
      }
    }

    fetchTokenAndConnect()
  
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  return {
    recentTippers,
    streamCredits,
    isConnected,
  }
}
