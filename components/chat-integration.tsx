"use client"

import { useState, useEffect, useRef } from "react"
import { Wifi, WifiOff, Settings, Play } from "lucide-react"

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

  // Manual test functions
  const testWorkTimer = () => {
    console.log("Manual test: Starting work timer")
    window.dispatchEvent(new CustomEvent("startWorkTimer", { detail: { username: "Manual Test" } }))
    addRecentCommand("!worktimer by Manual Test (manual)")
  }

  const testSocialTimer = () => {
    console.log("Manual test: Starting social timer")
    window.dispatchEvent(new CustomEvent("startSocialTimer", { detail: { username: "Manual Test" } }))
    addRecentCommand("!social by Manual Test (manual)")
  }

  const testDarkTimer = () => {
    console.log("Manual test: Starting dark timer")
    window.dispatchEvent(new CustomEvent("startDarkTimer", { detail: { username: "Manual Test" } }))
    addRecentCommand("!dark by Manual Test (manual)")
  }

  const connectToTwitch = async () => {
    if (!channel.trim()) return

    setIsConnecting(true)
    console.log("Attempting to connect to Twitch chat...")

    try {
      // Dynamic import to avoid SSR issues
      const tmi = await import("tmi.js")
      console.log("TMI.js loaded successfully")

      const client = new tmi.default.Client({
        channels: [channel.toLowerCase().replace("#", "")],
      })

      console.log("TMI client created, setting up event handlers...")

      client.on("message", (channel, tags, message, self) => {
        console.log("=== CHAT MESSAGE RECEIVED ===")
        console.log("Channel:", channel)
        console.log("Message:", message)
        console.log("Self:", self)
        console.log("Tags:", tags)

        if (self) {
          console.log("Ignoring own message")
          return
        }

        const username = tags["display-name"] || tags.username || "Unknown"
        const isMod = tags.mod || tags["user-type"] === "mod"
        const isBroadcaster = tags.badges?.broadcaster === "1"
        const isSubscriber = tags.subscriber
        const isVip = tags.badges?.vip === "1"

        console.log("Chat message received:", message, "from", username)
        console.log("User permissions:", { isMod, isBroadcaster, isVip })

        // Check permissions - Updated to include VIPs by default
        let canUseCommand = false
        if (allowedUsers === "everyone") canUseCommand = true
        else if (allowedUsers === "mods" && (isMod || isBroadcaster || isVip))
          canUseCommand = true // Added VIP here
        else if (allowedUsers === "broadcaster" && isBroadcaster) canUseCommand = true

        console.log("Can use command:", canUseCommand, "allowedUsers setting:", allowedUsers)

        if (!canUseCommand) {
          console.log("User not authorized for commands")
          return
        }

        // Check cooldown
        const now = Date.now()
        if (now - lastSpinTime < cooldownSeconds * 1000) {
          console.log("Command on cooldown")
          return
        }

        const command = message.toLowerCase().trim()
        console.log("Processing command:", command)

        if (command === "!spin" || command === "!djspin" || command === "!trick") {
          console.log("DJ Spinner command detected")
          setLastSpinTime(now)
          onSpin(username)
          addRecentCommand(`${command} by ${username}`)
        } else if ((command === "!hidespin" || command === "!hidedj") && (isMod || isBroadcaster || isVip)) {
          console.log("Hide DJ command detected")
          onHide(username)
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!dark") {
          console.log("Dark timer start command detected")
          window.dispatchEvent(new CustomEvent("startDarkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!hidedark" && (isMod || isBroadcaster || isVip)) {
          console.log("Hide dark timer command detected")
          window.dispatchEvent(new CustomEvent("hideDarkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!worktimer" || command === "!timer") {
          console.log("Work timer start command detected")
          // Trigger work timer start
          window.dispatchEvent(new CustomEvent("startWorkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!stoptimer") {
          console.log("Work timer stop command detected")
          window.dispatchEvent(new CustomEvent("stopWorkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!resettimer") {
          console.log("Work timer reset command detected")
          window.dispatchEvent(new CustomEvent("resetWorkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!hidework" && (isMod || isBroadcaster || isVip)) {
          console.log("Hide work timer command detected")
          window.dispatchEvent(new CustomEvent("hideWorkTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!social") {
          console.log("Social timer start command detected")
          window.dispatchEvent(new CustomEvent("startSocialTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!hidesocial" && (isMod || isBroadcaster || isVip)) {
          console.log("Hide social timer command detected")
          window.dispatchEvent(new CustomEvent("hideSocialTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else {
          console.log("Unknown command:", command)
        }
      })

      client.on("connected", (addr, port) => {
        console.log("Connected to Twitch IRC:", addr, port)
        setIsConnected(true)
        setIsConnecting(false)
        onConnectionChange(true)
        addRecentCommand(`Connected to #${channel} ✅`)

        // Save settings
        localStorage.setItem("twitch-channel", channel)
        localStorage.setItem("allowed-users", allowedUsers)
        localStorage.setItem("cooldown-seconds", cooldownSeconds.toString())
      })

      client.on("disconnected", (reason) => {
        console.log("Disconnected from Twitch IRC:", reason)
        setIsConnected(false)
        onConnectionChange(false)
        addRecentCommand("Disconnected from Twitch ❌")
      })

      client.on("join", (channel, username, self) => {
        console.log("Joined channel:", channel, "as", username, "self:", self)
      })

      client.on("part", (channel, username, self) => {
        console.log("Left channel:", channel, "as", username, "self:", self)
      })

      console.log("Connecting to Twitch...")
      await client.connect()
      clientRef.current = client
      console.log("Connection attempt completed")
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

        {/* Manual Test Buttons */}
        <div className="mb-6 p-4 border-2 border-black rounded bg-yellow-100">
          <h3 className="font-bold text-black mb-2">Manual Timer Tests</h3>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={testDarkTimer}
              className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded bg-black hover:bg-gray-800 text-white"
            >
              <Play className="w-4 h-4" />
              Test Dark Timer
            </button>
            <button
              onClick={testWorkTimer}
              className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded bg-red-400 hover:bg-red-500 text-white"
            >
              <Play className="w-4 h-4" />
              Test Work Timer
            </button>
            <button
              onClick={testSocialTimer}
              className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded bg-lime-400 hover:bg-lime-500 text-black"
            >
              <Play className="w-4 h-4" />
              Test Social Timer
            </button>
          </div>
          <p className="text-xs mt-2 text-black/70">
            Use these buttons to test timer functionality without chat commands
          </p>
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
              <code className="bg-black text-white px-2 py-1 rounded">!dark</code>
              <span className="ml-2">Start 20min Dark Vernigosh mode</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!hidedark</code>
              <span className="ml-2">Hide dark timer (mods/VIPs only)</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!spin</code>
              <span className="ml-2">Spin the DJ technique wheel</span>
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
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!hidework</code>
              <span className="ml-2">Hide work timer (mods/VIPs only)</span>
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
