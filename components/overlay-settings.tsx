"use client"

import { useState } from "react"
import {
  Settings,
  Clock,
  Gamepad2,
  MessageSquare,
  Eye,
  EyeOff,
  Palette,
  Timer,
  Smartphone,
  Moon,
  MessageCircle,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Type,
} from "lucide-react"

interface Blurb {
  id: string
  text: string
  enabled: boolean
}

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

  // Blurb settings
  blurbs: Blurb[]
  setBlurbs: (blurbs: Blurb[]) => void
  showBlurbs: boolean
  setShowBlurbs: (show: boolean) => void
  blurbIntervalMinutes: number
  setBlurbIntervalMinutes: (minutes: number) => void
  blurbDisplaySeconds: number
  setBlurbDisplaySeconds: (seconds: number) => void
  blurbPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"
  setBlurbPosition: (position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center") => void
  blurbFontSize: number
  setBlurbFontSize: (size: number) => void
  blurbFontFamily: string
  setBlurbFontFamily: (family: string) => void
  blurbTextColor: string
  setBlurbTextColor: (color: string) => void
  blurbBackgroundColor: string
  setBlurbBackgroundColor: (color: string) => void
  blurbShadowColor: string
  setBlurbShadowColor: (color: string) => void
  blurbShadowSize: number
  setBlurbShadowSize: (size: number) => void
  blurbFontWeight: "normal" | "bold" | "black"
  setBlurbFontWeight: (weight: "normal" | "bold" | "black") => void

  // Dark Timer settings
  showDarkTimer: boolean
  setShowDarkTimer: (show: boolean) => void
  darkTimerConnected: boolean

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

  // Color War settings
  showColorWar: boolean
  setShowColorWar: (show: boolean) => void
  colorWarConnected: boolean
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
  blurbs,
  setBlurbs,
  showBlurbs,
  setShowBlurbs,
  blurbIntervalMinutes,
  setBlurbIntervalMinutes,
  blurbDisplaySeconds,
  setBlurbDisplaySeconds,
  blurbPosition,
  setBlurbPosition,
  blurbFontSize,
  setBlurbFontSize,
  blurbFontFamily,
  setBlurbFontFamily,
  blurbTextColor,
  setBlurbTextColor,
  blurbBackgroundColor,
  setBlurbBackgroundColor,
  blurbShadowColor,
  setBlurbShadowColor,
  blurbShadowSize,
  setBlurbShadowSize,
  blurbFontWeight,
  setBlurbFontWeight,
  overlayBackground,
  setOverlayBackground,
  chatConnected,
  lastCommand,
  showDarkTimer,
  setShowDarkTimer,
  darkTimerConnected,
  showWorkTimer,
  setShowWorkTimer,
  workTimerConnected,
  showSocialTimer,
  setShowSocialTimer,
  socialTimerConnected,
  showColorWar,
  setShowColorWar,
  colorWarConnected,
}: OverlaySettingsProps) {
  const [activeTab, setActiveTab] = useState<
    "time" | "blurbs" | "colorwar" | "dark" | "timer" | "social" | "dj" | "chat"
  >("time")
  const [editingBlurbId, setEditingBlurbId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [newBlurbText, setNewBlurbText] = useState("")

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

  const fontFamilies = [
    { name: "Roboto", value: "Roboto, sans-serif" },
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Helvetica", value: "Helvetica, sans-serif" },
    { name: "Inter", value: "Inter, sans-serif" },
    { name: "Poppins", value: "Poppins, sans-serif" },
    { name: "Montserrat", value: "Montserrat, sans-serif" },
    { name: "Open Sans", value: "Open Sans, sans-serif" },
    { name: "Lato", value: "Lato, sans-serif" },
    { name: "Nunito", value: "Nunito, sans-serif" },
    { name: "Source Sans Pro", value: "Source Sans Pro, sans-serif" },
    { name: "Orbitron (Futuristic)", value: "Orbitron, monospace" },
    { name: "Courier New (Mono)", value: "Courier New, monospace" },
  ]

  const addBlurb = () => {
    if (newBlurbText.trim()) {
      const newBlurb: Blurb = {
        id: Date.now().toString(),
        text: newBlurbText.trim(),
        enabled: true,
      }
      setBlurbs([...blurbs, newBlurb])
      setNewBlurbText("")
    }
  }

  const removeBlurb = (id: string) => {
    setBlurbs(blurbs.filter((blurb) => blurb.id !== id))
  }

  const toggleBlurb = (id: string) => {
    setBlurbs(blurbs.map((blurb) => (blurb.id === id ? { ...blurb, enabled: !blurb.enabled } : blurb)))
  }

  const startEditing = (blurb: Blurb) => {
    setEditingBlurbId(blurb.id)
    setEditingText(blurb.text)
  }

  const saveEdit = () => {
    if (editingBlurbId && editingText.trim()) {
      setBlurbs(blurbs.map((blurb) => (blurb.id === editingBlurbId ? { ...blurb, text: editingText.trim() } : blurb)))
      setEditingBlurbId(null)
      setEditingText("")
    }
  }

  const cancelEdit = () => {
    setEditingBlurbId(null)
    setEditingText("")
  }

  const triggerTestBlurb = () => {
    window.dispatchEvent(new Event("triggerManualBlurb"))
  }

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
            onClick={() => setActiveTab("blurbs")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              activeTab === "blurbs" ? "bg-coral text-black" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Blurbs & Reminders
          </button>
          <button
            onClick={() => setActiveTab("dark")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              activeTab === "dark" ? "bg-coral text-black" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <Moon className="w-4 h-4" />
            Dark Timer
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
          <button
            onClick={() => setActiveTab("colorwar")}
            className={`flex items-center gap-2 px-4 py-2 font-bold border-2 border-black rounded ${
              activeTab === "colorwar" ? "bg-coral text-black" : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Color War
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

        {activeTab === "blurbs" && (
          <div className="space-y-6">
            {/* Basic Settings */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Enable Blurbs</label>
                <input
                  type="checkbox"
                  checked={showBlurbs}
                  onChange={(e) => setShowBlurbs(e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Interval (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={blurbIntervalMinutes}
                  onChange={(e) => setBlurbIntervalMinutes(Number(e.target.value))}
                  className="w-full p-2 border-2 border-black rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Display Duration (seconds)</label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={blurbDisplaySeconds}
                  onChange={(e) => setBlurbDisplaySeconds(Number(e.target.value))}
                  className="w-full p-2 border-2 border-black rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Position</label>
                <select
                  value={blurbPosition}
                  onChange={(e) => setBlurbPosition(e.target.value as any)}
                  className="w-full p-2 border-2 border-black rounded"
                >
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="center">Center</option>
                </select>
              </div>
            </div>

            {/* Test Button */}
            <div>
              <button
                onClick={triggerTestBlurb}
                className="px-4 py-2 bg-blue-500 text-white font-bold border-2 border-black rounded hover:bg-blue-600"
              >
                Test Blurb Display
              </button>
              <p className="text-xs mt-1 text-gray-600">
                ✨ Blurbs slide in from the top and exit to the top with smooth animations
              </p>
            </div>

            {/* Typography Settings */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Family
                </label>
                <select
                  value={blurbFontFamily}
                  onChange={(e) => setBlurbFontFamily(e.target.value)}
                  className="w-full p-2 border-2 border-black rounded"
                >
                  {fontFamilies.map((font) => (
                    <option key={font.name} value={font.value}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Font Weight</label>
                <select
                  value={blurbFontWeight}
                  onChange={(e) => setBlurbFontWeight(e.target.value as any)}
                  className="w-full p-2 border-2 border-black rounded"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="black">Black</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Shadow Size</label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={blurbShadowSize}
                  onChange={(e) => setBlurbShadowSize(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600 mt-1">{blurbShadowSize}px</div>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-bold text-black mb-2">Font Size</label>
              <input
                type="range"
                min="16"
                max="64"
                value={blurbFontSize}
                onChange={(e) => setBlurbFontSize(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-600 mt-1">{blurbFontSize}px</div>
            </div>

            {/* Color Settings */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-black mb-2">Text Color</label>
                <input
                  type="color"
                  value={blurbTextColor}
                  onChange={(e) => setBlurbTextColor(e.target.value)}
                  className="w-full h-10 border-2 border-black rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Background Color</label>
                <input
                  type="color"
                  value={blurbBackgroundColor}
                  onChange={(e) => setBlurbBackgroundColor(e.target.value)}
                  className="w-full h-10 border-2 border-black rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-2">Shadow Color</label>
                <input
                  type="color"
                  value={blurbShadowColor}
                  onChange={(e) => setBlurbShadowColor(e.target.value)}
                  className="w-full h-10 border-2 border-black rounded"
                />
              </div>
            </div>

            {/* Add New Blurb */}
            <div className="p-4 border-2 border-black rounded bg-lime-100">
              <h3 className="font-bold text-black mb-2">Add New Blurb</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter blurb text (e.g., 'Follow for more house music!')"
                  value={newBlurbText}
                  onChange={(e) => setNewBlurbText(e.target.value)}
                  className="flex-1 p-2 border-2 border-black rounded"
                />
                <button
                  onClick={addBlurb}
                  className="px-4 py-2 bg-lime-500 text-black font-bold border-2 border-black rounded hover:bg-lime-600 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Blurbs List */}
            <div className="space-y-2">
              <h3 className="font-bold text-black mb-2">Blurbs ({blurbs.filter((b) => b.enabled).length} enabled)</h3>
              {blurbs.length === 0 ? (
                <p className="text-gray-600 italic">No blurbs added yet. Add some reminders above!</p>
              ) : (
                blurbs.map((blurb) => (
                  <div key={blurb.id} className="p-3 border-2 border-black rounded bg-white flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={blurb.enabled}
                      onChange={() => toggleBlurb(blurb.id)}
                      className="w-5 h-5"
                    />
                    {editingBlurbId === blurb.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="flex-1 p-2 border-2 border-black rounded"
                        />
                        <button
                          onClick={saveEdit}
                          className="px-3 py-2 bg-green-500 text-white font-bold border-2 border-black rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-2 bg-gray-500 text-white font-bold border-2 border-black rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`flex-1 ${blurb.enabled ? "text-black" : "text-gray-500"}`}>{blurb.text}</span>
                        <button
                          onClick={() => startEditing(blurb)}
                          className="px-3 py-2 bg-blue-500 text-white font-bold border-2 border-black rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeBlurb(blurb.id)}
                          className="px-3 py-2 bg-red-500 text-white font-bold border-2 border-black rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "dark" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Show Dark Timer</label>
              <input
                type="checkbox"
                checked={showDarkTimer}
                onChange={(e) => setShowDarkTimer(e.target.checked)}
                className="w-5 h-5"
              />
            </div>
            <div className="p-4 border-2 border-black rounded bg-black text-white">
              <h3 className="font-bold mb-2 text-red-400">Dark Vernigosh Commands</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <code className="bg-red-900 text-white px-2 py-1 rounded">!dark</code>
                  <span className="ml-2">Start 20-minute Dark Vernigosh mode</span>
                </div>
                <div>
                  <code className="bg-red-900 text-white px-2 py-1 rounded">!hidedark</code>
                  <span className="ml-2">Hide dark timer (mods only)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-900 rounded">
                <h4 className="font-semibold text-red-400 mb-2">Dark Timer Features</h4>
                <ul className="text-sm space-y-1">
                  <li>• 20-minute countdown timer</li>
                  <li>• Futuristic Orbitron font with red glow</li>
                  <li>• No circle - pure countdown display</li>
                  <li>• Pulsing animation effects</li>
                  <li>• Highest priority (overrides all other timers)</li>
                </ul>
              </div>
              <div className="mt-4 p-3 bg-gray-900 rounded">
                <h4 className="font-semibold text-red-400 mb-2">Connection Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${darkTimerConnected ? "bg-red-500" : "bg-gray-500"}`}></div>
                    <span className="text-sm">{darkTimerConnected ? "Connected to Twitch Chat" : "Disconnected"}</span>
                  </div>
                  <div className="text-xs text-gray-400">Timer must be visible to connect to chat</div>
                  <div className="text-xs text-gray-400">Check browser console (F12) for connection logs</div>
                </div>
              </div>
              <p className="text-xs mt-2 text-red-300">
                💀 Only broadcasters and moderators can control the dark timer
              </p>
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
                  <code className="bg-black text-white px-2 py-1 rounded">!hidework</code>
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
                  <span className="ml-2">Hide spinner (mods only)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-orange-100 rounded">
                <h4 className="font-semibold text-black mb-2">Priority System</h4>
                <p className="text-sm text-black">
                  When DJ Spinner is active, it will temporarily hide all timers. Timers will return when the spinner
                  finishes based on priority: Dark Timer &gt; Social Timer &gt; Work Timer.
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
              <h3 className="font-bold text-black mb-2">Display Priority</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>1. ⚔️ Color War (highest priority - full screen)</p>
                <p>2. 🌑 Dark Timer</p>
                <p>3. 📱 Social Timer</p>
                <p>4. ⏱️ Work Timer (lowest priority)</p>
                <p className="text-xs mt-2 italic">Color War takes over the entire screen when active</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "colorwar" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">Show Color War</label>
              <input
                type="checkbox"
                checked={showColorWar}
                onChange={(e) => setShowColorWar(e.target.checked)}
                className="w-5 h-5"
              />
            </div>
            <div className="p-4 border-2 border-black rounded bg-gradient-to-r from-pink-100 to-green-100">
              <h3 className="font-bold text-black mb-2">⚔️ Color War Commands</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <code className="bg-black text-pink-400 px-2 py-1 rounded">!colorwar</code>
                  <span className="ml-2">Start Color War (mods only)</span>
                </div>
                <div>
                  <code className="bg-black text-green-400 px-2 py-1 rounded">!team green</code>
                  <span className="ml-2">Join Green Force 💚</span>
                </div>
                <div>
                  <code className="bg-black text-pink-400 px-2 py-1 rounded">!team pink</code>
                  <span className="ml-2">Join Pink Army 🌸</span>
                </div>
                <div>
                  <code className="bg-black text-yellow-400 px-2 py-1 rounded">!pick</code>
                  <span className="ml-2">Pick your own mature flowers 🌸</span>
                </div>
                <div>
                  <code className="bg-black text-red-400 px-2 py-1 rounded">!pick old</code>
                  <span className="ml-2">Pick old flowers (mods only)</span>
                </div>
                <div>
                  <code className="bg-black text-red-400 px-2 py-1 rounded">!resetwar</code>
                  <span className="ml-2">Reset game (mods only)</span>
                </div>
                <div>
                  <code className="bg-black text-red-400 px-2 py-1 rounded">!hidewar</code>
                  <span className="ml-2">Hide game (mods only)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-black text-white rounded">
                <h4 className="font-semibold text-pink-400 mb-2">🎮 How to Play:</h4>
                <ol className="text-sm space-y-1">
                  <li>
                    1. Mod starts with <code className="bg-gray-800 px-1 rounded">!colorwar</code>
                  </li>
                  <li>
                    2. Players join: <code className="bg-gray-800 px-1 rounded">!team pink</code> or{" "}
                    <code className="bg-gray-800 px-1 rounded">!team green</code>
                  </li>
                  <li>
                    3. Battle with <code className="bg-gray-800 px-1 rounded">!attack</code> - more active players =
                    stronger attacks!
                  </li>
                  <li>4. First team to capture 100% territory wins! 🏆</li>
                </ol>
              </div>
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <h4 className="font-semibold text-black mb-2">Connection Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colorWarConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span className="text-sm">{colorWarConnected ? "Connected to Twitch Chat" : "Disconnected"}</span>
                  </div>
                  <div className="text-xs text-gray-600">Game must be visible to connect to chat</div>
                  <div className="text-xs text-gray-600">Check browser console (F12) for connection logs</div>
                </div>
              </div>
              <p className="text-xs mt-2 text-black/70">
                🎯 Epic team battles using your brand colors! Pink vs Green supremacy!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
