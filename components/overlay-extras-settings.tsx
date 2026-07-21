"use client"

import { Timer, MessageSquare, Sprout, RotateCcw } from "lucide-react"
import type { WorkTimerSettings } from "./work-timer"
import type { ChatOverlaySettings } from "./chat-overlay"
import type { GardenActivitySettings } from "./community-garden"
import type { NormalizedChatMessage } from "@/lib/chat-commands"

interface OverlayExtrasSettingsProps {
  workTimer: WorkTimerSettings
  setWorkTimer: (patch: Partial<WorkTimerSettings>) => void
  resetWorkTimer: () => void
  chat: ChatOverlaySettings
  setChat: (patch: Partial<ChatOverlaySettings>) => void
  resetChat: () => void
  gardenActivity: GardenActivitySettings
  setGardenActivity: (patch: Partial<GardenActivitySettings>) => void
  resetGardenActivity: () => void
}

// --- Small reusable controls (match the existing bold/black settings style) ---
function Range({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-black">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm font-bold text-black">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" />
      {label}
    </label>
  )
}

function TestButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-black hover:text-white"
    >
      {label}
    </button>
  )
}

// Dispatch a synthetic chat message through the exact same window event the real
// incoming chat path uses, so tests exercise the real render + filter pipeline.
function dispatchTestChat(msg: Partial<NormalizedChatMessage>) {
  const base: NormalizedChatMessage = {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username: "TestViewer",
    color: "#4ade80",
    badges: { broadcaster: false, moderator: false, vip: false, subscriber: false },
    message: "Hello from the test message!",
    emotes: [],
    isBot: false,
    isCommand: false,
    isRecognizedCommand: false,
    timestamp: Date.now(),
    ...msg,
  }
  window.dispatchEvent(new CustomEvent("overlayChatMessage", { detail: base }))
}

export function OverlayExtrasSettings({
  workTimer,
  setWorkTimer,
  resetWorkTimer,
  chat,
  setChat,
  resetChat,
  gardenActivity: garden,
  setGardenActivity: setGarden,
  resetGardenActivity: resetGarden,
}: OverlayExtrasSettingsProps) {
  return (
    <div className="border-b-4 border-black bg-gray-50 p-6">
      <div className="grid gap-8 md:grid-cols-2">
        {/* ---------------- Work Timer Layout ---------------- */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-black">
            <Timer className="h-6 w-6" />
            Work Timer Layout
          </h3>
          <div className="space-y-4">
            <Check label="Show intro banner on FOCUS/BREAK change" checked={workTimer.introEnabled} onChange={(v) => setWorkTimer({ introEnabled: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-black">Focus intro text</label>
                <input type="text" value={workTimer.focusIntroText} onChange={(e) => setWorkTimer({ focusIntroText: e.target.value })} className="w-full rounded border-2 border-black p-2" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-black">Break intro text</label>
                <input type="text" value={workTimer.breakIntroText} onChange={(e) => setWorkTimer({ breakIntroText: e.target.value })} className="w-full rounded border-2 border-black p-2" />
              </div>
            </div>
            <Range label={`Intro duration (${Math.round(workTimer.introDuration / 1000)}s)`} min={2} max={15} value={Math.round(workTimer.introDuration / 1000)} onChange={(v) => setWorkTimer({ introDuration: v * 1000 })} />
            <Range label={`Scale (${workTimer.scale.toFixed(2)}x)`} min={0.5} max={1.6} step={0.05} value={workTimer.scale} onChange={(v) => setWorkTimer({ scale: v })} />
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Offset X (${workTimer.offsetX}px from right)`} min={0} max={400} value={workTimer.offsetX} onChange={(v) => setWorkTimer({ offsetX: v })} />
              <Range label={`Offset Y (${workTimer.offsetY}px)`} min={-300} max={300} value={workTimer.offsetY} onChange={(v) => setWorkTimer({ offsetY: v })} />
            </div>
            <button type="button" onClick={resetWorkTimer} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black">
              <RotateCcw className="h-3.5 w-3.5" /> Reset defaults
            </button>
          </div>
        </div>

        {/* ---------------- Chat Overlay ---------------- */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-black">
            <MessageSquare className="h-6 w-6" />
            Chat & Event Stack
          </h3>
          <div className="space-y-4">
            <Check label="Enabled" checked={chat.enabled} onChange={(v) => setChat({ enabled: v })} />
            <div className="grid grid-cols-2 gap-4">
              <Range label={`X inset from left (${chat.offsetX}px)`} min={0} max={600} value={chat.offsetX} onChange={(v) => setChat({ offsetX: v })} />
              <Range label={`Y inset from bottom (${chat.offsetY}px)`} min={0} max={600} value={chat.offsetY} onChange={(v) => setChat({ offsetY: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Width (${chat.width}px)`} min={220} max={640} value={chat.width} onChange={(v) => setChat({ width: v })} />
              <Range label={`Visible messages (${chat.visibleCount})`} min={1} max={3} value={chat.visibleCount} onChange={(v) => setChat({ visibleCount: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Username size (${chat.usernameFontSize}px)`} min={20} max={44} value={chat.usernameFontSize} onChange={(v) => setChat({ usernameFontSize: v })} />
              <Range label={`Message size (${chat.messageFontSize}px)`} min={20} max={44} value={chat.messageFontSize} onChange={(v) => setChat({ messageFontSize: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Lifetime (${Math.round(chat.lifetimeMs / 1000)}s)`} min={5} max={60} value={Math.round(chat.lifetimeMs / 1000)} onChange={(v) => setChat({ lifetimeMs: v * 1000 })} />
              <Range label={`Background opacity (${chat.backgroundOpacity.toFixed(2)})`} min={0} max={1} step={0.02} value={chat.backgroundOpacity} onChange={(v) => setChat({ backgroundOpacity: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Corner radius (${chat.borderRadius}px)`} min={0} max={28} value={chat.borderRadius} onChange={(v) => setChat({ borderRadius: v })} />
              <Range label={`Card gap (${chat.cardGap}px)`} min={0} max={24} value={chat.cardGap} onChange={(v) => setChat({ cardGap: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Padding X (${chat.paddingX}px)`} min={6} max={40} value={chat.paddingX} onChange={(v) => setChat({ paddingX: v })} />
              <Range label={`Padding Y (${chat.paddingY}px)`} min={4} max={32} value={chat.paddingY} onChange={(v) => setChat({ paddingY: v })} />
            </div>
            <Range label={`Max lines (${chat.maxLines})`} min={1} max={4} value={chat.maxLines} onChange={(v) => setChat({ maxLines: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Check label="Show emotes" checked={chat.showEmotes} onChange={(v) => setChat({ showEmotes: v })} />
              <Check label="Uppercase presentation" checked={chat.uppercase} onChange={(v) => setChat({ uppercase: v })} />
              <Check label="Hide recognized commands" checked={chat.hideRecognizedCommands} onChange={(v) => setChat({ hideRecognizedCommands: v })} />
              <Check label="Hide all ! messages" checked={chat.hideAllCommands} onChange={(v) => setChat({ hideAllCommands: v })} />
              <Check label="Hide known bots" checked={chat.hideBots} onChange={(v) => setChat({ hideBots: v })} />
              <Check label="Use Twitch username colors" checked={chat.useTwitchUsernameColors} onChange={(v) => setChat({ useTwitchUsernameColors: v })} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-black">Ignored users (comma separated)</label>
              <input
                type="text"
                value={chat.ignoredUsers.join(", ")}
                onChange={(e) => setChat({ ignoredUsers: e.target.value.split(",").map((u) => u.trim()).filter(Boolean) })}
                className="w-full rounded border-2 border-black p-2"
                placeholder="e.g. somebot, spammer123"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <TestButton label="Test normal" onClick={() => dispatchTestChat({ username: "PixelFan", message: "hey everyone, loving the set tonight!" })} />
              <TestButton label="Test long" onClick={() => dispatchTestChat({ username: "ChattyCathy", message: "this is a really long message meant to test the maximum line clamping behavior of the chat overlay cards so we can confirm it truncates nicely without overflowing the box" })} />
              <TestButton label="Test emotes" onClick={() => dispatchTestChat({ username: "EmoteLord", color: "#38bdf8", message: "Kappa nice one Kappa", emotes: [ { id: "25", code: "Kappa", start: 0, end: 4 }, { id: "25", code: "Kappa", start: 15, end: 19 } ] })} />
              <TestButton label="Test bright color" onClick={() => dispatchTestChat({ username: "NeonNova", color: "#00ff7f", message: "bright spring-green username here!" })} />
              <TestButton label="Test dark color" onClick={() => dispatchTestChat({ username: "MidnightMax", color: "#0000ff", message: "dark blue username stays exactly this color" })} />
              <TestButton label="Test no color (pink)" onClick={() => dispatchTestChat({ username: "ColorlessCarl", color: undefined, message: "no twitch color, falls back to vernigosh pink" })} />
              <TestButton label="Test mixed colors" onClick={() => {
                dispatchTestChat({ username: "RubyRed", color: "#ff0000", message: "first color" })
                setTimeout(() => dispatchTestChat({ username: "GoldenGoose", color: "#daa520", message: "second color" }), 120)
                setTimeout(() => dispatchTestChat({ username: "TealTina", color: "#008080", message: "third color" }), 240)
              }} />
              {/* Spaced ~500ms apart so each enter + slide-up is clearly visible. */}
              <TestButton label="Test 3 staggered" onClick={() => {
                dispatchTestChat({ username: "AnimOne", color: "#38bdf8", message: "message one — watch me slide in" })
                setTimeout(() => dispatchTestChat({ username: "AnimTwo", color: "#f59e0b", message: "message two pushes one up" }), 500)
                setTimeout(() => dispatchTestChat({ username: "AnimThree", color: "#34d399", message: "message three, smooth flow" }), 1000)
              }} />
              <TestButton label="Clear messages" onClick={() => window.dispatchEvent(new Event("clearChatOverlay"))} />
            </div>
            <button type="button" onClick={resetChat} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black">
              <RotateCcw className="h-3.5 w-3.5" /> Reset defaults
            </button>
          </div>
        </div>

        {/* ---------------- Garden Activity ---------------- */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-black">
            <Sprout className="h-6 w-6" />
            Garden Activity
          </h3>
          <div className="space-y-4">
            <p className="text-xs text-gray-600">Routine plant/water/pick messages. The garden must be active to display.</p>
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Offset X (${garden.offsetX}px)`} min={-600} max={600} value={garden.offsetX} onChange={(v) => setGarden({ offsetX: v })} />
              <Range label={`Offset Y (${garden.offsetY}px)`} min={0} max={700} value={garden.offsetY} onChange={(v) => setGarden({ offsetY: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Width (${garden.width}px)`} min={240} max={900} value={garden.width} onChange={(v) => setGarden({ width: v })} />
              <Range label={`Font size (${garden.fontSize}px)`} min={14} max={40} value={garden.fontSize} onChange={(v) => setGarden({ fontSize: v })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Range label={`Lifetime (${Math.round(garden.lifetimeMs / 1000)}s)`} min={2} max={20} value={Math.round(garden.lifetimeMs / 1000)} onChange={(v) => setGarden({ lifetimeMs: v * 1000 })} />
              <Range label={`Background opacity (${garden.backgroundOpacity.toFixed(2)})`} min={0} max={1} step={0.02} value={garden.backgroundOpacity} onChange={(v) => setGarden({ backgroundOpacity: v })} />
            </div>
                <div className="grid grid-cols-2 gap-4">
                  <Check label="Garden target effect" checked={garden.highlightEnabled} onChange={(v) => setGarden({ highlightEnabled: v })} />
                  <Range label={`Effect duration (${(garden.highlightMs / 1000).toFixed(1)}s)`} min={0.6} max={3} step={0.1} value={garden.highlightMs / 1000} onChange={(v) => setGarden({ highlightMs: Math.round(v * 1000) })} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold text-black">Effect intensity</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setGarden({ highlightIntensity: level })}
                        className={`flex-1 rounded border-2 border-black px-3 py-1.5 text-sm font-bold capitalize ${garden.highlightIntensity === level ? "bg-black text-white" : "bg-white text-black"}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600">Plays a brief flower power-up on the exact flower a plant message references, when that message becomes visible. Respects reduced-motion.</p>
                <div className="flex flex-wrap gap-2">
                  <TestButton label="Test plant effect" onClick={() => window.dispatchEvent(new CustomEvent("gardenActivityTest", { detail: { kind: "plant" } }))} />
                  <TestButton label="Test 3 rapid plants" onClick={() => window.dispatchEvent(new CustomEvent("gardenActivityTest", { detail: { kind: "plant-burst" } }))} />
                  <TestButton label="Clear activity" onClick={() => window.dispatchEvent(new Event("clearGardenActivity"))} />
            </div>
            <button type="button" onClick={resetGarden} className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black">
              <RotateCcw className="h-3.5 w-3.5" /> Reset defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
