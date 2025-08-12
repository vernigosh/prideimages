"use client"

import { useState } from "react"
import { Settings, Clock, Gamepad2, MessageSquare, Eye, EyeOff, Palette, Timer, Smartphone } from "lucide-react"

interface OverlaySettingsProps {
  // Time settings
  showTimeOverlay: boolean
  setShowTimeOverlay: (show: boolean) => void
  timePosition: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  setTimePosition: (position: "top-left" | "top-right" | "bottom-left" | "bottom-right") => void
  timeZone: string
  setTimeZone: (zone: string) => void
  timeFontSize: number
  setTimeFontSize: (size: number) => void
  showSeconds: boolean
  setShowSeconds: (show: boolean) => void
  textColor: string
  setTextColor: (color: string) => void
  shadowColor: string
  setShadowColor: (color: string) => void
  shadowSize: number
  setShadowSize: (size: number) => void
  fontWeight: "normal" | "bold" | "black"
  setFontWeight: (weight: "normal" | "bold" | "black") => void

  // Work Timer settings
  showWorkTimer: boolean
  setShowWorkTimer: (show: boolean) => void
  workTimerConnected: boolean

  // Social Timer settings
  showSocialTimer: boolean
  setShowSocialTimer: (show: boolean) => void
  socialTimerConnected: boolean

  // Overlay settings
  overlayBackground: "transparent" | "black"
  setOverlayBackground: (bg: "transparent" | "black") => void

  // DJ settings
  chatConnected: boolean
  lastCommand: string
}

export function OverlaySettings({
  showTimeOverlay,
  setShowTimeOverlay,
  timePosition,
  setTimePosition,
  timeZone,
  setTimeZone,
  timeFontSize,
  setTimeFontSize,
  showSeconds,
  setShowSeconds,
  textColor,
  setTextColor,
  shadowColor,
  setShadowColor,
  shadowSize,
  setShadowSize,
  fontWeight,
  setFontWeight,
  overlayBackground,
  setOverlayBackground,
  chatConnected,
  lastCommand,
  showWorkTimer,
  setShowWorkTimer,
  workTimerConnected,
  showSocialTimer,
  setShowSocialTimer,
  socialTimerConnected,
}: OverlaySettingsProps) {
  const [activeTab, setActiveTab] = useState<"time" | "timer" | "social" | "dj" | "chat">("time")

  const colorPresets = [
    { name: "White", value: "#ffffff" },
    { name: "Red", value: "#ff0000" },
    { name: "Green", value: "#00ff00" },
    { name: "Blue", value: "#0066ff" },
    { name: "Yellow", value: "#ffff00" },
    { name: "Purple", value: "#9900ff" },
    { name: "Orange", value: "#ff6600" },
    { name: "Pink", value: "#ff00ff" },
  ]

  return (
    <div className="border-b-4 border-black bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-black flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Unified Overlay Settings
          </h2>

          {/* Overlay Background Toggle */}
          <button
            onClick={() => setOverlayBackground(overlayBackground === "transparent" ? "black" : "transparent")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              overlayBackground === "black" ? "bg-black text-white" : "bg-white text-black"
            }`}
          >
            {overlayBackground === "transparent" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {overlayBackground === "transparent" ? "Show Background" : "Hide Background"}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("time")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              activeTab === "time" ? "bg-coral text-black" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            Time Display
          </button>
          <button
            onClick={() => setActiveTab("timer")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              activeTab === "timer" ? "bg-coral text-black" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <Timer className="w-4 h-4" />
            Work Timer
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              activeTab === "social" ? "bg-coral text-black" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Social Timer
          </button>
          <button
            onClick={() => setActiveTab("dj")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              activeTab === "dj" ? "bg-coral text-black" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            DJ Spinner
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              activeTab === "chat" ? "bg-coral text-black" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat Status
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "time" && (
          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Show Time Overlay</label>
                <input
                  type="checkbox"
                  checked={showTimeOverlay}
                  onChange={(e) => setShowTimeOverlay(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Show Seconds</label>
                <input
                  type="checkbox"
                  checked={showSeconds}
                  onChange={(e) => setShowSeconds(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Position</label>
                <select
                  value={timePosition}
                  onChange={(e) => setTimePosition(e.target.value as any)}
                  className="w-full p-2 border-2 border-black rounded"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Font Weight</label>
                <select
                  value={fontWeight}
                  onChange={(e) => setFontWeight(e.target.value as any)}
                  className="w-full p-2 border-2 border-black rounded"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="black">Black</option>
                </select>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">Font Size</label>
              <input
                type="range"
                min="24"
                max="120"
                value={timeFontSize}
                onChange={(e) => setTimeFontSize(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">{timeFontSize}px</div>
            </div>

            {/* Color Settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Text Color
                </label>
                <div className="flex gap-2 mb-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setTextColor(preset.value)}
                      className="w-8 h-8 rounded border-2 border-black"
                      style={{ backgroundColor: preset.value }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-10 border-2 border-black rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Shadow Color</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setShadowColor("#000000")}
                    className="w-8 h-8 rounded border-2 border-black bg-black"
                    title="Black"
                  />
                  <button
                    onClick={() => setShadowColor("#666666")}
                    className="w-8 h-8 rounded border-2 border-black bg-gray-600"
                    title="Gray"
                  />
                  <button
                    onClick={() => setShadowColor("#ffffff")}
                    className="w-8 h-8 rounded border-2 border-black bg-white"
                    title="White"
                  />
                </div>
                <input
                  type="color"
                  value={shadowColor}
                  onChange={(e) => setShadowColor(e.target.value)}
                  className="w-full h-10 border-2 border-black rounded"
                />
              </div>
            </div>

            {/* Shadow Size */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">Shadow Size</label>
              <input
                type="range"
                min="0"
                max="10"
                value={shadowSize}
                onChange={(e) => setShadowSize(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">{shadowSize}px</div>
            </div>

            {/* Time Zone */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">Time Zone</label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full p-3 border-2 border-black rounded text-lg"
              >
                <optgroup label="🇺🇸 United States">
                  <option value="America/New_York">🇺🇸 New York (Eastern)</option>
                  <option value="America/Chicago">🇺🇸 Chicago (Central)</option>
                  <option value="America/Denver">🇺🇸 Denver (Mountain)</option>
                  <option value="America/Los_Angeles">🇺🇸 Los Angeles (Pacific)</option>
                  <option value="America/Phoenix">🇺🇸 Phoenix (MST)</option>
                  <option value="America/Anchorage">🇺🇸 Anchorage (Alaska)</option>
                  <option value="Pacific/Honolulu">🇺🇸 Honolulu (Hawaii)</option>
                </optgroup>
                <optgroup label="🌍 Europe">
                  <option value="Europe/London">🇬🇧 London</option>
                  <option value="Europe/Paris">🇫🇷 Paris</option>
                  <option value="Europe/Rome">🇮🇹 Rome, Italy</option>
                  <option value="Europe/Berlin">🇩🇪 Berlin</option>
                  <option value="Europe/Madrid">🇪🇸 Madrid</option>
                  <option value="Europe/Amsterdam">🇳🇱 Amsterdam</option>
                  <option value="Europe/Stockholm">🇸🇪 Stockholm</option>
                  <option value="Europe/Moscow">🇷🇺 Moscow</option>
                </optgroup>
                <optgroup label="🌏 Asia & Pacific">
                  <option value="Asia/Tokyo">🇯🇵 Tokyo</option>
                  <option value="Asia/Shanghai">🇨🇳 Shanghai</option>
                  <option value="Asia/Seoul">🇰🇷 Seoul</option>
                  <option value="Asia/Mumbai">🇮🇳 Mumbai</option>
                  <option value="Asia/Dubai">🇦🇪 Dubai</option>
                  <option value="Australia/Sydney">🇦🇺 Sydney</option>
                  <option value="Australia/Melbourne">🇦🇺 Melbourne</option>
                  <option value="Australia/Perth">🇦🇺 Perth</option>
                  <option value="Pacific/Auckland">🇳🇿 Auckland</option>
                </optgroup>
                <optgroup label="🌍 Other">
                  <option value="UTC">🌍 UTC</option>
                </optgroup>
              </select>
            </div>
          </div>
        )}

        {activeTab === "timer" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Show Work Timer</label>
              <input
                type="checkbox"
                checked={showWorkTimer}
                onChange={(e) => setShowWorkTimer(e.target.checked)}
                className="w-5 h-5"
              />
            </div>
            <div className="p-4 border-2 border-black rounded bg-white">
              <h3 className="font-bold text-black mb-2">Work Timer Commands</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <code className="bg-black text-white px-2 py-1 rounded">!worktimer</code>
                  <span className="ml-2">Start 25-minute work session</span>
                </div>
                <div>
                  <code className="bg-black text-white px-2 py-1 rounded">!timer</code>
                  <span className="ml-2">Alternative start command</span>
                </div>
                <div>
                  <code className="bg-black text-white px-2 py-1 rounded">!stoptimer</code>
                  <span className="ml-2">Pause the timer</span>
                </div>
                <div>
                  <code className="bg-black text-white px-2 py-1 rounded">!resettimer</code>
                  <span className="ml-2">Reset timer to 25 minutes</span>
                </div>
                <div>
                  <code className="bg-black text-white px-2 py-1 rounded">!hidetimer</code>
                  <span className="ml-2">Hide timer (mods only)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <h4 className="font-semibold text-black mb-2">Connection Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${workTimerConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span className="text-sm">{workTimerConnected ? "Connected to Twitch Chat" : "Disconnected"}</span>
                  </div>
                  <div className="text-xs text-gray-600">Timer must be visible to connect to chat</div>
                  <div className="text-xs text-gray-600">Check browser console (F12) for connection logs</div>
                </div>
              </div>
              <p className="text-xs mt-2 text-black/70">💡 Only broadcasters and moderators can control the timer</p>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Show Social Timer</label>
              <input
                type="checkbox"
                checked={showSocialTimer}
                onChange={(e) => setShowSocialTimer(e.target.checked)}
                className="w-5 h-5"
              />
            </div>
            <div className="p-4 border-2 border-black rounded bg-white">
              <h3 className="font-bold text-black mb-2">Social Timer Commands</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <code className="bg-black text-white px-2 py-1 rounded">!social</code>
                  <span className="ml-2">Start 2-minute social media break</span>
                </div>
                <div>
                  <code className="bg-black text-white px-2 py-1 rounded">!hidesocial</code>
                  <span className="ml-2">Hide social timer (mods only)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-lime-100 rounded">
                <h4 className="font-semibold text-black mb-2">Timer Features</h4>
                <ul className="text-sm text-black space-y-1">
                  <li>• 2-minute countdown timer</li>
                  <li>• Lime green color theme</li>
                  <li>• No numbers around circle (clean design)</li>
                  <li>• Auto-hides after completion</li>
                </ul>
              </div>
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <h4 className="font-semibold text-black mb-2">Connection Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${socialTimerConnected ? "bg-green-500" : "bg-red-500"}`}
                    ></div>
                    <span className="text-sm">
                      {socialTimerConnected ? "Connected to Twitch Chat" : "Disconnected"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Timer must be visible to connect to chat</div>
                  <div className="text-xs text-gray-600">Check browser console (F12) for connection logs</div>
                </div>
              </div>
              <p className="text-xs mt-2 text-black/70">💡 Only broadcasters and moderators can control the timer</p>
            </div>
          </div>
        )}

        {activeTab === "dj" && (
          <div className="space-y-4">
            <div className="p-4 border-2 border-black rounded bg-white">
              <h3 className="font-bold text-black mb-2">DJ Spinner Commands</h3>
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
                  <span className="ml-2">Hide spinner (mods only)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-orange-100 rounded">
                <h4 className="font-semibold text-black mb-2">Priority System</h4>
                <p className="text-sm text-black">
                  When DJ Spinner is active, it will temporarily hide the Work Timer. The Work Timer will return when
                  the spinner finishes.
                </p>
              </div>
              <p className="text-xs mt-2 text-black/70">💡 Manual controls: Ctrl+S to spin, Ctrl+H to hide</p>
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 border-2 border-black rounded bg-white">
              <h3 className="font-bold text-black mb-2">Connection Status</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${chatConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="font-semibold">{chatConnected ? "Chat Connected" : "Chat Disconnected"}</span>
              </div>
              {lastCommand && <p className="text-sm text-gray-600">Last command: {lastCommand}</p>}
            </div>
            <div className="p-4 border-2 border-black rounded bg-white">
              <h3 className="font-bold text-black mb-2">Left Side Priority</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. 🎵 DJ Spinner (highest priority)</p>
                <p>2. 📱 Social Timer</p>
                <p>3. ⏱️ Work Timer (lowest priority)</p>
                <p className="text-xs mt-2 italic">Only one element shows at a time on the left side</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
