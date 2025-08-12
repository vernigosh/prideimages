"use client"

import { useState, useEffect, useRef } from "react"
import { Wifi, WifiOff, Settings } from "lucide-react"

interface ChatIntegrationProps {
  onSpin: (username: string) => void
  onHide: (username: string) => void
  onConnectionChange: (connected: boolean) => void
}

export function ChatIntegration({ onSpin, onHide, onConnectionChange }: ChatIntegrationProps) {
  const [channel, setChannel] = useState("vernigosh") // Pre-filled with your channel
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const [allowedUsers, setAllowedUsers] = useState("mods") // Changed default from "everyone" to "mods"
  const [cooldownSeconds, setCooldownSeconds] = useState(10)
  const [lastSpinTime, setLastSpinTime] = useState(0)

  const clientRef = useRef<any>(null)

  useEffect(() => {
    // Load saved settings, but keep vernigosh as default and mods as default permission
    const savedChannel = localStorage.getItem("twitch-channel") || "vernigosh"
    const savedAllowedUsers = localStorage.getItem("allowed-users") || "mods" // Default to mods
    const savedCooldown = localStorage.getItem("cooldown-seconds")

    if (savedChannel) setChannel(savedChannel)
    if (savedAllowedUsers) setAllowedUsers(savedAllowedUsers)
    if (savedCooldown) setCooldownSeconds(Number.parseInt(savedCooldown))
  }, [])

  const connectToTwitch = async () => {
    if (!channel.trim()) return

    setIsConnecting(true)

    try {
      // Dynamic import to avoid SSR issues
      const tmi = await import("tmi.js")

      const client = new tmi.default.Client({
        channels: [channel.toLowerCase().replace("#", "")],
      })

      client.on("message", (channel, tags, message, self) => {
        if (self) return

        const username = tags["display-name"] || tags.username || "Unknown"
        const isMod = tags.mod || tags["user-type"] === "mod"
        const isBroadcaster = tags.badges?.broadcaster === "1"
        const isSubscriber = tags.subscriber
        const isVip = tags.badges?.vip === "1"

        // Check permissions - Updated to include VIPs by default
        let canUseCommand = false
        if (allowedUsers === "everyone") canUseCommand = true
        else if (allowedUsers === "mods" && (isMod || isBroadcaster || isVip))
          canUseCommand = true // Added VIP here
        else if (allowedUsers === "broadcaster" && isBroadcaster) canUseCommand = true

        if (!canUseCommand) return

        // Check cooldown
        const now = Date.now()
        if (now - lastSpinTime < cooldownSeconds * 1000) return

        const command = message.toLowerCase().trim()

        if (command === "!spin" || command === "!djspin" || command === "!trick") {
          setLastSpinTime(now)
          onSpin(username)
          addRecentCommand(`${command} by ${username}`)
        } else if ((command === "!hidespin" || command === "!hidedj") && (isMod || isBroadcaster || isVip)) {
          onHide(username)
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!worktimer" || command === "!timer") {
          // Trigger work timer start
          window.dispatchEvent(new CustomEvent("startWorkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!stoptimer") {
          window.dispatchEvent(new CustomEvent("stopWorkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!resettimer") {
          window.dispatchEvent(new CustomEvent("resetWorkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!hidetimer" && (isMod || isBroadcaster || isVip)) {
          window.dispatchEvent(new CustomEvent("hideWorkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!social") {
          window.dispatchEvent(new CustomEvent("startSocialTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!hidesocial" && (isMod || isBroadcaster || isVip)) {
          window.dispatchEvent(new CustomEvent("hideSocialTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        }
      })

      client.on("connected", () => {
        setIsConnected(true)
        setIsConnecting(false)
        onConnectionChange(true)
        addRecentCommand(`Connected to #${channel} ✅`)

        // Save settings
        localStorage.setItem("twitch-channel", channel)
        localStorage.setItem("allowed-users", allowedUsers)
        localStorage.setItem("cooldown-seconds", cooldownSeconds.toString())
      })

      client.on("disconnected", () => {
        setIsConnected(false)
        onConnectionChange(false)
        addRecentCommand("Disconnected from Twitch ❌")
      })

      await client.connect()
      clientRef.current = client
    } catch (error) {
      console.error("Failed to connect to Twitch:", error)
      setIsConnecting(false)
      addRecentCommand("Failed to connect to Twitch ❌")
    }
  }

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect()
      clientRef.current = null
    }
    setIsConnected(false)
    onConnectionChange(false)
  }

  const addRecentCommand = (command: string) => {
    setRecentCommands((prev) => [`${new Date().toLocaleTimeString()}: ${command}`, ...prev.slice(0, 9)])
  }

  // Auto-connect on component mount if channel is set
  useEffect(() => {
    if (channel === "vernigosh" && !isConnected && !isConnecting) {
      // Auto-connect to your channel after a short delay
      const timer = setTimeout(() => {
        connectToTwitch()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            {isConnected ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
            Twitch Chat Integration
            {channel === "vernigosh" && <span className="text-sm text-gray-600">(@vernigosh)</span>}
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded bg-gray-100 hover:bg-gray-200"
          >
            <Settings className="w-4 h-4" />
            {showSettings ? "Hide Settings" : "Show Settings"}
          </button>
        </div>

        {showSettings && (
          <div className="grid md:grid-cols-2 gap-6 mb-6 p-4 border-2 border-black rounded bg-gray-50">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Twitch Channel (without #)</label>
              <input
                type="text"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                placeholder="vernigosh"
                className="w-full p-3 border-2 border-black rounded"
                disabled={isConnected}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">Who can use !spin</label>
              <select
                value={allowedUsers}
                onChange={(e) => setAllowedUsers(e.target.value)}
                className="w-full p-3 border-2 border-black rounded"
              >
                <option value="everyone">Everyone</option>
                <option value="mods">Mods + VIPs + Broadcaster</option>
                <option value="broadcaster">Broadcaster Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-2">Cooldown (seconds)</label>
              <input
                type="number"
                value={cooldownSeconds}
                onChange={(e) => setCooldownSeconds(Number.parseInt(e.target.value) || 0)}
                min="0"
                max="300"
                className="w-full p-3 border-2 border-black rounded"
              />
            </div>

            <div className="flex items-end">
              {!isConnected ? (
                <button
                  onClick={connectToTwitch}
                  disabled={isConnecting || !channel.trim()}
                  className="px-6 py-3 font-bold border-2 border-black rounded disabled:opacity-50"
                  style={{ backgroundColor: "#32cd32", color: "black" }}
                >
                  {isConnecting ? "Connecting..." : "Connect to Chat"}
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="px-6 py-3 bg-red-500 text-white font-bold border-2 border-black rounded"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border-2 border-black rounded bg-white">
            <h3 className="font-bold text-black mb-2">Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Connection:</span>
                <span className={isConnected ? "text-green-600 font-bold" : "text-red-600"}>
                  {isConnected ? "Connected ✅" : "Disconnected ❌"}
                </span>
              </div>
              {isConnected && (
                <>
                  <div className="flex justify-between">
                    <span>Channel:</span>
                    <span className="font-mono">#{channel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cooldown:</span>
                    <span>{cooldownSeconds}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Permissions:</span>
                    <span className="text-xs">{allowedUsers}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="p-4 border-2 border-black rounded bg-white">
            <h3 className="font-bold text-black mb-2">Recent Activity</h3>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {recentCommands.length === 0 ? (
                <p className="text-gray-500">No recent activity</p>
              ) : (
                recentCommands.map((command, index) => (
                  <div key={index} className="font-mono text-xs">
                    {command}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 border-2 border-black rounded" style={{ backgroundColor: "#ffb8ad" }}>
          <h3 className="font-bold text-black mb-2">Available Chat Commands:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!spin</code>
              <span className="ml-2">Spin the DJ trick wheel</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!djspin</code>
              <span className="ml-2">Alternative spin command</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!trick</code>
              <span className="ml-2">Another spin command</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!hidespin</code>
              <span className="ml-2">Hide spinner (mods/VIPs only)</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!worktimer</code>
              <span className="ml-2">Start work timer (mods/VIPs only)</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!social</code>
              <span className="ml-2">Start social timer (mods/VIPs only)</span>
            </div>
          </div>
          <p className="text-xs mt-2 text-black/70">
            💡 Default: Only mods, VIPs, and broadcaster can use timer commands!
          </p>
        </div>
      </div>
    </div>
  )
}
