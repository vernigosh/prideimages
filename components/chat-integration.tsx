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

  const testColorWar = () => {
    console.log("Manual test: Starting color war")
    window.dispatchEvent(new CustomEvent("startColorWar", { detail: { username: "Manual Test" } }))
    addRecentCommand("!colorwar by Manual Test (manual)")
  }

  const testGarden = () => {
    console.log("Manual test: Starting community garden")
    window.dispatchEvent(new CustomEvent("startGarden", { detail: { username: "Manual Test" } }))
    addRecentCommand("!startgarden by Manual Test (manual)")
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
        console.log("Username:", tags["display-name"] || tags.username)
        console.log("Self:", self)
        console.log("Raw tags:", tags)

        // Add this new logging
        console.log("allowedUsers setting:", allowedUsers)
        console.log("Message matches !plant:", message.toLowerCase().trim() === "!plant")

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

        const command = message.toLowerCase().trim()
        console.log("Processing command:", command)

        // Check permissions for restricted commands only
        const isRestrictedCommand =
          !command.startsWith("!plant") &&
          command !== "!water" &&
          command !== "!watering" &&
          command !== "!harvest" &&
          command !== "!attack" &&
          command !== "!charge" &&
          command !== "!battle" &&
          command !== "!team pink" &&
          command !== "!pink" &&
          command !== "!team green" &&
          command !== "!green"

        if (isRestrictedCommand) {
          let canUseCommand = false
          if (allowedUsers === "everyone") canUseCommand = true
          else if (allowedUsers === "mods" && (isMod || isBroadcaster || isVip)) canUseCommand = true
          else if (allowedUsers === "broadcaster" && isBroadcaster) canUseCommand = true

          console.log("Can use restricted command:", canUseCommand, "allowedUsers setting:", allowedUsers)

          if (!canUseCommand) {
            console.log("User not authorized for restricted commands")
            return
          }
        }

        // Check cooldown only for DJ spinner commands
        if (command === "!spin" || command === "!djspin" || command === "!trick") {
          const now = Date.now()
          if (now - lastSpinTime < cooldownSeconds * 1000) {
            console.log("Command on cooldown")
            return
          }
          setLastSpinTime(now)
        }

        if (command === "!spin" || command === "!djspin" || command === "!trick") {
          console.log("DJ Spinner command detected")
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
        } else if (command === "!resettimer" && (isMod || isBroadcaster || isVip)) {
          console.log("Universal reset timer command detected")
          // Dispatch event to reset any visible timer
          window.dispatchEvent(new CustomEvent("resetAnyTimer", { detail: { username } }))
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
        } else if (command === "!hidetimer" && (isMod || isBroadcaster || isVip)) {
          console.log("Universal hide timer command detected")
          // Dispatch event to hide any visible timer
          window.dispatchEvent(new CustomEvent("hideAnyTimer", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        }
        // COLOR WAR COMMANDS
        else if (command === "!colorwar" && (isMod || isBroadcaster || isVip)) {
          console.log("Color war start command detected")
          window.dispatchEvent(new CustomEvent("startColorWar", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!team pink" || command === "!pink") {
          console.log("Join pink team command detected")
          window.dispatchEvent(new CustomEvent("joinColorTeam", { detail: { username, team: "pink" } }))
          addRecentCommand(`!team pink by ${username}`)
        } else if (command === "!team green" || command === "!green") {
          console.log("Join green team command detected")
          window.dispatchEvent(new CustomEvent("joinColorTeam", { detail: { username, team: "green" } }))
          addRecentCommand(`!team green by ${username}`)
        } else if (command === "!attack" || command === "!charge" || command === "!battle") {
          console.log("Color war attack command detected")
          // Find user's team from recent commands or default to their choice
          const userTeam = recentCommands.find(
            (cmd) => cmd.includes(`by ${username}`) && (cmd.includes("pink") || cmd.includes("green")),
          )
          const team = userTeam?.includes("pink") ? "pink" : userTeam?.includes("green") ? "green" : null
          if (team) {
            window.dispatchEvent(new CustomEvent("colorWarAttack", { detail: { username, team } }))
            addRecentCommand(`!attack by ${username} (${team})`)
          }
        } else if (command === "!resetwar" && (isMod || isBroadcaster || isVip)) {
          console.log("Reset color war command detected")
          window.dispatchEvent(new CustomEvent("resetColorWar", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!hidewar" && (isMod || isBroadcaster || isVip)) {
          console.log("Hide color war command detected")
          window.dispatchEvent(new CustomEvent("hideColorWar", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        }
        // COMMUNITY GARDEN COMMANDS - Changed !garden to !startgarden
        else if (command.startsWith("!plant")) {
          console.log("Checking garden commands for message:", command)
          console.log("User can use command:", true)
          console.log("Plant flower command detected - processing...")
          const parts = command.split(" ")
          const flowerType = parts[1] || "wildflower" // Default to wildflower
          const validTypes = ["rose", "tulip", "sunflower", "daisy", "lily", "wildflower"]
          const finalType = validTypes.includes(flowerType) ? flowerType : "wildflower"

          // Determine color based on flower type or random
          let color = "mixed"
          if (finalType === "rose" || finalType === "tulip") color = "pink"
          else if (finalType === "sunflower" || finalType === "daisy") color = "green"

          window.dispatchEvent(
            new CustomEvent("plantFlower", {
              detail: { username, flowerType: finalType, color },
            }),
          )
          addRecentCommand(`!plant ${finalType} by ${username}`)
        } else if (command === "!water" || command === "!watering") {
          console.log("Water garden command detected")
          window.dispatchEvent(new CustomEvent("waterGarden", { detail: { username } }))
          addRecentCommand(`!water by ${username}`)
        } else if (command === "!harvest") {
          console.log("Harvest garden command detected")
          window.dispatchEvent(new CustomEvent("harvestGarden", { detail: { username } }))
          addRecentCommand(`!harvest by ${username}`)
        } else if (command === "!startgarden" && (isMod || isBroadcaster || isVip)) {
          console.log("Start garden command detected")
          window.dispatchEvent(new CustomEvent("startGarden", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!resetgarden" && (isMod || isBroadcaster || isVip)) {
          console.log("Reset garden command detected")
          window.dispatchEvent(new CustomEvent("resetGarden", { detail: { username } }))
          addRecentCommand(`${command} by ${username}`)
        } else if (command === "!hidegarden" && (isMod || isBroadcaster || isVip)) {
          console.log("Hide garden command detected")
          window.dispatchEvent(new CustomEvent("hideGarden", { detail: { username } }))
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
          <h3 className="font-bold text-black mb-2">Manual Tests</h3>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={testColorWar}
              className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded hover:bg-pink-200 text-black"
              style={{ backgroundColor: "#ffb8ad" }}
            >
              <Play className="w-4 h-4" />
              Test Color War
            </button>
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
            <button
              onClick={testGarden}
              className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded bg-green-400 hover:bg-green-500 text-black"
            >
              <Play className="w-4 h-4" />
              Test Garden
            </button>
            <button
              onClick={() => {
                console.log("Manual test: Spawning test flowers in garden")
                // Trigger the test spawn function
                window.dispatchEvent(new Event("spawnTestFlowers"))
                addRecentCommand("Spawn test flowers by Manual Test (manual)")
              }}
              className="flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded bg-green-400 hover:bg-green-500 text-black"
            >
              <Play className="w-4 h-4" />
              Spawn Test Flowers
            </button>
          </div>
          <p className="text-xs mt-2 text-black/70">Use these buttons to test functionality without chat commands</p>
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
              <label className="block text-sm font-bold text-black mb-2">Who can use commands</label>
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
            {/* Existing Commands */}
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!dark</code>
              <span className="ml-2">Start 20min Dark Vernigosh mode</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!spin</code>
              <span className="ml-2">Spin the DJ technique wheel</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!worktimer</code>
              <span className="ml-2">Start 25-minute work session</span>
            </div>
            <div>
              <code className="bg-black text-white px-2 py-1 rounded">!social</code>
              <span className="ml-2">Start 2-minute social timer</span>
            </div>

            {/* NEW COLOR WAR COMMANDS */}
            <div>
              <code className="bg-black text-pink-400 px-2 py-1 rounded font-bold">!colorwar</code>
              <span className="ml-2 font-bold">Start Color War (mods only)</span>
            </div>
            <div>
              <code className="bg-black text-pink-400 px-2 py-1 rounded">!team pink</code>
              <span className="ml-2">Join the Pink Army 🌸</span>
            </div>
            <div>
              <code className="bg-black text-green-400 px-2 py-1 rounded">!team green</code>
              <span className="ml-2">Join the Green Force 💚</span>
            </div>
            <div>
              <code className="bg-black text-yellow-400 px-2 py-1 rounded">!attack</code>
              <span className="ml-2">Attack for your team! ⚔️</span>
            </div>
            <div>
              <code className="bg-black text-red-400 px-2 py-1 rounded">!resetwar</code>
              <span className="ml-2">Reset Color War (mods only)</span>
            </div>
            <div>
              <code className="bg-black text-red-400 px-2 py-1 rounded">!hidewar</code>
              <span className="ml-2">Hide Color War (mods only)</span>
            </div>

            {/* COMMUNITY GARDEN COMMANDS - Updated !garden to !startgarden */}
            <div>
              <code className="bg-black text-green-400 px-2 py-1 rounded font-bold">!startgarden</code>
              <span className="ml-2 font-bold">Start Community Garden (mods only)</span>
            </div>
            <div>
              <code className="bg-black text-green-400 px-2 py-1 rounded">!plant rose</code>
              <span className="ml-2">Plant a flower (rose, tulip, sunflower, daisy, lily)</span>
            </div>
            <div>
              <code className="bg-black text-blue-400 px-2 py-1 rounded">!water</code>
              <span className="ml-2">Water the garden 💧 (5min cooldown)</span>
            </div>
            <div>
              <code className="bg-black text-yellow-400 px-2 py-1 rounded">!harvest</code>
              <span className="ml-2">Harvest mature flowers 🌸</span>
            </div>
            <div>
              <code className="bg-black text-red-400 px-2 py-1 rounded">!resetgarden</code>
              <span className="ml-2">Reset garden (mods only)</span>
            </div>
            <div>
              <code className="bg-black text-red-400 px-2 py-1 rounded">!hidegarden</code>
              <span className="ml-2">Hide garden (mods only)</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-black text-white rounded">
            <h4 className="font-bold text-pink-400 mb-2">🎮 COLOR WAR GAMEPLAY:</h4>
            <ol className="text-sm space-y-1">
              <li>
                1. Mod starts with <code className="bg-gray-800 px-1 rounded">!colorwar</code>
              </li>
              <li>
                2. Players join teams: <code className="bg-gray-800 px-1 rounded">!team pink</code> or{" "}
                <code className="bg-gray-800 px-1 rounded">!team green</code>
              </li>
              <li>
                3. Battle with <code className="bg-gray-800 px-1 rounded">!attack</code> - team with more active players
                wins territory!
              </li>
              <li>4. First team to 100% territory wins! 🏆</li>
            </ol>
          </div>
          <div className="mt-4 p-3 bg-green-100 rounded">
            <h4 className="font-bold text-green-800 mb-2">🌸 COMMUNITY GARDEN GAMEPLAY:</h4>
            <ol className="text-sm space-y-1 text-green-700">
              <li>
                1. Mod starts with <code className="bg-gray-800 text-white px-1 rounded">!startgarden</code>
              </li>
              <li>
                2. Plant flowers: <code className="bg-gray-800 text-white px-1 rounded">!plant rose</code> (5min
                cooldown per person)
              </li>
              <li>
                3. Help garden grow: <code className="bg-gray-800 text-white px-1 rounded">!water</code> creates rain
                effect! (5min cooldown)
              </li>
              <li>
                4. Harvest mature flowers: <code className="bg-gray-800 text-white px-1 rounded">!harvest</code> clears
                space for new plants
              </li>
              <li>5. Watch your flowers grow from seeds to beautiful blooms! 🌱→✨→🌸</li>
            </ol>
          </div>
          <p className="text-xs mt-2 text-black/70">
            🎯 <strong>Community Garden</strong>: Collaborative flower growing with beautiful pixel rain effects!
          </p>
          <p className="text-xs mt-1 text-black/70">
            🌸 <strong>Color War</strong>: Epic team battles using your brand colors! Pink vs Green supremacy!
          </p>
        </div>
      </div>
    </div>
  )
}
