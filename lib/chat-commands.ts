// Shared, single-source-of-truth helpers for the incoming Twitch chat path.
// Used by components/chat-integration.tsx (which dispatches normalized messages)
// and components/chat-overlay.tsx (which renders + display-filters them).
//
// IMPORTANT: These helpers only affect DISPLAY filtering in the overlay. They are
// completely independent of command EXECUTION, which happens in chat-integration's
// own if/else chain and is never gated by anything here.

export interface OverlayChatBadges {
  broadcaster: boolean
  moderator: boolean
  vip: boolean
  subscriber: boolean
}

// A single Twitch emote occurrence, resolved to Twitch's CDN image.
export interface OverlayChatEmote {
  id: string
  code: string
  start: number
  end: number
}

export interface NormalizedChatMessage {
  id: string // Twitch message id (tags.id) when present, else a generated fallback
  username: string
  color?: string
  badges: OverlayChatBadges
  message: string
  emotes: OverlayChatEmote[]
  isBot: boolean
  isCommand: boolean // starts with "!"
  isRecognizedCommand: boolean // matches a known project command
  timestamp: number
}

// Every command the overlay recognizes as a "project command", by first token
// (without the leading "!"). Kept in sync with the handlers in chat-integration.tsx.
export const RECOGNIZED_COMMANDS = new Set<string>([
  "resettimer", "hidetimer", "hideworktimer", "hidedark", "hidespin", "hidesj",
  "hidelegend", "hidecelebrate", "hidecasualtrivia", "spin", "djspin", "trick",
  "dark", "worktimer", "timer", "stoptimer", "social", "plant", "water", "watering",
  "rain", "pick", "startgarden", "resetgarden", "hidegarden", "gardenoff", "testspawn",
  "bunny", "celebrate", "flowerboard", "scoreboard", "leaderboard", "guardians",
  "boardofguardians", "guildofguardians", "credits", "hidecredits", "startingsoon",
  "hidestartingsoon", "brb", "back", "hidebrb", "testflowerboard", "testeasteregg",
  "testraid", "hidecelebration", "pridetimer", "casualtrivia", "hidepridetimer",
  "trivia", "nextq", "nextquestion", "frontpage", "answer", "a", "b", "c", "d",
  // Viewer task system (Motivation Monday). "hidetask" is mod-only, enforced in
  // parseTaskCommand — listing it here only affects overlay display filtering.
  "task", "repeat", "done", "hidetask",
])

// Bot / automated accounts hidden from the visible chat by default.
// NOTE: "vbotdancebot" is intentionally excluded (it is a person, not a bot),
// mirroring the existing modInChat exclusion logic.
export const DEFAULT_KNOWN_BOTS = [
  "streamelements", "nightbot", "streamlabs", "moobot", "soundalerts",
  "vernitron", "wizebot", "fossabot", "pretzelrocks",
]

export function isRecognizedCommand(message: string): boolean {
  const trimmed = message.trim().toLowerCase()
  if (!trimmed.startsWith("!")) return false
  const firstToken = trimmed.slice(1).split(/\s+/)[0]
  return RECOGNIZED_COMMANDS.has(firstToken)
}

export function isKnownBot(username: string, extraBots: string[] = []): boolean {
  const lower = username.trim().toLowerCase()
  if (lower === "vbotdancebot") return false // a person, not a bot
  if (DEFAULT_KNOWN_BOTS.includes(lower)) return true
  if (extraBots.map((b) => b.trim().toLowerCase()).includes(lower)) return true
  // Generic heuristic: name ends with "bot".
  if (lower.endsWith("bot")) return true
  return false
}

// Resolve tmi.js emote tags ({ "25": ["0-4", "6-10"] }) into flat occurrences.
export function parseEmotes(
  message: string,
  emoteTag: Record<string, string[]> | null | undefined,
): OverlayChatEmote[] {
  if (!emoteTag) return []
  const result: OverlayChatEmote[] = []
  const chars = Array.from(message) // handle surrogate pairs safely
  for (const [id, ranges] of Object.entries(emoteTag)) {
    for (const range of ranges) {
      const [startStr, endStr] = range.split("-")
      const start = Number.parseInt(startStr, 10)
      const end = Number.parseInt(endStr, 10)
      if (Number.isNaN(start) || Number.isNaN(end)) continue
      const code = chars.slice(start, end + 1).join("")
      result.push({ id, code, start, end })
    }
  }
  return result.sort((a, b) => a.start - b.start)
}

export function twitchEmoteUrl(id: string): string {
  // Twitch static emote CDN (1.0 = small). dark theme background works with light emotes.
  return `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`
}
